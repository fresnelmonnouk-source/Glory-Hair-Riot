/**
 * tRPC router tryon — historique des essais virtuels + quota.
 *
 * Table : tryon_results (déjà existante depuis V1)
 *   - user_id, wig_id, snapshot_url, face_landmarks, shared, share_token, created_at
 *
 * Table : tryon_quotas (source de vérité serveur du quota essai virtuel)
 *   - user_id, used_count, granted, last_used_at, updated_at
 *
 * Endpoints :
 * - history.list : derniers essais de l'user avec jointure wigs
 * - history.count : nombre total
 * - quota : solde réel { used, granted } lu depuis tryon_quotas (même table et
 *   même défaut `granted ?? 5` que /api/tryon/route.ts — c'est la SEULE source
 *   de vérité pour un utilisateur connecté, à consommer côté client via
 *   trpc.tryon.quota.useQuery() plutôt qu'un compteur localStorage)
 *
 * Note : la création d'un essai (INSERT tryon_results) et le bump du quota
 * (UPSERT tryon_quotas) se font dans /api/tryon après la génération IA
 * réussie — pas dans ce router.
 */

import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const tryonRouter = router({
  /**
   * Solde réel du quota essai virtuel pour l'utilisateur connecté.
   * Défaut { used: 0, granted: 5 } si aucune ligne tryon_quotas n'existe
   * encore (utilisateur qui n'a jamais fait d'essai) — 5 = même défaut que
   * `quotaRow?.granted ?? 5` dans /api/tryon/route.ts.
   */
  quota: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('tryon_quotas')
      .select('used_count, granted')
      .eq('user_id', ctx.user.id)
      .single();

    // PGRST116 = aucune ligne (utilisateur sans essai encore) — pas une erreur,
    // c'est l'état par défaut avant le premier essai.
    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    return {
      used: data?.used_count ?? 0,
      granted: data?.granted ?? 5,
    };
  }),

  history: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().max(50).default(10),
        }).optional(),
      )
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 10;
        const { data, error } = await ctx.supabase
          .from('tryon_results')
          .select('id, wig_id, snapshot_url, shared, share_token, created_at, wigs(slug, name)')
          .eq('user_id', ctx.user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return data ?? [];
      }),

    count: protectedProcedure.query(async ({ ctx }) => {
      const { count, error } = await ctx.supabase
        .from('tryon_results')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return count ?? 0;
    }),
  }),
});
