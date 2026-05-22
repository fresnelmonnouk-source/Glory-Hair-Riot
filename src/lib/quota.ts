/**
 * Quota Essai Live — logique partagée entre /essayage (marketing) et /essayage/live (app).
 *
 * Spec : Glory Hair systeme.md §3.4
 * - Visiteur anonyme : 2 essais Premium gratuits par appareil (24h sliding window)
 * - Visiteur connecté : 5 essais Premium gratuits au total (re-créditables via Glory Club)
 *
 * Stockage actuel (provisoire) : localStorage côté client.
 * Phase 5 : migration vers table Supabase `tryon_quotas` pour les comptes.
 */

export const QUOTA_LIMIT_ANON = 2;
export const QUOTA_LIMIT_LOGGED = 5;
export const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const STORAGE_KEY_ANON = 'gh-tryon-quota';
const STORAGE_KEY_LOGGED = 'gh-tryon-quota-logged'; // remplacé par DB Phase 5

export type QuotaMode = 'anon' | 'logged';

export interface QuotaState {
  count: number;     // essais consommés
  limit: number;     // total autorisé
  remaining: number; // limit - count
  resetAt: number | null; // timestamp ms (anon uniquement)
  mode: QuotaMode;
}

/** Lit le quota courant. SSR-safe (retourne fresh quota côté serveur). */
export function readQuota(mode: QuotaMode = 'anon'): QuotaState {
  const limit = mode === 'logged' ? QUOTA_LIMIT_LOGGED : QUOTA_LIMIT_ANON;
  if (typeof window === 'undefined') {
    return { count: 0, limit, remaining: limit, resetAt: null, mode };
  }
  const key = mode === 'logged' ? STORAGE_KEY_LOGGED : STORAGE_KEY_ANON;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { count: 0, limit, remaining: limit, resetAt: null, mode };
    const parsed = JSON.parse(raw) as { count?: number; resetAt?: number };
    const now = Date.now();
    // Window expiration (anon uniquement)
    if (mode === 'anon' && parsed.resetAt && now > parsed.resetAt) {
      window.localStorage.removeItem(key);
      return { count: 0, limit, remaining: limit, resetAt: null, mode };
    }
    const count = Math.max(0, Math.min(parsed.count ?? 0, limit));
    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: parsed.resetAt ?? null,
      mode,
    };
  } catch {
    return { count: 0, limit, remaining: limit, resetAt: null, mode };
  }
}

/** Incrémente le compteur après un essai consommé. Retourne le nouveau state. */
export function bumpQuota(mode: QuotaMode = 'anon'): QuotaState {
  const current = readQuota(mode);
  const newCount = Math.min(current.count + 1, current.limit);
  const resetAt = mode === 'anon' ? (current.resetAt ?? Date.now() + QUOTA_WINDOW_MS) : null;
  if (typeof window !== 'undefined') {
    const key = mode === 'logged' ? STORAGE_KEY_LOGGED : STORAGE_KEY_ANON;
    window.localStorage.setItem(key, JSON.stringify({ count: newCount, resetAt }));
  }
  return {
    count: newCount,
    limit: current.limit,
    remaining: Math.max(0, current.limit - newCount),
    resetAt,
    mode,
  };
}

/** Reset manuel (utile pour tests ou bouton "regénérer mon quota"). */
export function resetQuota(mode: QuotaMode = 'anon'): void {
  if (typeof window === 'undefined') return;
  const key = mode === 'logged' ? STORAGE_KEY_LOGGED : STORAGE_KEY_ANON;
  window.localStorage.removeItem(key);
}

/** Détermine la URL de destination CTA selon état (quota + connecté). */
export function getLiveCtaHref(state: QuotaState): string {
  if (state.remaining > 0) return '/essayage/live?mode=free';
  return '/essayage/live?mode=paid&price=499';
}

/** Label CTA selon état. */
export function getLiveCtaLabel(state: QuotaState): string {
  if (state.remaining > 0) return '▶ Lancer mon essai gratuit';
  return '▶ Lancer un essai · 4,99 €';
}
