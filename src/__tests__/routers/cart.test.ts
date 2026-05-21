import { cartRouter } from '@/server/trpc/routers/cart';
import { createMockContext, createMockUser } from '../helpers/mock-supabase';
import { TRPCError } from '@trpc/server';

const MOCK_CART_ITEM = {
  id: 'cart-item-uuid-1',
  user_id: 'user-test-uuid-1234',
  wig_id: 'wig-uuid-1',
  variant_id: null,
  quantity: 2,
  price_at_added: 28900,
  created_at: '2026-01-01T00:00:00Z',
};

describe('cartRouter', () => {
  describe('protection des routes', () => {
    it('refuse list() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = cartRouter.createCaller(ctx);
      await expect(caller.list()).rejects.toThrow(TRPCError);
    });

    it('refuse addItem() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = cartRouter.createCaller(ctx);
      await expect(
        caller.addItem({ wig_id: 'wig-uuid-1', quantity: 1, price_at_added: 28900 })
      ).rejects.toThrow(TRPCError);
    });

    it('refuse removeItem() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = cartRouter.createCaller(ctx);
      await expect(caller.removeItem({ id: 'cart-item-uuid-1' })).rejects.toThrow(TRPCError);
    });
  });

  describe('list', () => {
    it('retourne les articles du panier de l\'utilisateur', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [MOCK_CART_ITEM], error: null }),
          }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0]!.wig_id).toBe('wig-uuid-1');
    });

    it('lève une erreur Supabase', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Connection error' } }),
          }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      await expect(caller.list()).rejects.toThrow('Connection error');
    });
  });

  describe('addItem', () => {
    it('ajoute un article au panier', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: MOCK_CART_ITEM, error: null }),
          }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      const result = await caller.addItem({
        wig_id: 'wig-uuid-1',
        quantity: 2,
        price_at_added: 28900,
      });

      expect(result?.quantity).toBe(2);
    });

    it('rejette une quantité de 0', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const caller = cartRouter.createCaller(ctx);
      await expect(
        caller.addItem({ wig_id: 'wig-uuid-1', quantity: 0, price_at_added: 28900 })
      ).rejects.toThrow();
    });
  });

  describe('updateQuantity', () => {
    it('met à jour la quantité d\'un article', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const updated = { ...MOCK_CART_ITEM, quantity: 5 };

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: updated, error: null }),
              }),
            }),
          }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      const result = await caller.updateQuantity({ id: 'cart-item-uuid-1', quantity: 5 });
      expect(result?.quantity).toBe(5);
    });
  });

  describe('removeItem', () => {
    it('supprime un article du panier', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      const result = await caller.removeItem({ id: 'cart-item-uuid-1' });
      expect(result.success).toBe(true);
    });
  });

  describe('clear', () => {
    it('vide le panier entier', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const caller = cartRouter.createCaller(ctx);
      const result = await caller.clear();
      expect(result.success).toBe(true);
    });
  });
});
