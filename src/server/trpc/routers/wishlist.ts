/**
 * tRPC router wishlist — gestion des produits favoris par utilisateur.
 *
 * Table : wishlist_items (user_id, wig_id, created_at) — UNIQUE(user_id, wig_id)
 *
 * Endpoints :
 * - list : items de l'user logged avec jointure wigs
 * - count : nombre d'items (pour badge NavRiot)
 * - add : ajout idempotent (ON CONFLICT DO NOTHING)
 * - remove : suppression par wig_id
 * - toggle : add si absent, remove si présent
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const wishlistRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('wishlist_items')
      .select('id, wig_id, created_at, wigs(id, slug, name, base_price, category)')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  count: protectedProcedure.query(async ({ ctx }) => {
    const { count, error } = await ctx.supabase
      .from('wishlist_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return count ?? 0;
  }),

  add: protectedProcedure
    .input(z.object({ wigId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('wishlist_items')
        .upsert(
          { user_id: ctx.user.id, wig_id: input.wigId },
          { onConflict: 'user_id,wig_id', ignoreDuplicates: true },
        );
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  /** Add via wig slug (utilisé côté client où on stocke le slug). */
  addBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: wig, error: wigErr } = await ctx.supabase
        .from('wigs')
        .select('id')
        .eq('slug', input.slug)
        .single();
      if (wigErr || !wig) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wig introuvable' });

      const { error } = await ctx.supabase
        .from('wishlist_items')
        .upsert(
          { user_id: ctx.user.id, wig_id: wig.id },
          { onConflict: 'user_id,wig_id', ignoreDuplicates: true },
        );
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  remove: protectedProcedure
    .input(z.object({ wigId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', ctx.user.id)
        .eq('wig_id', input.wigId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ wigId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', ctx.user.id)
        .eq('wig_id', input.wigId)
        .maybeSingle();

      if (existing) {
        await ctx.supabase
          .from('wishlist_items')
          .delete()
          .eq('id', existing.id);
        return { ok: true, action: 'removed' as const };
      }
      await ctx.supabase
        .from('wishlist_items')
        .insert({ user_id: ctx.user.id, wig_id: input.wigId });
      return { ok: true, action: 'added' as const };
    }),
});
