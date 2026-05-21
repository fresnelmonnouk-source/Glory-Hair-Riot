import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import {
  createPaymentIntent,
  confirmPaymentIntent,
} from '@/server/services/payment/stripe.service';
import {
  createTransaction,
  getTransactionStatus,
} from '@/server/services/payment/fedapay.service';

export const paymentsRouter = router({
  createStripeIntent: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        amount: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      // Verify order belongs to user
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Create Stripe payment intent
      const { clientSecret, intentId } = await createPaymentIntent({
        amount: input.amount,
        currency: 'eur',
        metadata: {
          orderId: input.orderId,
          userId: userId,
        },
      });

      // Update order with payment intent
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          stripe_payment_intent_id: intentId,
          payment_method: 'stripe',
        })
        .eq('id', input.orderId);

      if (updateError) throw new Error(updateError.message);

      return { clientSecret, intentId };
    }),

  confirmStripePayment: protectedProcedure
    .input(
      z.object({
        intentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { status } = await confirmPaymentIntent(input.intentId);

      return { status };
    }),

  createFedaPay: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        phone: z.string().min(7),
        amount: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      // Verify order belongs to user
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Create FedaPay transaction
      const { transactionId, token } = await createTransaction({
        amount: input.amount,
        currency: 'XOF', // West African CFA franc (can be customized)
        phone: input.phone,
        description: `Glory Hair Order #${input.orderId.substring(0, 8)}`,
        metadata: {
          orderId: input.orderId,
          userId: userId,
        },
      });

      // Update order with FedaPay transaction
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          fedapay_transaction_id: transactionId,
          payment_method: 'fedapay',
        })
        .eq('id', input.orderId);

      if (updateError) throw new Error(updateError.message);

      return {
        transactionId,
        token,
        redirectUrl: `https://app.fedapay.com/v1/payment/send?token=${token}`,
      };
    }),

  getFedaPayStatus: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const status = await getTransactionStatus(input.transactionId);
      return status;
    }),

  createOrder: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        street: z.string(),
        city: z.string(),
        postalCode: z.string(),
        country: z.string(),
        shippingMethod: z.enum(['standard', 'express']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      // Get cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (cartError || !cartItems || cartItems.length === 0) {
        throw new Error('Panier vide');
      }

      // Calculate totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price_at_added * item.quantity,
        0
      );
      const shipping = subtotal > 15000 ? 0 : 990;
      const total = subtotal + shipping;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'pending',
          subtotal_cents: subtotal,
          shipping_cents: shipping,
          total_cents: total,
          shipping_method: input.shippingMethod,
          delivery_name: `${input.firstName} ${input.lastName}`,
          delivery_street: input.street,
          delivery_city: input.city,
          delivery_postal_code: input.postalCode,
          delivery_country: input.country,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // Create order items from cart
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        wig_id: item.wig_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price_cents: item.price_at_added,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erreur lors de la création des articles de commande');
      }

      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', userId);

      return {
        orderId: order.id,
        total: order.total_cents,
      };
    }),
});
