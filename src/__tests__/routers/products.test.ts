import { productsRouter } from '@/server/trpc/routers/products';
import { createMockContext } from '../helpers/mock-supabase';

const MOCK_WIG = {
  id: 'wig-uuid-1',
  name: 'Aura Lace 18"',
  slug: 'aura-lace-18',
  description: 'Perruque lace front premium',
  category: 'Lace Front',
  base_price: 28900,
  active: true,
  featured: true,
  created_at: '2026-01-01T00:00:00Z',
};


describe('productsRouter', () => {
  describe('list', () => {
    it('retourne une liste paginée de produits', async () => {
      const ctx = createMockContext();
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [MOCK_WIG], error: null, count: 1 }),
      };
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain),
      });

      const caller = productsRouter.createCaller(ctx);
      const result = await caller.list({ page: 1, limit: 12 });

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filtre par catégorie quand fournie', async () => {
      const ctx = createMockContext();
      const eqMock = jest.fn().mockReturnThis();
      const mockChain = {
        eq: eqMock,
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      };
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain),
      });

      const caller = productsRouter.createCaller(ctx);
      await caller.list({ category: 'Full Lace', page: 1, limit: 12 });

      expect(eqMock).toHaveBeenCalledWith('category', 'Full Lace');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const ctx = createMockContext();
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
      };
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockChain),
      });

      const caller = productsRouter.createCaller(ctx);
      await expect(caller.list({ page: 1, limit: 12 })).rejects.toThrow('DB error');
    });
  });

  describe('getBySlug', () => {
    it('retourne un produit avec ses variants et images', async () => {
      const ctx = createMockContext();
      (ctx.supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'wigs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: MOCK_WIG, error: null }),
          };
        }
        if (table === 'wig_variants') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: undefined,
          };
        }
        if (table === 'wig_images') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      (ctx.supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'wigs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: MOCK_WIG, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'wig_variants') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      });

      const caller = productsRouter.createCaller(ctx);
      const result = await caller.getBySlug({ slug: 'aura-lace-18' });

      expect(result.name).toBe('Aura Lace 18"');
      expect(result.variants).toEqual([]);
      expect(result.images).toEqual([]);
    });

    it("lève une erreur si le produit n'existe pas", async () => {
      const ctx = createMockContext();
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      });

      const caller = productsRouter.createCaller(ctx);
      await expect(caller.getBySlug({ slug: 'inexistant' })).rejects.toThrow('Produit non trouvé');
    });
  });

  describe('search', () => {
    it('retourne des résultats de recherche', async () => {
      const ctx = createMockContext();
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [MOCK_WIG], error: null }),
            }),
          }),
        }),
      });

      const caller = productsRouter.createCaller(ctx);
      const result = await caller.search({ query: 'Aura', limit: 10 });

      expect(result).toHaveLength(1);
    });

    it('rejette les queries vides', async () => {
      const ctx = createMockContext();
      const caller = productsRouter.createCaller(ctx);

      await expect(caller.search({ query: '', limit: 10 })).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('retourne les catégories uniques triées', async () => {
      const ctx = createMockContext();
      const mockData = [
        { category: 'Full Lace' },
        { category: 'Lace Front' },
        { category: 'Full Lace' },
        { category: '360 Lace' },
      ];
      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const caller = productsRouter.createCaller(ctx);
      const result = await caller.getCategories();

      expect(result).toEqual(['360 Lace', 'Full Lace', 'Lace Front']);
    });
  });
});
