/* Multi-devise (Phase 3, plan i18n/rebrand) — port du principe Sandy Stylish
   confirmé par l'exploration de cette session : la conversion de devise est
   COSMÉTIQUE UNIQUEMENT. Le checkout facture toujours dans la devise réelle
   du paiement (EUR pour Stripe, XOF pour FedaPay) — FCFA/USD affichés au
   visiteur ne sont jamais la devise réellement débitée. Ne PAS construire de
   vrai multi-encaissement : plus gros, et ce n'est même pas ce que fait la
   référence.

   Toutes les valeurs internes de l'app (wigs.base_price, orders.total_cents,
   etc.) restent en CENTIMES D'EURO — cette fonction ne fait QUE l'affichage.

   Fichier volontairement 100% pur (aucun accès Supabase/next/headers) —
   importable aussi bien côté client (admin, composants panier/produit) que
   serveur. `getUsdRate()` (lecture DB) vit dans src/lib/settings/service.ts
   avec les autres lectures de `settings`, jamais ici (même piège que
   dictionaries.ts/client.ts en Phase 1a : un import server-only ferait
   planter le bundle client). */

// Peg officiel EUR/XOF (Banque centrale européenne, fixe depuis 1999,
// franc CFA arrimé à l'euro) — jamais un taux de marché, une vraie constante.
export const PEG_EUR_XOF = 655.957;

// Repli si aucun taux USD n'a jamais été récupéré (ni override admin, ni cron
// jamais exécuté) — évite un affichage cassé/à 0$, mis à jour au besoin.
export const DEFAULT_USD_PER_EUR = 1.08;

export type Currency = 'EUR' | 'XOF' | 'USD';

export interface UsdRateInfo {
  rate: number;
  source: 'override' | 'auto' | 'default';
  autoRate: number | null;
  autoAt: string | null;
}

/** Convertit un montant en centimes d'euro vers le nombre entier de francs CFA (XOF n'a pas de sous-unité). */
export function eurCentsToXof(amountEurCents: number): number {
  return Math.round((amountEurCents / 100) * PEG_EUR_XOF);
}

/** Formatte un montant (en centimes d'euro) dans la devise d'affichage demandée. Jamais utilisé pour calculer un montant à débiter réellement. */
export function formatMoney(amountEurCents: number, currency: Currency, usdRate: number): string {
  const amountEur = amountEurCents / 100;
  if (currency === 'EUR') {
    return `${amountEur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  if (currency === 'XOF') {
    return `${eurCentsToXof(amountEurCents).toLocaleString('fr-FR')} FCFA`;
  }
  // USD
  const amountUsd = amountEur * usdRate;
  return `${amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}
