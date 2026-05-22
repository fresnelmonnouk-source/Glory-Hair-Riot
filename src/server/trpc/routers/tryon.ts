/**
 * tRPC router tryon — historique des essais virtuels.
 *
 * Table : tryon_results (déjà existante depuis V1)
 *   - user_id, wig_id, snapshot_url, face_landmarks, shared, share_token, created_at
 *
 * Endpoints :
 * - history.list : derniers essais de l'user avec jointure wigs
 * - history.count : nombre total
 *
 * Note : la création d'un essai (INSERT tryon_results) se fait dans
 * /api/tryon après la génération IA réussie — pas dans ce router.
 */

import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const tryonRouter = router({
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
