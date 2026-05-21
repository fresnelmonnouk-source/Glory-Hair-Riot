import { z } from 'zod';
import { router, publicProcedure } from '../init';

export const productsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const offset = (input.page - 1) * input.limit;

      let query = supabase
        .from('wigs')
        .select('*', { count: 'exact' })
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      if (input.category) {
        query = query.eq('category', input.category);
      }

      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,description.ilike.%${input.search}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      return {
        products: data || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil((count || 0) / input.limit),
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data: wig, error: wigError } = await supabase
        .from('wigs')
        .select('*')
        .eq('slug', input.slug)
        .eq('active', true)
        .single();

      if (wigError || !wig) {
        throw new Error('Produit non trouvé');
      }

      const { data: variants, error: variantsError } = await supabase
        .from('wig_variants')
        .select('*')
        .eq('wig_id', wig.id)
        .eq('active', true);

      if (variantsError) throw new Error(variantsError.message);

      const { data: images, error: imagesError } = await supabase
        .from('wig_images')
        .select('*')
        .eq('wig_id', wig.id)
        .order('display_order', { ascending: true });

      if (imagesError) throw new Error(imagesError.message);

      return {
        ...wig,
        variants: variants || [],
        images: images || [],
      };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().positive().max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from('wigs')
        .select('id, name, slug, color, category, base_price')
        .eq('active', true)
        .or(
          `name.ilike.%${input.query}%,color.ilike.%${input.query}%,category.ilike.%${input.query}%`
        )
        .limit(input.limit);

      if (error) throw new Error(error.message);

      return data || [];
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;

    const { data, error } = await supabase
      .from('wigs')
      .select('category')
      .eq('active', true)
      .not('category', 'is', null);

    if (error) throw new Error(error.message);

    const categories = Array.from(
      new Set((data || []).map((w: any) => w.category))
    ).sort();

    return categories;
  }),
});
