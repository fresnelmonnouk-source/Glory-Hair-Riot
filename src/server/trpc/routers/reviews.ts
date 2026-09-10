/**
 * tRPC router reviews — avis clients + modération (migration 010).
 *
 * Table : reviews (wig_id, user_id, order_id, rating, title, body, status,
 *   verified_purchase, created_at, moderated_at, moderated_by).
 *
 * Remplace les valeurs statiques wigs.rating/review_count (migration 006,
 * codées en dur au seed) par de vrais avis : un trigger SQL (voir migration
 * 009) recalcule ces deux colonnes à chaque changement de `reviews` — cette
 * table est donc désormais la SOURCE DE VÉRITÉ, wigs.rating/review_count
 * n'en sont plus qu'un résumé mis en cache.
 *
 * Endpoints :
 * - listForWig : avis publiés d'un produit (publicProcedure, paginé) — PAS
 *   de jointure vers `users` ici : la RLS de `users` ne donne aucune lecture
 *   publique (seulement self/admin), donc un nom d'auteur serait de toute
 *   façon vide pour un visiteur anonyme. On affiche note/titre/texte/date/
 *   badge "Achat vérifié", jamais l'identité du client.
 * - myReviewForWig : l'avis déjà déposé par l'utilisateur connecté pour ce
 *   produit, s'il existe (pour masquer/adapter le formulaire côté fiche
 *   produit — "un seul avis par utilisateur par produit").
 * - create : dépôt d'avis (protectedProcedure). Vérifie qu'aucun avis
 *   n'existe déjà pour ce (user, wig) et détermine verified_purchase en
 *   cherchant une commande livrée du client contenant ce produit.
 * - listAll : file de modération (adminProcedure) — pending d'abord, puis
 *   l'historique publié/rejeté. Jointure users/wigs sûre ici : ctx.supabase
 *   porte le JWT admin, couvert par users_admin_all (migration 005).
 * - moderate : publish/reject (adminProcedure) — seule façon de faire
 *   passer un avis de 'pending' à 'published'/'rejected' (RLS : l'auteur ne
 *   peut pas se publier lui-même, voir reviews_own_insert en migration 010).
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../init';

/** Résout l'UUID d'un wig actif depuis son slug (même pattern que wishlist.addBySlug). */
async function resolveWigId(
  supabase: SupabaseClient,
  slug: string,
): Promise<string> {
  const { data: wig, error } = await supabase
    .from('wigs')
    .select('id')
    .eq('slug', slug)
    .eq('active', true)
    .single();
  if (error || !wig) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Produit introuvable.' });
  }
  return wig.id as string;
}

export const reviewsRouter = router({
  // ─── Avis publiés d'un produit (public, paginé) ──────────────────
  listForWig: publicProcedure
    .input(z.object({
      slug: z.string(),
      limit: z.number().int().min(1).max(50).default(10),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { data: wig, error: wigError } = await ctx.supabase
        .from('wigs')
        .select('id')
        .eq('slug', input.slug)
        .eq('active', true)
        .maybeSingle();

      // Produit introuvable (ou table `reviews` pas encore migrée côté
      // wigs) : liste vide plutôt qu'une erreur — la fiche produit doit
      // toujours pouvoir s'afficher.
      if (wigError || !wig) {
        return { items: [], total: 0 };
      }

      const { data, count, error } = await ctx.supabase
        .from('reviews')
        .select('id, rating, title, body, verified_purchase, created_at', { count: 'exact' })
        .eq('wig_id', wig.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        // Table `reviews` pas encore créée en prod (migration 010 non
        // appliquée) : ne jamais faire échouer la fiche produit — avis vide.
        return { items: [], total: 0 };
      }

      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Avis déjà déposé par l'utilisateur connecté pour ce produit ──
  myReviewForWig: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: wig } = await ctx.supabase
        .from('wigs')
        .select('id')
        .eq('slug', input.slug)
        .eq('active', true)
        .maybeSingle();
      if (!wig) return null;

      const { data, error } = await ctx.supabase
        .from('reviews')
        .select('id, rating, title, body, status, created_at')
        .eq('wig_id', wig.id)
        .eq('user_id', ctx.user.id)
        .maybeSingle();

      if (error) return null; // table pas encore migrée — pas d'avis existant
      return data ?? null;
    }),

  // ─── Dépôt d'avis ──────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      slug: z.string(),
      rating: z.number().int().min(1).max(5),
      title: z.string().max(120).optional(),
      body: z.string().min(10, 'Votre avis doit faire au moins 10 caractères.').max(4000),
    }))
    .mutation(async ({ ctx, input }) => {
      const wigId = await resolveWigId(ctx.supabase, input.slug);

      const { data: existing, error: existingError } = await ctx.supabase
        .from('reviews')
        .select('id')
        .eq('wig_id', wigId)
        .eq('user_id', ctx.user.id)
        .maybeSingle();

      if (existingError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Impossible de vérifier vos avis existants. Réessayez.',
        });
      }
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Tu as déjà déposé un avis pour ce produit.',
        });
      }

      // Achat vérifié : cherche une commande livrée du client contenant ce
      // produit (le lien order_id sert aussi à afficher le badge plus tard).
      const { data: deliveredItem } = await ctx.supabase
        .from('order_items')
        .select('order_id, orders!inner(id, user_id, status, created_at)')
        .eq('wig_id', wigId)
        .eq('orders.user_id', ctx.user.id)
        .eq('orders.status', 'delivered')
        .order('created_at', { referencedTable: 'orders', ascending: false })
        .limit(1)
        .maybeSingle();

      const orderId = deliveredItem?.order_id ?? null;

      const { data, error } = await ctx.supabase
        .from('reviews')
        .insert({
          wig_id: wigId,
          user_id: ctx.user.id,
          order_id: orderId,
          rating: input.rating,
          title: input.title?.trim() || null,
          body: input.body.trim(),
          verified_purchase: !!orderId,
          status: 'pending',
        })
        .select('id, rating, title, body, status, verified_purchase, created_at')
        .single();

      if (error) {
        // 23505 = violation de la contrainte UNIQUE(wig_id, user_id) —
        // course possible entre le SELECT de vérification et cet INSERT.
        if ((error as { code?: string }).code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: 'Tu as déjà déposé un avis pour ce produit.' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return data;
    }),

  // ─── File de modération (admin) ────────────────────────────────────
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'pending', 'published', 'rejected']).default('all'),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from('reviews')
        .select(
          'id, rating, title, body, status, verified_purchase, created_at, moderated_at, wigs(name, slug), users(full_name, email)',
          { count: 'exact' },
        )
        // pending en premier (file de modération prioritaire), puis le plus récent
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== 'all') {
        q = q.eq('status', input.status);
      }

      const { data, count, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Publier / rejeter un avis ──────────────────────────────────────
  moderate: adminProcedure
    .input(z.object({
      reviewId: z.string().uuid(),
      status: z.enum(['published', 'rejected']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('reviews')
        .update({
          status: input.status,
          moderated_at: new Date().toISOString(),
          moderated_by: ctx.user.id,
        })
        .eq('id', input.reviewId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),
});
