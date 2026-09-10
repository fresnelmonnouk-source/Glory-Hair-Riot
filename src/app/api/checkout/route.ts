/* /api/checkout — Création de commande.
 *
 * Réécrit le 2026-09-10 (audit de parité vs Sandy Stylish → 2 failles
 * réelles trouvées et corrigées ici) :
 *   1. AVANT : le total était calculé depuis price_at_added envoyé par le
 *      CLIENT — falsifiable. MAINTENANT : le prix est recalculé côté DB par
 *      le RPC atomique `place_order` (migration 012), jamais fait confiance
 *      au navigateur.
 *   2. AVANT : le stock n'était jamais décrémenté (survente illimitée).
 *      MAINTENANT : décrémenté ATOMIQUEMENT par le même RPC (verrouillage
 *      FOR UPDATE, rollback natif si rupture).
 *   3. AVANT : payment_method='stripe'|'fedapay' marquait direct
 *      status='paid' SANS jamais appeler l'API réelle ("MVP mock payment").
 *      MAINTENANT : la commande reste 'pending' jusqu'à confirmation par
 *      webhook (déjà correct, juste jamais déclenché avant) ; ce endpoint
 *      initie un vrai Stripe Checkout Session (redirection hébergée) ou une
 *      vraie transaction FedaPay, et renvoie `redirectUrl` au client.
 *
 * Flow :
 *   1. POST { items[], address, shipping, payment_method, discount_code? }
 *   2. Auth optionnelle — checkout invité supporté (comme Sandy Stylish).
 *   3. Résout wig.id via wig.slug (pour le RPC + les emails).
 *   4. RPC place_order → commande + lignes créées, stock décrémenté, prix
 *      recalculé serveur. Retourne { order_id, subtotal_cents }.
 *   5. Code promo re-validé serveur sur ce subtotal_cents autoritaire.
 *   6. UPDATE de la commande : livraison/adresse/paiement/total final.
 *   7. cod → payé à la livraison, points crédités immédiatement, email envoyé.
 *      stripe/fedapay → paiement réel initié ; en cas d'échec d'INITIATION,
 *      compensation (stock restauré, commande supprimée). Le succès réel
 *      (points + email "confirmée") arrive uniquement via webhook.
 *
 * Toutes les écritures passent par service_role (RLS reste stricte pour les
 * accès directs PostgREST), ce endpoint valide le payload lui-même (zod).
 *
 * Limite connue, pas dans le périmètre de ce fix (déjà trackée séparément
 * dans le backlog "multi-devise") : FedaPay reçoit total_cents (centimes
 * EUR) tel quel comme montant XOF — pas de vraie conversion de devise.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, sendAdminEmail, renderOrderItemsHTML } from '@/lib/email/send';
import { DiscountValidationError, incrementDiscountCodeUsage, validateDiscountCode } from '@/lib/discounts/validate';
import { awardLoyaltyPoints, restoreOrderStock } from '@/lib/loyalty/award-points';
import { createCheckoutSession } from '@/server/services/payment/stripe.service';
import { createTransaction } from '@/server/services/payment/fedapay.service';

export const runtime = 'nodejs';

const BodySchema = z.object({
  items: z.array(z.object({
    wig_slug: z.string(),           // 'velours' / 'ginger' / etc.
    variant_id: z.string().nullable().optional(),
    quantity: z.number().int().min(1).max(20),
    price_at_added: z.number().int().min(0), // cents — conservé pour compat payload, jamais utilisé pour le calcul (voir place_order)
  })).min(1).max(20),
  address: z.object({
    email: z.string().email(),
    prenom: z.string().min(1).max(80),
    nom: z.string().min(1).max(80),
    adresse: z.string().min(1).max(200),
    ville: z.string().min(1).max(80),
    codePostal: z.string().min(1).max(20),
    pays: z.string().min(1).max(80),
    telephone: z.string().max(40).optional().nullable(),
  }),
  shipping: z.enum(['standard', 'express', 'atelier']),
  payment_method: z.enum(['stripe', 'fedapay', 'cod']),
  discount_code: z.string().min(1).max(60).optional().nullable(),
});

const SHIPPING_CENTS: Record<'standard' | 'express' | 'atelier', number> = {
  standard: 0,
  express:  999,
  atelier:  0,
};

type Admin = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/* Compensation : l'initiation du paiement en ligne a échoué APRÈS que
   place_order a créé la commande + décrémenté le stock. On restaure le
   stock et on efface la commande fantôme (comme cancelOrderRestoreStock
   chez Sandy Stylish). */
async function cancelOrderRestoreStock(admin: Admin, orderId: string) {
  await restoreOrderStock(admin, orderId);
  await admin.from('order_items').delete().eq('order_id', orderId);
  await admin.from('orders').delete().eq('id', orderId);
}

