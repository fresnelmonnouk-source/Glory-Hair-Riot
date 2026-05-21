import { z } from 'zod';
import { router, protectedProcedure } from '../init';

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const offset = (input.page - 1) * input.limit;

      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      if (error) throw new Error(error.message);

      return {
        orders: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((count || 0) / input.limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(
          `
          *,
          wigs:wig_id(name, slug),
          wig_variants:variant_id(variant_name)
        `
        )
        .eq('order_id', input.orderId);

      if (itemsError) throw new Error(itemsError.message);

      return {
        ...order,
        items: items || [],
      };
    }),

  cancel: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Only allow cancellation if not shipped
      if (order.status === 'shipped' || order.status === 'delivered') {
        throw new Error('Impossible d\'annuler une commande expédiée');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', input.orderId);

      if (updateError) throw new Error(updateError.message);

      return { success: true };
    }),

  updateAddress: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        street: z.string(),
        city: z.string(),
        postalCode: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.orderId)
        .eq('user_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error('Commande non trouvée');
      }

      // Only allow address update if not shipped
      if (order.status === 'shipped' || order.status === 'delivered') {
        throw new Error('Impossible de modifier l\'adresse d\'une commande expédiée');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_street: input.street,
          delivery_city: input.city,
          delivery_postal_code: input.postalCode,
          delivery_country: input.country,
        })
        .eq('id', input.orderId);

      if (updateError) throw new Error(updateError.message);

      return { success: true };
    }),
});
