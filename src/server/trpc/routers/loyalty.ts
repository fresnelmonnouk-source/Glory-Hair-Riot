import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

/**
 * Router loyalty — historique RÉEL des points Glory Club.
 *
 * Remplace le `PTS_LOG` codé en dur de FideliteRiot.tsx (dates/commandes
 * fictives ne correspondant jamais au vrai solde de points affiché) — la
 * table `glory_club_points_log` existe et est déjà alimentée réellement
 * (signup +50 via handle_new_user, +10/€ via awardLoyaltyPoints à chaque
 * commande confirmée) mais n'était jamais lue par aucune page (audit
 * "retirer les données mockées", 2026-09-13).
 */
export const loyaltyRouter = router({
  pointsLog: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('glory_club_points_log')
        .select('id, label, value, source, created_at')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(input?.limit ?? 10);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),
});
