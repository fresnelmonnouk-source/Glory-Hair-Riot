import { z } from 'zod';
import { router, protectedProcedure } from '../init';

export const cartRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('Authentification requise');
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        wig_id,
        variant_id,
        quantity,
        price_at_added,
        wigs:wig_id(name, slug),
        wig_variants:variant_id(variant_name)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  }),

  addItem: protectedProcedure
    .input(
      z.object({
        wig_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable().optional(),
        quantity: z.number().int().positive(),
        price_at_added: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          wig_id: input.wig_id,
          variant_id: input.variant_id || null,
          quantity: input.quantity,
          price_at_added: input.price_at_added,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    }),

  updateQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: input.quantity })
        .eq('id', input.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return data;
    }),

  removeItem: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('Authentification requise');
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return { success: true };
  }),
});
