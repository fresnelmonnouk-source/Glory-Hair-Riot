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
import { getWhatsappNumber, getBrandSettings, getUsdRate } from '@/lib/settings/service';
import { PEG_EUR_XOF } from '@/lib/money';

export const siteSettingsRouter = router({
  getPublic: publicProcedure.query(async () => {
    const [whatsappNumber, brand, usdRate] = await Promise.all([getWhatsappNumber(), getBrandSettings(), getUsdRate()]);
    return { whatsappNumber, brand, usdRate };
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

  // ─── Identité de marque (rebrand, Phase 2) ───────
  // Toutes ces clés sont PUBLIQUES en lecture (contrairement aux clés
  // Stripe/FedaPay) : une identité légale doit être visible publiquement
  // (mentions légales), donc getPublic les renvoie directement, jamais
  // masquées derrière un "configuré ou non" comme pour les secrets de
  // paiement. Champs vides acceptés (pas encore renseignés par Fresnel) —
  // chaque surface d'affichage gère elle-même l'absence de valeur.
  saveBrand: adminProcedure
    .input(z.object({
      brand_name: z.string().max(80),
      brand_legal_name: z.string().max(200),
      brand_legal_form: z.string().max(80),
      brand_siret: z.string().max(40),
      brand_legal_address: z.string().max(300),
      brand_legal_contact_email: z.string().max(200).refine(
        (v) => v === '' || z.string().email().safeParse(v).success,
        'Adresse e-mail invalide.',
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      const rows = Object.entries(input).map(([key, value]) => ({
        key,
        value: value.trim(),
        updated_at: new Date().toISOString(),
        updated_by: ctx.user.id,
      }));
      const { error } = await ctx.supabase.from('settings').upsert(rows, { onConflict: 'key' });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Taux USD affiché (multi-devise, Phase 3) ────
  // L'admin raisonne naturellement en "1 dollar = combien de FCFA" (marché
  // ouest-africain) — converti ici vers usd_rate (USD par EUR, la base de
  // calcul de formatMoney) via le peg EUR/XOF FIXE. `xof_per_usd` vide
  // efface l'override et retombe sur le taux automatique du cron.
  saveUsdRate: adminProcedure
    .input(z.object({ xof_per_usd: z.string().max(20) }))
    .mutation(async ({ ctx, input }) => {
      const raw = input.xof_per_usd.trim();
      let usdRateValue = '';
      if (raw !== '') {
        const xofPerUsd = Number(raw);
        if (!Number.isFinite(xofPerUsd) || xofPerUsd <= 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Taux invalide : indiquez un nombre de FCFA positif.' });
        }
        usdRateValue = String(Number((PEG_EUR_XOF / xofPerUsd).toFixed(6)));
      }

      const { error } = await ctx.supabase.from('settings').upsert({
        key: 'usd_rate',
        value: usdRateValue,
        updated_at: new Date().toISOString(),
        updated_by: ctx.user.id,
      }, { onConflict: 'key' });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),
});
