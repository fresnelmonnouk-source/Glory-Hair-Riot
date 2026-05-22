import Stripe from 'stripe';

/**
 * Lazy client : Stripe throw "API key required" si on lui passe '' au
 * constructeur. On instancie au premier appel pour ne pas crasher le build
 * Vercel quand STRIPE_SECRET_KEY n'est pas défini.
 */
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
      apiVersion: '2023-10-16',
    });
  }
  return _stripe;
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
    const intent = await getStripe().paymentIntents.create({
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

export async function confirmPaymentIntent(intentId: string) {
  try {
    const intent = await getStripe().paymentIntents.retrieve(intentId);

    return {
      status: intent.status, // 'succeeded', 'processing', 'requires_action', etc.
      amount: intent.amount,
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error('Failed to confirm payment intent');
  }
}

export function verifyWebhookSignature(
  body: Buffer | string,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return getStripe().webhooks.constructEvent(body, signature, secret);
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
    const refund = await getStripe().refunds.create({
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