export async function POST(request: Request) {
  // 1. Parse + valide
  let body;
  try {
    const json = await request.json();
    body = BodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: 'INVALID_BODY', userMessage: 'Données invalides.', details: err instanceof Error ? err.message : null },
      { status: 400 },
    );
  }

  // 2. Auth optionnelle — checkout invité supporté
  const session = await createServerSupabaseClient();
  const { data: { user } } = await session.auth.getUser();

  // 3. Lookup wig.id via slug (service_role : lecture publique de toute façon)
  const admin = await createServerSupabaseClient(true);
  const slugs = [...new Set(body.items.map(i => i.wig_slug))];
  const { data: wigs, error: wigsErr } = await admin
    .from('wigs')
    .select('id, slug, name')
    .in('slug', slugs);

  if (wigsErr || !wigs) {
    return NextResponse.json(
      { error: 'WIGS_LOOKUP', userMessage: 'Catalogue introuvable. Réessayez.' },
      { status: 500 },
    );
  }

  const slugToWig = new Map(wigs.map(w => [w.slug, w]));
  const missing = slugs.filter(s => !slugToWig.has(s));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'WIG_NOT_FOUND', userMessage: `Article introuvable : ${missing.join(', ')}` },
      { status: 404 },
    );
  }

  // 4. Commande atomique — prix ET stock recalculés/décrémentés côté DB,
  //    jamais fait confiance au navigateur (migration 012).
  const rpcItems = body.items.map(i => ({
    wig_id: slugToWig.get(i.wig_slug)!.id,
    variant_id: i.variant_id ?? null,
    quantity: i.quantity,
  }));

  const { data: rpcResult, error: rpcErr } = await admin.rpc('place_order', {
    p_items: rpcItems,
    p_customer_id: user?.id ?? null,
    p_guest_email: user ? null : body.address.email,
    p_guest_phone: user ? null : (body.address.telephone ?? null),
  });

  if (rpcErr || !rpcResult) {
    const msg = rpcErr?.message ?? '';
    if (msg.includes('out_of_stock')) {
      return NextResponse.json({ error: 'OUT_OF_STOCK', userMessage: 'Un article n\'a plus assez de stock. Ajustez votre panier.' }, { status: 409 });
    }
    if (msg.includes('item_unavailable')) {
      return NextResponse.json({ error: 'ITEM_UNAVAILABLE', userMessage: 'Un article n\'est plus disponible.' }, { status: 409 });
    }
    console.error('[checkout] place_order échoué:', msg);
    return NextResponse.json({ error: 'ORDER_CREATE', userMessage: 'Impossible de créer votre commande. Réessayez.' }, { status: 500 });
  }

  const { order_id: orderId, subtotal_cents: subtotalCents } = rpcResult as { order_id: string; subtotal_cents: number };

  // 5. RE-valide le code promo côté serveur sur le sous-total AUTORITAIRE
  //    (celui recalculé par place_order, jamais un montant du client).
  let discountResult: Awaited<ReturnType<typeof validateDiscountCode>> | null = null;
  if (body.discount_code) {
    try {
      discountResult = await validateDiscountCode(admin, body.discount_code, subtotalCents);
    } catch (err) {
      await cancelOrderRestoreStock(admin, orderId);
      if (err instanceof DiscountValidationError) {
        return NextResponse.json({ error: 'DISCOUNT_INVALID', userMessage: err.message }, { status: 400 });
      }
      console.error('[checkout] discount validation error:', err);
      return NextResponse.json({ error: 'DISCOUNT_CHECK_FAILED', userMessage: 'Impossible de vérifier le code promo. Réessayez.' }, { status: 500 });
    }
  }
  const discountCents = discountResult?.discountCents ?? 0;
  const shippingCents = SHIPPING_CENTS[body.shipping];
  const totalCents = subtotalCents + shippingCents - discountCents;
  const fullName = `${body.address.prenom} ${body.address.nom}`.trim();

  // 6. Complète la commande (adresse/livraison/paiement/total) — aucun de
  //    ces champs n'est sensible au prix, contrairement aux montants gérés
  //    par le RPC. `status` reste 'pending' (posé par place_order) pour
  //    TOUS les moyens de paiement : c'est le webhook qui le fait passer
  //    'paid' pour stripe/fedapay ; cod reste 'pending' jusqu'à livraison.
  const { error: updateErr } = await admin
    .from('orders')
    .update({
      shipping_cents: shippingCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      shipping_method: body.shipping,
      delivery_name: fullName,
      delivery_street: body.address.adresse,
      delivery_city: body.address.ville,
      delivery_postal_code: body.address.codePostal,
      delivery_country: body.address.pays,
      payment_method: body.payment_method,
    })
    .eq('id', orderId);

  if (updateErr) {
    console.error('[checkout] update commande échoué:', updateErr.message);
    await cancelOrderRestoreStock(admin, orderId);
    return NextResponse.json({ error: 'ORDER_UPDATE', userMessage: 'Impossible de finaliser votre commande. Réessayez.' }, { status: 500 });
  }

  if (discountResult) {
    await incrementDiscountCodeUsage(admin, discountResult.id).catch((err) => {
      console.warn('[checkout] incrementDiscountCodeUsage échoué (non bloquant) :', err);
    });
  }

  const ref = orderId.slice(0, 8).toUpperCase();
  const itemsForEmail = body.items.map(i => ({
    name: slugToWig.get(i.wig_slug)!.name,
    variant: i.variant_id ? `Variant ${i.variant_id}` : null,
    quantity: i.quantity,
    price_cents: 0, // affichage best-effort seulement — le vrai prix vient de order_items (email post-paiement pour stripe/fedapay)
  }));

  // 7. Email admin (best-effort, informe d'une activité de checkout même si
  //    le paiement en ligne n'est pas encore confirmé).
  const paymentLabel = body.payment_method === 'stripe' ? 'Stripe (CB) — en attente'
    : body.payment_method === 'fedapay' ? 'FedaPay (Mobile Money) — en attente'
    : 'Paiement à la livraison';
  void sendAdminEmail({
    subject: `[ADMIN] Nouvelle commande #${ref} · ${(totalCents / 100).toFixed(2)}€`,
    template: 'email-admin-new-order.html',
    data: {
      OrderNumber: ref,
      OrderDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      CustomerName: fullName,
      CustomerEmail: body.address.email,
      Total: (totalCents / 100).toFixed(2).replace('.', ','),
      PaymentMethod: paymentLabel,
      ItemCount: itemsForEmail.length,
      ItemsList: itemsForEmail.map(i => `${i.name} ×${i.quantity}`).join(', '),
      OrderURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/commandes`,
    },
  }).catch((e) => console.error('[checkout] admin email error:', e));

  // 8a. Paiement à la livraison — rien à confirmer en ligne, comportement
  //     réel immédiat (points + email client tout de suite, comme avant).
  if (body.payment_method === 'cod') {
    let pointsEarned = 0;
    if (user) {
      pointsEarned = await awardLoyaltyPoints(admin, { userId: user.id, orderId, totalCents });
    }

    void sendEmail({
      to: body.address.email,
      subject: `Commande confirmée #${ref} · Glory Hair`,
      template: 'email-order-confirmed.html',
      data: {
        UserName: body.address.prenom,
        OrderNumber: ref,
        ItemsHTML: renderOrderItemsHTML(itemsForEmail),
        ShippingName: fullName,
        ShippingAddress: body.address.adresse,
        ShippingCity: body.address.ville,
        ShippingPostal: body.address.codePostal,
        ShippingCountry: body.address.pays,
        EstimatedDelivery: body.shipping === 'express' ? '24h' : body.shipping === 'standard' ? '48h' : 'Sur RDV',
        PointsEarned: pointsEarned,
        OrderURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/compte?tab=commandes`,
      },
    }).catch((e) => console.error('[checkout] email send error:', e));

    return NextResponse.json({ ok: true, orderId, ref, total_cents: totalCents, points_earned: pointsEarned });
  }

  // 8b. Paiement en ligne réel — initie Stripe ou FedaPay. Le succès
  //     définitif (points + email "confirmée") arrive uniquement via
  //     webhook (/api/webhooks/{stripe,fedapay}), jamais ici.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  if (body.payment_method === 'stripe') {
    try {
      const { sessionUrl, paymentIntentId } = await createCheckoutSession({
        amountCents: totalCents,
        currency: 'eur',
        orderId,
        orderRef: ref,
        successUrl: `${appUrl}/merci?ref=${ref}`,
        cancelUrl: `${appUrl}/checkout`,
        customerEmail: body.address.email,
      });
      await admin.from('orders').update({ stripe_payment_intent_id: paymentIntentId }).eq('id', orderId);
      return NextResponse.json({ ok: true, orderId, ref, total_cents: totalCents, redirectUrl: sessionUrl });
    } catch (err) {
      console.error('[checkout] Stripe Checkout Session échouée:', err);
      await cancelOrderRestoreStock(admin, orderId);
      return NextResponse.json({ error: 'PAYMENT_UNAVAILABLE', userMessage: 'Paiement par carte indisponible. Réessayez ou choisissez un autre moyen de paiement.' }, { status: 502 });
    }
  }

  // fedapay
  try {
    const { transactionId, token } = await createTransaction({
      amount: totalCents,
      currency: 'XOF',
      phone: body.address.telephone ?? '',
      description: `Glory Hair Order #${ref}`,
      metadata: { orderId },
    });
    await admin.from('orders').update({ fedapay_transaction_id: transactionId }).eq('id', orderId);
    return NextResponse.json({
      ok: true,
      orderId,
      ref,
      total_cents: totalCents,
      redirectUrl: `https://app.fedapay.com/v1/payment/send?token=${token}`,
    });
  } catch (err) {
    console.error('[checkout] FedaPay transaction échouée:', err);
    await cancelOrderRestoreStock(admin, orderId);
    return NextResponse.json({ error: 'PAYMENT_UNAVAILABLE', userMessage: 'Paiement mobile money indisponible. Réessayez ou choisissez un autre moyen de paiement.' }, { status: 502 });
  }
}
