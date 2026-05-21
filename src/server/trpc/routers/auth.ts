import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../init';

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return { user: ctx.user };
  }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error('Not authenticated');
    }
    await ctx.supabase.auth.signOut();
    return { success: true };
  }),

  getProfile: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const { data, error } = await ctx.supabase
      .from('users')
      .select('*')
      .eq('id', ctx.user.id)
      .single();

    if (error || !data) {
      return { id: ctx.user.id, email: ctx.user.email };
    }

    return data;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        full_name: z.string().min(1).max(100).optional(),
        phone: z.string().max(20).optional(),
        street_address: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        postal_code: z.string().max(20).optional(),
        country: z.string().max(100).optional(),
        hair_type: z.string().max(50).optional(),
        skin_tone: z.string().max(50).optional(),
        accepts_marketing: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('users')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', ctx.user.id);

      if (error) throw new Error(error.message);

      return { success: true };
    }),
});
