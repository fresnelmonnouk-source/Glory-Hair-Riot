import { ordersRouter } from '@/server/trpc/routers/orders';
import { createMockContext, createMockUser } from '../helpers/mock-supabase';
import { TRPCError } from '@trpc/server';

const MOCK_ORDER = {
  id: 'order-uuid-1',
  user_id: 'user-test-uuid-1234',
  status: 'paid' as const,
  subtotal_cents: 28900,
  shipping_cents: 990,
  discount_cents: 0,
  total_cents: 29890,
  payment_method: 'stripe' as const,
  payment_status: 'succeeded' as const,
  stripe_payment_intent_id: 'pi_test_123',
  fedapay_transaction_id: null,
  delivery_name: 'Test User',
  delivery_street: '12 rue de la Paix',
  delivery_city: 'Paris',
  delivery_postal_code: '75001',
  delivery_country: 'France',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('ordersRouter', () => {
  describe('protection des routes', () => {
    it('refuse list() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = ordersRouter.createCaller(ctx);
      await expect(caller.list({ page: 1, limit: 10 })).rejects.toThrow(TRPCError);
    });

    it('refuse getById() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = ordersRouter.createCaller(ctx);
      await expect(caller.getById({ orderId: 'order-uuid-1' })).rejects.toThrow(TRPCError);
    });

    it('refuse cancel() si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = ordersRouter.createCaller(ctx);
      await expect(caller.cancel({ orderId: 'order-uuid-1' })).rejects.toThrow(TRPCError);
    });
  });

  describe('list', () => {
    it('retourne la liste des commandes paginée', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: [MOCK_ORDER], error: null, count: 1 }),
            }),
          }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      const result = await caller.list({ page: 1, limit: 10 });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getById', () => {
    it('retourne une commande avec ses articles', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: MOCK_ORDER, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const caller = ordersRouter.createCaller(ctx);
      const result = await caller.getById({ orderId: 'order-uuid-1' });

      expect(result.id).toBe('order-uuid-1');
      expect(result.items).toEqual([]);
    });

    it("lève une erreur si la commande n'existe pas", async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      await expect(caller.getById({ orderId: 'fake-uuid' })).rejects.toThrow('Commande non trouvée');
    });
  });

  describe('cancel', () => {
    it('annule une commande en attente', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const pendingOrder = { ...MOCK_ORDER, status: 'pending' as const };

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: pendingOrder, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      const result = await caller.cancel({ orderId: 'order-uuid-1' });
      expect(result.success).toBe(true);
    });

    it('refuse d\'annuler une commande expédiée', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const shippedOrder = { ...MOCK_ORDER, status: 'shipped' as const };

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: shippedOrder, error: null }),
            }),
          }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      await expect(caller.cancel({ orderId: 'order-uuid-1' })).rejects.toThrow(
        "Impossible d'annuler une commande expédiée"
      );
    });
  });

  describe('updateAddress', () => {
    it('met à jour l\'adresse d\'une commande pending', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const pendingOrder = { ...MOCK_ORDER, status: 'pending' as const };

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: pendingOrder, error: null }),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      const result = await caller.updateAddress({
        orderId: 'order-uuid-1',
        street: '5 avenue Montaigne',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
      });

      expect(result.success).toBe(true);
    });

    it('refuse de modifier l\'adresse d\'une commande livrée', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const deliveredOrder = { ...MOCK_ORDER, status: 'delivered' as const };

      (ctx.supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: deliveredOrder, error: null }),
            }),
          }),
        }),
      });

      const caller = ordersRouter.createCaller(ctx);
      await expect(
        caller.updateAddress({
          orderId: 'order-uuid-1',
          street: '5 avenue Montaigne',
          city: 'Paris',
          postalCode: '75008',
          country: 'France',
        })
      ).rejects.toThrow("Impossible de modifier l'adresse d'une commande expédiée");
    });
  });
});
