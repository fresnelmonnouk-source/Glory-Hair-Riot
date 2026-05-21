import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/server/services/payment/fedapay.service';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-fedapay-signature') || '';

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    console.error('FedaPay signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // Initialize Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    const { object } = payload;
    const eventId = `${payload.event}-${object.id}`;

    // Check if already processed (idempotency)
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Mark event as processed
    await supabase.from('processed_webhook_events').insert({
      event_id: eventId,
      event_type: `fedapay.${payload.event}`,
    });

    // Handle transaction approved
    if (payload.event === 'transaction.approved') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'paid',
          fedapay_transaction_id: object.id,
        })
        .eq('fedapay_transaction_id', object.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
      }

      return NextResponse.json({ received: true });
    }

    // Handle transaction declined
    if (payload.event === 'transaction.declined') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('fedapay_transaction_id', object.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
      }

      return NextResponse.json({ received: true });
    }

    // Handle transaction expired
    if (payload.event === 'transaction.expired') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('fedapay_transaction_id', object.id);

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
