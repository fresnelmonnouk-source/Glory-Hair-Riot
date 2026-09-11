/**
 * tRPC router siteSettings — réglages "publics" de la boutique (pas des
 * secrets, contrairement aux clés de paiement gérées par
 * admin.{get,save}PaymentSettings). Gap trouvé dans l'audit de parité vs
 * Sandy Stylish : /admin/reglages n'avait aucun champ WhatsApp (numéro
 * codé en dur dans SavRiot.tsx, valeur placeholder jamais vérifiée par
 * Fresnel).
 *
 * `settings` (migration 006) n'a aucune policy SELECT publique — getPublic
 * lit donc en service_role (src/lib/settings/service.ts) et ne renvoie QUE
 * les clés listées ici, jamais la table entière (les clés secrètes Stripe/
 * FedaPay restent inatteignables par ce chemin).
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, adminProcedure } from '../init';
import { getWhatsappNumber } from '@/lib/settings/service';

export const siteSettingsRouter = router({
  getPublic: publicProcedure.query(async () => {
    return { whatsappNumber: await getWhatsappNumber() };
  }),

  save: adminProcedure
    .input(z.object({ whatsapp_number: z.string().max(40) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.from('settings').upsert({
        key: 'whatsapp_number',
        value: input.whatsapp_number.trim(),
        updated_at: new Date().toISOString(),
        updated_by: ctx.user.id,
      }, { onConflict: 'key' });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),
});
