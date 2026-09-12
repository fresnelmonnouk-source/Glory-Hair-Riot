import Stripe from 'stripe';
import { getStripeSecretKey, getBrandSettings } from '@/lib/settings/service';

/**
 * Clé secrète lue depuis la table `settings` (configurable depuis
 * /admin/reglages, comme FedaPay) plutôt que figée au chargement du module
 * — fallback sur STRIPE_SECRET_KEY si rien n'est configuré en admin. Le
 * client n'est jamais mis en cache : la clé peut changer sans redéploiement.
 * Stripe throw "API key required" si on lui passe '' au constructeur, d'où
 * le placeholder pour ne pas crasher le build Vercel sans clé.
 */
async function getStripe(): Promise<Stripe> {
  const secretKey = (await getStripeSecretKey()) || 'sk_placeholder';
  return new Stripe(secretKey, { apiVersion: '2023-10-16' });
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string; // 'eur'
  customerId?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  amount,
  currency,
  customerId,
  metadata,
}: CreatePaymentIntentParams) {
  try {
    const stripe = await getStripe();
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: intent.client_secret,
      intentId: intent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

export interface CreateCheckoutSessionParams {
  amountCents: number;
  currency: string; // 'eur'
  orderId: string;
  orderRef: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/* Stripe Checkout hébergé (redirection) plutôt que Stripe Elements embarqué —
   décision Niveau B validée par Fresnel (2026-09-10) : Stripe gère la saisie
   carte/3DS/conformité, cohérent avec la redirection déjà utilisée côté
   FedaPay. En mode 'payment', Stripe crée immédiatement un PaymentIntent
   sous-jacent (session.payment_intent, disponible dès la création, pas
   seulement après paiement) — stocké côté appelant dans
   orders.stripe_payment_intent_id pour que le webhook existant
   (payment_intent.succeeded, déjà correct) fonctionne sans aucune
   modification. */
export async function createCheckoutSession({
  amountCents,
  currency,
  orderId,
  orderRef,
  successUrl,
  cancelUrl,
  customerEmail,
}: CreateCheckoutSessionParams) {
  const [stripe, brand] = await Promise.all([getStripe(), getBrandSettings()]);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: { name: `Commande #${orderRef} · ${brand.name}` },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: { orderId },
  });

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!session.url || !paymentIntentId) {
    throw new Error('Stripe Checkout Session incomplète (url/payment_intent manquant)');
  }

  return { sessionUrl: session.url, paymentIntentId };
}

export async function confirmPaymentIntent(intentId: string) {
  try {
    const stripe = await getStripe();
    const intent = await stripe.paymentIntents.retrieve(intentId);

    return {
      status: intent.status, // 'succeeded', 'processing', 'requires_action', etc.
      amount: intent.amount,
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error('Failed to confirm payment intent');
  }
}

export async function verifyWebhookSignature(
  body: Buffer | string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  try {
    const stripe = await getStripe();
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number
) {
  try {
    const stripe = await getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw new Error('Failed to process refund');
  }
}
