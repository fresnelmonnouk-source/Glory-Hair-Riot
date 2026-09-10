/* Validation partagée des codes promo (table `discount_codes`, migration 001).
 *
 * Lecture TOUJOURS en service_role (bypass RLS) : la policy publique
 * `discount_codes_public_select` (migration 001) filtre déjà les lignes
 * inactives/expirées au niveau SQL — un client anon qui interroge un code
 * inactif ou expiré reçoit simplement "aucune ligne", indiscernable d'un
 * code qui n'a jamais existé. Pour renvoyer une erreur explicite (inconnu /
 * inactif / pas encore actif / expiré / épuisé), la lecture doit contourner
 * cette policy — d'où le service_role ici, y compris pour la procédure tRPC
 * PUBLIQUE `discounts.validate` (elle ne fait que LIRE, jamais écrire).
 *
 * Utilisé par :
 *  - src/server/trpc/routers/discounts.ts (`validate`, aperçu panier/checkout)
 *  - src/app/api/checkout/route.ts (RE-validation serveur obligatoire au
 *    moment de la commande — jamais confiance dans un montant envoyé par le
 *    client).
 *
 * N'incrémente JAMAIS `current_uses` — voir incrementDiscountCodeUsage,
 * appelée uniquement après la création réussie d'une commande.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type DiscountType = 'percentage' | 'fixed';

export type DiscountErrorReason =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'EXHAUSTED';

const REASON_MESSAGE: Record<DiscountErrorReason, string> = {
  NOT_FOUND: 'Code promo inconnu.',
  INACTIVE: "Ce code promo n'est plus actif.",
  NOT_YET_VALID: "Ce code promo n'est pas encore actif.",
  EXPIRED: 'Ce code promo a expiré.',
  EXHAUSTED: "Ce code promo a atteint son nombre maximum d'utilisations.",
};

export class DiscountValidationError extends Error {
  reason: DiscountErrorReason;
  constructor(reason: DiscountErrorReason) {
    super(REASON_MESSAGE[reason]);
    this.name = 'DiscountValidationError';
    this.reason = reason;
  }
}

interface DiscountRow {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
}

export interface DiscountValidationResult {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountCents: number;
}

/** Montant de réduction réel — jamais négatif, jamais supérieur au sous-total. */
export function computeDiscountCents(
  row: Pick<DiscountRow, 'discount_type' | 'discount_value'>,
  subtotalCents: number,
): number {
  const raw =
    row.discount_type === 'percentage'
      ? Math.round((subtotalCents * row.discount_value) / 100)
      : row.discount_value;
  return Math.max(0, Math.min(raw, subtotalCents));
}

/**
 * Valide un code promo pour un sous-total donné (en centimes).
 * Throw DiscountValidationError avec un `reason` explicite si invalide.
 */
export async function validateDiscountCode(
  admin: SupabaseClient,
  rawCode: string,
  subtotalCents: number,
): Promise<DiscountValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new DiscountValidationError('NOT_FOUND');

  const { data: row, error } = await admin
    .from('discount_codes')
    .select('id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, active')
    .eq('code', code)
    .maybeSingle<DiscountRow>();

  if (error) throw error;
  if (!row) throw new DiscountValidationError('NOT_FOUND');
  if (!row.active) throw new DiscountValidationError('INACTIVE');

  const now = Date.now();
  if (row.valid_from && new Date(row.valid_from).getTime() > now) {
    throw new DiscountValidationError('NOT_YET_VALID');
  }
  if (row.valid_until && new Date(row.valid_until).getTime() < now) {
    throw new DiscountValidationError('EXPIRED');
  }
  if (row.max_uses != null && (row.current_uses ?? 0) >= row.max_uses) {
    throw new DiscountValidationError('EXHAUSTED');
  }

  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    discountCents: computeDiscountCents(row, subtotalCents),
  };
}

/**
 * Incrémente `current_uses` d'un code promo — à appeler UNIQUEMENT après la
 * création réussie d'une commande (jamais avant : une commande qui échoue ne
 * doit pas consommer un usage). Best-effort : ne throw jamais, un échec ici
 * ne doit jamais invalider une commande déjà confirmée.
 */
export async function incrementDiscountCodeUsage(admin: SupabaseClient, discountCodeId: string): Promise<void> {
  const { data } = await admin
    .from('discount_codes')
    .select('current_uses')
    .eq('id', discountCodeId)
    .maybeSingle();
  if (!data) return;
  await admin
    .from('discount_codes')
    .update({ current_uses: (data.current_uses ?? 0) + 1 })
    .eq('id', discountCodeId);
}
