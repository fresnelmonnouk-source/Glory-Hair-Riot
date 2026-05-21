import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/server/services/payment/stripe.service';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event;
  try {
    event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Initialize Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // Handle payment intent succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;

      // Check if already processed (idempotency)
      const { data: existing } = await supabase
        .from('processed_webhook_events')
        .select('*')
        .eq('event_id', event.id)
        .single();

      if (existing) {
        return NextResponse.json({ received: true });
      }

      // Mark event as processed
      await supabase.from('processed_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
      });

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
      }

      return NextResponse.json({ received: true });
    }

    // Handle payment intent payment failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as any;

      // Check if already processed
      const { data: existing } = await supabase
        .from('processed_webhook_events')
        .select('*')
        .eq('event_id', event.id)
        .single();

      if (existing) {
        return NextResponse.json({ received: true });
      }

      // Mark event as processed
      await supabase.from('processed_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
      });

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
