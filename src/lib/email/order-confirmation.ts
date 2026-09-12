import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, renderOrderItemsHTML } from '@/lib/email/send';
import { awardLoyaltyPoints } from '@/lib/loyalty/award-points';
import { getBrandSettings } from '@/lib/settings/service';

/* Email "Commande confirmée" + crédit des points fidélité pour un paiement en
   ligne (Stripe/FedaPay) — appelé depuis les webhooks UNIQUEMENT au moment où
   le paiement est réellement confirmé (migration 012 : plus jamais envoyé à
   la simple création de la commande pour ces deux moyens de paiement). Le
   paiement à la livraison garde son propre envoi immédiat dans
   /api/checkout, ce module n'est pas utilisé pour ce cas. */
export async function sendOrderConfirmedAfterPayment(admin: SupabaseClient, orderId: string): Promise<void> {
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, user_id, guest_email, delivery_name, delivery_street, delivery_city, delivery_postal_code, delivery_country, shipping_method, total_cents')
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr || !order) {
    console.error('[order-confirmation] commande introuvable, email non envoyé:', orderId, orderErr?.message);
    return;
  }

  let toEmail = order.guest_email as string | null;
  let firstName = (order.delivery_name as string).split(' ')[0] ?? '';
  let pointsEarned = 0;

  if (order.user_id) {
    const { data: profile } = await admin.from('users').select('email, full_name').eq('id', order.user_id).maybeSingle();
    if (profile) {
      toEmail = (profile as { email: string }).email;
      firstName = ((profile as { full_name: string | null }).full_name ?? firstName).split(' ')[0] ?? firstName;
    }
    pointsEarned = await awardLoyaltyPoints(admin, {
      userId: order.user_id as string,
      orderId: order.id as string,
      totalCents: order.total_cents as number,
    });
  }

  if (!toEmail) {
    console.error('[order-confirmation] aucune adresse email trouvée pour la commande', orderId);
    return;
  }

  const { data: items } = await admin
    .from('order_items')
    .select('quantity, unit_price_cents, variant_id, wigs:wig_id(name)')
    .eq('order_id', orderId);

  const itemsForEmail = (items ?? []).map((row) => {
    const r = row as unknown as { quantity: number; unit_price_cents: number; variant_id: string | null; wigs: { name: string }[] | null };
    return {
      name: r.wigs?.[0]?.name ?? 'Perruque',
      variant: r.variant_id ? `Variant ${r.variant_id}` : null,
      quantity: r.quantity,
      price_cents: r.unit_price_cents,
    };
  });
  const itemsHTML = renderOrderItemsHTML(itemsForEmail);

  const ref = (order.id as string).slice(0, 8).toUpperCase();
  // Manquait le préfixe /fr/ depuis le passage des routes boutique sous
  // /[lang]/ (Phase 1a) — /compte tout court n'existe plus. Le lang réel du
  // client n'est pas persisté sur `orders`, et les e-mails restent en
  // français pour l'instant (décision explicite du plan i18n) : /fr/ fixe.
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/fr/compte?tab=commandes`;
  const shippingMethod = order.shipping_method as string;
  const brand = await getBrandSettings();

  await sendEmail({
    to: toEmail,
    subject: `Commande confirmée #${ref} · ${brand.name}`,
    template: 'email-order-confirmed.html',
    data: {
      UserName: firstName,
      OrderNumber: ref,
      ItemsHTML: itemsHTML,
      ShippingName: order.delivery_name,
      ShippingAddress: order.delivery_street,
      ShippingCity: order.delivery_city,
      ShippingPostal: order.delivery_postal_code,
      ShippingCountry: order.delivery_country,
      EstimatedDelivery: shippingMethod === 'express' ? '24h' : shippingMethod === 'standard' ? '48h' : 'Sur RDV',
      PointsEarned: pointsEarned,
      OrderURL: orderUrl,
    },
  }).catch((e) => console.error('[order-confirmation] envoi email échoué:', e));
}
