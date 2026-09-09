/* /api/checkout — Création de commande.
 *
 * Flow (mocké côté Stripe/FedaPay, réel côté paiement à la livraison) :
 *   1. POST { items[], address, shipping, payment_method }
 *   2. Auth optionnelle — checkout invité supporté (comme Sandy Stylish :
 *      "le checkout n'est jamais bloqué"). Si connecté, la commande est
 *      rattachée au compte (historique, points) ; sinon guest_email/
 *      guest_phone snapshotent le contact.
 *   3. Lookup wigs.id via wig.slug (côté client on stocke le slug)
 *   4. INSERT orders :
 *        - payment_method='cod'            → status='pending' (payé à la
 *          livraison, rien à mocker : c'est le vrai comportement)
 *        - payment_method='stripe'|'fedapay' → status='paid' mocké (pas
 *          d'appel API réel depuis ce endpoint — Phase 5.5, cf. payments.ts)
 *   5. INSERT order_items pour chaque ligne
 *   6. Bump points fidélité (+10 pts/€) — uniquement si connecté
 *   7. Retourne { ref, orderId } pour redirect /merci
 *
 * Toutes les écritures passent par service_role : la table orders n'a pas
 * de policy INSERT publique (RLS reste stricte pour les accès directs
 * PostgREST), ce endpoint valide le payload lui-même (zod) avant d'écrire.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, sendAdminEmail, renderOrderItemsHTML } from '@/lib/email/send';

export const runtime = 'nodejs';

const BodySchema = z.object({
  items: z.array(z.object({
    wig_slug: z.string(),           // 'velours' / 'ginger' / etc.
    variant_id: z.string().nullable().optional(),
    quantity: z.number().int().min(1).max(20),
    price_at_added: z.number().int().min(0), // cents
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
});

const SHIPPING_CENTS: Record<'standard' | 'express' | 'atelier', number> = {
  standard: 0,
  express:  999,
  atelier:  0,
};

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
    .select('id, slug, name, base_price')
    .in('slug', slugs);

  if (wigsErr || !wigs) {
    return NextResponse.json(
      { error: 'WIGS_LOOKUP', userMessage: 'Catalogue introuvable. Réessaie.' },
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

  // 4. Compute totals
  const subtotal_cents = body.items.reduce((sum, i) => sum + i.price_at_added * 100 * i.quantity, 0);
  const shipping_cents = SHIPPING_CENTS[body.shipping];
  const total_cents = subtotal_cents + shipping_cents;

  // 5. INSERT order
  //    - cod : pas de mock à faire, c'est le vrai statut (payé à la livraison)
  //    - stripe/fedapay : toujours mocké pour l'instant (pas d'appel API réel
  //      depuis ce endpoint — cf. src/server/trpc/routers/payments.ts pour le
  //      flow réel déjà écrit, pas encore branché à cette UI)
  const isCod = body.payment_method === 'cod';
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      guest_email: user ? null : body.address.email,
      guest_phone: user ? null : (body.address.telephone ?? null),
      status: isCod ? 'pending' : 'paid',
      subtotal_cents,
      shipping_cents,
      discount_cents: 0,
      total_cents,
      shipping_method: body.shipping,
      delivery_name: `${body.address.prenom} ${body.address.nom}`.trim(),
      delivery_street: body.address.adresse,
      delivery_city: body.address.ville,
      delivery_postal_code: body.address.codePostal,
      delivery_country: body.address.pays,
      payment_method: body.payment_method,
      payment_status: isCod ? 'pending' : 'succeeded',
      notes: isCod ? 'Paiement à la livraison.' : 'MVP mock payment (no Stripe/FedaPay API call yet).',
    })
    .select('id, created_at')
    .single();

  if (orderErr || !order) {
    console.error('[checkout] order insert error:', orderErr);
    return NextResponse.json(
      { error: 'ORDER_CREATE', userMessage: 'Impossible de créer ta commande. Réessaie.' },
      { status: 500 },
    );
  }

  // 6. INSERT order_items
  const items = body.items.map(i => {
    const wig = slugToWig.get(i.wig_slug)!;
    return {
      order_id: order.id,
      wig_id: wig.id,
      variant_id: i.variant_id ?? null,
      quantity: i.quantity,
      unit_price_cents: i.price_at_added * 100,
    };
  });

  const { error: itemsErr } = await admin.from('order_items').insert(items);
  if (itemsErr) {
    console.error('[checkout] order_items error:', itemsErr);
    // L'order existe mais sans items → rollback manuel
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json(
      { error: 'ORDER_ITEMS', userMessage: 'Impossible d\'enregistrer les articles. Réessaie.' },
      { status: 500 },
    );
  }

  // 7. Bump points fidélité (+10 par euro = +1 par 10 cents) — uniquement
  //    si connecté (un invité n'a pas de solde de points à créditer)
  let pointsEarned = 0;
  if (user) {
    pointsEarned = Math.floor(total_cents / 1000) * 10; // 1€ = 10 pts
    if (pointsEarned > 0) {
      await admin.rpc('increment_user_points', { p_user_id: user.id, p_amount: pointsEarned }).then(() => {}, () => {
        // RPC pas définie → fallback manuel
        void admin.from('users').select('points').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            void admin.from('users').update({ points: data.points + pointsEarned }).eq('id', user.id);
          }
        });
      });
      await admin.from('glory_club_points_log').insert({
        user_id: user.id,
        label: `Commande ${order.id.slice(0, 8).toUpperCase()}`,
        value: pointsEarned,
        source: 'order',
        reference_id: order.id,
      });
    }
  }

  // 8. Build short ref pour /merci
  const ref = order.id.slice(0, 8).toUpperCase();

  // 9. Emails (best-effort, n'échoue pas la commande si l'envoi rate)
  void (async () => {
    try {
      const fullName = `${body.address.prenom} ${body.address.nom}`.trim();
      const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/compte?tab=commandes`;

      // Items pour le client : reconstruire les noms depuis le lookup wigs
      const itemsForEmail = body.items.map(i => {
        const wig = slugToWig.get(i.wig_slug)!;
        return {
          name: wig.name,                                  // ex: "Velours 14""
          variant: i.variant_id ? `Variant ${i.variant_id}` : null,
          quantity: i.quantity,
          price_cents: i.price_at_added * 100,
        };
      });
      const itemsHTML = renderOrderItemsHTML(itemsForEmail);

      // Email client
      await sendEmail({
        to: body.address.email,
        subject: `Commande confirmée #${ref} · Glory Hair`,
        template: 'email-order-confirmed.html',
        data: {
          UserName: body.address.prenom,
          OrderNumber: ref,
          ItemsHTML: itemsHTML,
          ShippingName: fullName,
          ShippingAddress: body.address.adresse,
          ShippingCity: body.address.ville,
          ShippingPostal: body.address.codePostal,
          ShippingCountry: body.address.pays,
          EstimatedDelivery: body.shipping === 'express' ? '24h' : body.shipping === 'standard' ? '48h' : 'Sur RDV',
          PointsEarned: pointsEarned,
          OrderURL: orderUrl,
        },
      });

      // Email admin
      const itemsList = itemsForEmail.map(i => `${i.name} ×${i.quantity}`).join(', ');
      const paymentLabel = body.payment_method === 'stripe' ? 'Stripe (CB)' : body.payment_method === 'fedapay' ? 'FedaPay (Mobile Money)' : 'Paiement à la livraison';
      await sendAdminEmail({
        subject: `[ADMIN] Nouvelle commande #${ref} · ${(total_cents / 100).toFixed(2)}€`,
        template: 'email-admin-new-order.html',
        data: {
          OrderNumber: ref,
          OrderDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          CustomerName: fullName,
          CustomerEmail: body.address.email,
          Total: (total_cents / 100).toFixed(2).replace('.', ','),
          PaymentMethod: paymentLabel,
          ItemCount: itemsForEmail.length,
          ItemsList: itemsList,
          OrderURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/commandes`,
        },
      });
    } catch (e) {
      console.error('[checkout] email send error:', e);
    }
  })();

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    ref,
    total_cents,
    points_earned: pointsEarned,
  });
}
