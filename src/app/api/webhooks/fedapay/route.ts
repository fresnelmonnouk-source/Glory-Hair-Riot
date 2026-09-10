import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/server/services/payment/fedapay.service';
import { sendOrderConfirmedAfterPayment } from '@/lib/email/order-confirmation';
import { restoreOrderStock } from '@/lib/loyalty/award-points';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-fedapay-signature') || '';

  // Verify webhook signature
  if (!(await verifyWebhookSignature(body, signature))) {
    console.error('FedaPay signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
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
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'paid',
          fedapay_transaction_id: object.id,
        })
        .eq('fedapay_transaction_id', object.id)
        .select('id')
        .maybeSingle();

      if (orderError) {
        console.error('Error updating order:', orderError);
      } else if (updatedOrder) {
        // Paiement réellement confirmé : c'est ICI (jamais à la création)
        // que les points fidélité sont crédités et l'email "confirmée" part.
        await sendOrderConfirmedAfterPayment(supabase, updatedOrder.id);
      }

      return NextResponse.json({ received: true });
    }

    // Handle transaction declined / expired
    if (payload.event === 'transaction.declined' || payload.event === 'transaction.expired') {
      const { data: failedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
        })
        .eq('fedapay_transaction_id', object.id)
        .select('id')
        .maybeSingle();

      if (orderError) {
        console.error('Error updating order:', orderError);
      } else if (failedOrder) {
        // Le stock avait été décrémenté ATOMIQUEMENT à la création
        // (place_order) — un paiement refusé/expiré doit le restaurer.
        await restoreOrderStock(supabase, failedOrder.id);
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
