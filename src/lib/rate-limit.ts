/**
 * Rate limiter en mémoire — sliding window.
 *
 * Utilisation : anti-abuse léger pour endpoints publics (tryon anon, newsletter).
 *
 * Limites :
 * - Reset au redémarrage du process Next.js (acceptable pour MVP, à remplacer
 *   par Upstash Redis ou Vercel KV en prod multi-instance).
 * - Mémoire bornée : auto-cleanup des entrées expirées à chaque check.
 *
 * Usage :
 *   const r = checkLimit(`tryon:${ip}`, 2, 24 * 3600 * 1000);
 *   if (!r.allowed) return 429 with r.resetMs;
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Cleanup automatique : si trop de keys, on purge les expired. */
const MAX_BUCKETS = 10_000;

function cleanupIfNeeded() {
  if (buckets.size < MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, b] of buckets) {
    // Drop bucket si tout est plus vieux que 7 jours (fallback safety)
    if (b.timestamps.length === 0 || now - b.timestamps[b.timestamps.length - 1]! > 7 * 86400_000) {
      buckets.delete(key);
    }
  }
}

export interface LimitResult {
  allowed: boolean;
  remaining: number;     // essais restants dans la fenêtre courante
  resetMs: number;       // ms avant que le 1er timestamp expire (si bloqué) ou 0 si libre
}

/**
 * Vérifie + incrémente le compteur si autorisé.
 * @param key       Identifiant unique (ex: `tryon:1.2.3.4`)
 * @param max       Nombre max d'événements dans la fenêtre
 * @param windowMs  Durée de la fenêtre en ms (ex: 24h = 86400000)
 */
export function checkLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  // Purge les timestamps hors fenêtre
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0]!;
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + windowMs - now,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  cleanupIfNeeded();

  return {
    allowed: true,
    remaining: max - bucket.timestamps.length,
    resetMs: 0,
  };
}

/**
 * Extrait l'IP du request Next.js (priorité X-Forwarded-For > X-Real-IP > fallback).
 * En dev local : retourne 'localhost'.
 */
export function getRequestIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  return 'localhost';
}

/** Formate une durée en ms vers "Xh Ym" pour un message user-friendly. */
export function formatResetDuration(ms: number): string {
  if (ms <= 0) return 'maintenant';
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
