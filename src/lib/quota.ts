/**
 * Quota Essai Live — anonyme uniquement.
 *
 * Le solde réel :
 * - Utilisateur connecté → table Supabase `tryon_quotas`, exposée via
 *   trpc.tryon.quota (voir src/server/trpc/routers/tryon.ts). Ne PAS dupliquer
 *   ce calcul ici — lire l'API tRPC directement dans les composants
 *   (TryonFlow.tsx, TryonMarketing.tsx).
 * - Visiteur anonyme → rate-limit IP côté serveur (src/lib/rate-limit.ts +
 *   /api/tryon/route.ts, checkLimit). Le serveur ne peut PAS être interrogé à
 *   l'avance pour connaître un « solde » anonyme (ce n'est pas une valeur
 *   consultable, juste une décision prise au moment de l'appel). Ce module se
 *   contente donc de mémoriser la DERNIÈRE DÉCISION réelle du serveur (succès
 *   ou 429 RATE_LIMITED) pour ne jamais afficher un compteur qui s'incrémente
 *   de façon indépendante et pourrait mentir à l'utilisateur.
 *
 * Historique : avant refonte, ce fichier ET TryonFlow.tsx maintenaient chacun
 * leur propre compteur localStorage sous la MÊME clé 'gh-tryon-quota',
 * totalement déconnecté de la décision serveur → pouvait diverger (autre
 * appareil, cache vidé, plusieurs onglets, essai compté serveur mais raté
 * client avant écriture locale...). Remplacé par ce mécanisme "dernière
 * valeur connue", écrit uniquement en réaction à une vraie réponse serveur.
 */

export const ANON_TRIAL_LIMIT = 1; // doit rester cohérent avec checkLimit(`tryon:${ip}`, 1, ...) dans /api/tryon/route.ts

const STORAGE_KEY_ANON_LAST_KNOWN = 'gh-tryon-anon-last-known';

export interface LastKnownAnonQuota {
  usedUp: boolean;
  retryAfterMs?: number;
  checkedAt: number;
}

/**
 * Lit la dernière décision RÉELLE du serveur pour un visiteur anonyme sur cet
 * appareil. `null` = jamais consulté sur cet appareil — ce n'est PAS une
 * preuve qu'il reste un essai (l'IP peut déjà être bloquée sur un autre
 * appareil), juste "on ne sait pas encore, il faudra tenter l'appel". SSR-safe.
 */
export function readLastKnownAnonQuota(): LastKnownAnonQuota | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ANON_LAST_KNOWN);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastKnownAnonQuota>;
    if (typeof parsed.usedUp !== 'boolean') return null;
    return {
      usedUp: parsed.usedUp,
      retryAfterMs: typeof parsed.retryAfterMs === 'number' ? parsed.retryAfterMs : undefined,
      checkedAt: typeof parsed.checkedAt === 'number' ? parsed.checkedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Mémorise la dernière décision RÉELLE du serveur — à appeler juste après une réponse /api/tryon (succès ou 429 RATE_LIMITED), jamais de façon spéculative. */
export function writeLastKnownAnonQuota(state: LastKnownAnonQuota): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_ANON_LAST_KNOWN, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

/** Destination du CTA marketing selon l'état de quota connu (bloqué = dernier essai gratuit déjà consommé/refusé par le serveur). */
export function getLiveCtaHref(blocked: boolean, lang: string = 'fr'): string {
  return blocked ? `/${lang}/essayage/live?mode=paid&price=499` : `/${lang}/essayage/live?mode=free`;
}

/** Label du CTA marketing selon l'état de quota connu. */
export function getLiveCtaLabel(blocked: boolean): string {
  return blocked ? '▶ Lancer un essai · 4,99 €' : '▶ Lancer mon essai gratuit';
}
