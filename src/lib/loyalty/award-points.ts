import type { SupabaseClient } from '@supabase/supabase-js';

/* Crédite les points Glory Club (+10 pts/€) pour une commande. Extrait de
   /api/checkout (qui l'appelait immédiatement, y compris pour un paiement en
   ligne pas encore confirmé) pour être réutilisable par les webhooks
   Stripe/FedaPay : les points d'un paiement carte/mobile money ne doivent
   être crédités qu'une fois le webhook de succès reçu, jamais à la simple
   création de la commande (migration 012 — checkout devient réellement
   asynchrone pour ces deux moyens de paiement). Le paiement à la livraison
   reste crédité immédiatement par l'appelant (rien à confirmer en ligne). */
export async function awardLoyaltyPoints(
  admin: SupabaseClient,
  params: { userId: string; orderId: string; totalCents: number },
): Promise<number> {
  const pointsEarned = Math.floor(params.totalCents / 1000) * 10; // 1€ = 10 pts
  if (pointsEarned <= 0) return 0;

  await admin.rpc('increment_user_points', { p_user_id: params.userId, p_amount: pointsEarned }).then(
    () => {},
    async () => {
      // RPC pas définie → fallback manuel
      const { data } = await admin.from('users').select('points').eq('id', params.userId).single();
      if (data) {
        await admin.from('users').update({ points: data.points + pointsEarned }).eq('id', params.userId);
      }
    },
  );

  await admin.from('glory_club_points_log').insert({
    user_id: params.userId,
    label: `Commande ${params.orderId.slice(0, 8).toUpperCase()}`,
    value: pointsEarned,
    source: 'order',
    reference_id: params.orderId,
  });

  return pointsEarned;
}

/* Restaure le stock d'une commande annulée/refusée (paiement échoué après
   décrément atomique par place_order, ou initiation de paiement en ligne
   jamais aboutie). Best-effort : ne doit jamais faire échouer l'appelant
   (webhook, route checkout) si une ligne a disparu entre-temps. */
export async function restoreOrderStock(admin: SupabaseClient, orderId: string): Promise<void> {
  const { data: items } = await admin
    .from('order_items')
    .select('wig_id, variant_id, quantity')
    .eq('order_id', orderId);

  for (const item of items ?? []) {
    const row = item as { wig_id: string; variant_id: string | null; quantity: number };
    try {
      if (row.variant_id) {
        const { data: v } = await admin.from('wig_variants').select('stock_quantity').eq('id', row.variant_id).maybeSingle();
        if (v) {
          await admin.from('wig_variants').update({ stock_quantity: (v as { stock_quantity: number }).stock_quantity + row.quantity }).eq('id', row.variant_id);
        }
      } else {
        const { data: w } = await admin.from('wigs').select('stock_quantity').eq('id', row.wig_id).maybeSingle();
        if (w) {
          await admin.from('wigs').update({ stock_quantity: (w as { stock_quantity: number }).stock_quantity + row.quantity }).eq('id', row.wig_id);
        }
      }
    } catch (e) {
      console.error('[restoreOrderStock] échec restauration stock (best-effort):', e);
    }
  }
}
