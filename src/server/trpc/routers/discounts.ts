/**
 * tRPC router discounts — codes promo (table `discount_codes`, migration 001).
 *
 * - `validate` (publicProcedure) : aperçu panier/checkout, lecture seule,
 *   jamais d'écriture. Utilise le service_role (cf. src/lib/discounts/validate.ts
 *   pour la raison : la policy RLS publique masque déjà les codes inactifs/
 *   expirés, ce qui empêcherait de distinguer "inconnu" d'"expiré").
 *   La RE-validation faisant foi pour la commande a lieu côté serveur dans
 *   /api/checkout, jamais confiance dans un montant envoyé par le client.
 *
 * - listDiscountCodes / createDiscountCode / updateDiscountCode /
 *   deleteDiscountCode (adminProcedure) : CRUD admin pour /admin/promos.
 *   Écritures bloquées par RLS tant que la migration 009
 *   (discount_codes_admin_all, policy public.is_admin()) n'est pas appliquée
 *   par Fresnel dans le Dashboard Supabase — ctx.supabase ici est le client
 *   RLS-scopé de l'utilisateur admin connecté (pattern identique au reste de
 *   adminRouter), pas un client service_role.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../init';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DiscountValidationError, validateDiscountCode } from '@/lib/discounts/validate';

function mapDiscountError(err: unknown): TRPCError {
  if (err instanceof DiscountValidationError) {
    return new TRPCError({
      code: err.reason === 'NOT_FOUND' ? 'NOT_FOUND' : 'BAD_REQUEST',
      message: err.message,
    });
  }
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: err instanceof Error ? err.message : 'Erreur inattendue lors de la vérification du code promo.',
  });
}

export const discountsRouter = router({
  // ─── Validation d'un code promo (aperçu panier/checkout) ─────────
  validate: publicProcedure
    .input(z.object({
      code: z.string().min(1).max(60),
      subtotalCents: z.number().int().min(0),
    }))
    .mutation(async ({ input }) => {
      const admin = await createServerSupabaseClient(true);
      try {
        const result = await validateDiscountCode(admin, input.code, input.subtotalCents);
        return {
          code: result.code,
          discountType: result.discountType,
          discountValue: result.discountValue,
          discountCents: result.discountCents,
        };
      } catch (err) {
        throw mapDiscountError(err);
      }
    }),

  // ─── Admin : liste des codes promo ────────────────────────────────
  listDiscountCodes: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('discount_codes')
      .select('id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  // ─── Admin : créer un code promo ──────────────────────────────────
  createDiscountCode: adminProcedure
    .input(z.object({
      code: z.string().trim().min(2).max(40),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().int().min(1),
      maxUses: z.number().int().min(1).nullable().optional(),
      validFrom: z.string().nullable().optional(),
      validUntil: z.string().nullable().optional(),
      active: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.discountType === 'percentage' && input.discountValue > 100) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Une réduction en pourcentage ne peut pas dépasser 100.' });
      }

      const { data, error } = await ctx.supabase
        .from('discount_codes')
        .insert({
          code: input.code.toUpperCase(),
          discount_type: input.discountType,
          discount_value: input.discountValue,
          max_uses: input.maxUses ?? null,
          valid_from: input.validFrom ?? null,
          valid_until: input.validUntil ?? null,
          active: input.active,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: 'Ce code promo existe déjà.' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  // ─── Admin : mettre à jour un code promo (patch partiel) ──────────
  updateDiscountCode: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      patch: z.object({
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().int().min(1).optional(),
        maxUses: z.number().int().min(1).nullable().optional(),
        validFrom: z.string().nullable().optional(),
        validUntil: z.string().nullable().optional(),
        active: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.patch.discountType === 'percentage' && (input.patch.discountValue ?? 0) > 100) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Une réduction en pourcentage ne peut pas dépasser 100.' });
      }

      const patch: Record<string, unknown> = {};
      if (input.patch.discountType !== undefined) patch.discount_type = input.patch.discountType;
      if (input.patch.discountValue !== undefined) patch.discount_value = input.patch.discountValue;
      if (input.patch.maxUses !== undefined) patch.max_uses = input.patch.maxUses;
      if (input.patch.validFrom !== undefined) patch.valid_from = input.patch.validFrom;
      if (input.patch.validUntil !== undefined) patch.valid_until = input.patch.validUntil;
      if (input.patch.active !== undefined) patch.active = input.patch.active;

      if (Object.keys(patch).length === 0) return { ok: true };

      const { error } = await ctx.supabase.from('discount_codes').update(patch).eq('id', input.id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Admin : supprimer un code promo (désactive si déjà utilisé) ──
  // Même logique de prudence que la suppression de produit ailleurs dans ce
  // projet : un code avec current_uses > 0 est référencé par des commandes
  // réelles (discount_cents figé au moment de l'achat) — le supprimer
  // casserait l'historique. On désactive à la place.
  deleteDiscountCode: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchErr } = await ctx.supabase
        .from('discount_codes')
        .select('id, current_uses')
        .eq('id', input.id)
        .maybeSingle();

      if (fetchErr) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: fetchErr.message });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Code promo introuvable.' });

      if ((existing.current_uses ?? 0) > 0) {
        const { error } = await ctx.supabase.from('discount_codes').update({ active: false }).eq('id', input.id);
        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return { ok: true, deactivated: true as const };
      }

      const { error } = await ctx.supabase.from('discount_codes').delete().eq('id', input.id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true, deleted: true as const };
    }),
});
