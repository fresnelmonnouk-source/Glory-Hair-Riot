import { createServerSupabaseClient } from '@/lib/supabase/server';

/* Rafraîchissement quotidien du taux EUR→USD (Phase 3, multi-devise) —
   bundlé dans le cron existant /api/cron/expire-orders (jamais un nouveau
   cron : Sandy Stylish bundle exprès les deux tâches dans le même créneau,
   décision actée dans le plan i18n/rebrand). Marge de sécurité 2% : fait
   TOUJOURS monter légèrement le prix USD affiché, jamais l'inverse — un
   visiteur voit un prix légèrement majoré plutôt que l'inverse (jamais
   sous-évaluer par rapport au taux réel). */

const SAFETY_MARGIN = 1.02;

// Bornes de sanité : un taux hors de cette plage est rejeté (donnée
// fournisseur aberrante) plutôt que d'écraser un taux valide existant.
const MIN_SANE_RATE = 0.7;
const MAX_SANE_RATE = 1.6;

async function fetchFromFrankfurter(): Promise<number | null> {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.USD;
    return typeof rate === 'number' ? rate : null;
  } catch {
    return null;
  }
}

async function fetchFromOpenErApi(): Promise<number | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.USD;
    return typeof rate === 'number' ? rate : null;
  } catch {
    return null;
  }
}

export interface FxRefreshResult {
  updated: boolean;
  rate: number | null;
  reason?: string;
}

/** Récupère le taux EUR→USD réel (Frankfurter, repli open.er-api), applique la marge de sécurité, et l'écrit dans settings.usd_rate_auto — jamais touché à usd_rate (l'override admin reste prioritaire, voir getUsdRate()). */
export async function refreshUsdRate(): Promise<FxRefreshResult> {
  const rawRate = (await fetchFromFrankfurter()) ?? (await fetchFromOpenErApi());

  if (rawRate == null) {
    console.warn('[fx-cron] aucun fournisseur de taux disponible, usd_rate_auto inchangé.');
    return { updated: false, rate: null, reason: 'NO_PROVIDER' };
  }
  if (!Number.isFinite(rawRate) || rawRate < MIN_SANE_RATE || rawRate > MAX_SANE_RATE) {
    console.warn(`[fx-cron] taux EUR/USD hors bornes de sanité (${rawRate}), rejeté — usd_rate_auto inchangé.`);
    return { updated: false, rate: null, reason: 'OUT_OF_BOUNDS' };
  }

  const rateWithMargin = Number((rawRate * SAFETY_MARGIN).toFixed(4));
  const supabase = await createServerSupabaseClient(true);
  const now = new Date().toISOString();
  const { error } = await supabase.from('settings').upsert([
    { key: 'usd_rate_auto', value: String(rateWithMargin), updated_at: now },
    { key: 'usd_rate_auto_at', value: now, updated_at: now },
  ], { onConflict: 'key' });

  if (error) {
    console.error('[fx-cron] échec écriture usd_rate_auto:', error.message);
    return { updated: false, rate: null, reason: 'DB_WRITE_FAILED' };
  }

  return { updated: true, rate: rateWithMargin };
}
