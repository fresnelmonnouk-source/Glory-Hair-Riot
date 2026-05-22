/**
 * tRPC router admin — réservé aux comptes role='admin'.
 *
 * Utilise adminProcedure qui :
 * - Vérifie auth (ctx.user existe)
 * - Vérifie role (SELECT users.role = 'admin')
 * - Throw FORBIDDEN sinon
 *
 * Endpoints :
 * - dashboard.kpis : 4 KPIs (CA 24h, Commandes 24h, Essais 24h, Panier moyen)
 * - orders.list : commandes paginées avec filtres status
 * - products.list : wigs avec stats ventes (jointure orders)
 * - customers.list : users avec stats commandes/points
 * - tasks.list : à faire (mock pour l'instant — Phase 6 : table tasks)
 */

import { z } from 'zod';
import { router } from '../init';
import { adminProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const adminRouter = router({
  // ─── Dashboard KPIs ──────────────────────────────
  kpis: adminProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const last24h = new Date(Date.now() - 24 * 3600_000).toISOString();
    const prev24h = new Date(Date.now() - 48 * 3600_000).toISOString();

    // CA + count commandes 24h
    const { data: recent } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', last24h);

    const { data: prevDay } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', prev24h)
      .lt('created_at', last24h);

    const ca24h = (recent ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    const caPrev = (prevDay ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    const ordersCount = recent?.length ?? 0;
    const ordersPrev = prevDay?.length ?? 0;
    const avgBasket = ordersCount > 0 ? Math.round(ca24h / ordersCount) : 0;

    // Essais virtuels 24h (depuis tryon_results)
    const { count: tryonCount } = await supabase
      .from('tryon_results')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h);

    return {
      ca: {
        value: Math.round(ca24h / 100), // cents → euros
        delta: caPrev > 0 ? Math.round(((ca24h - caPrev) / caPrev) * 100) : 0,
      },
      orders: {
        value: ordersCount,
        delta: ordersCount - ordersPrev,
      },
      tryon: {
        value: tryonCount ?? 0,
        delta: 0, // TODO : calcul vs prev 24h
      },
      avgBasket: {
        value: Math.round(avgBasket / 100),
        delta: 0,
      },
    };
  }),

  // ─── Liste commandes (paginée) ──────────────────
  listOrders: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled']).default('all'),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from('orders')
        .select('id, user_id, total_amount, status, created_at, users(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== 'all') {
        q = q.eq('status', input.status);
      }

      const { data, count, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Liste produits avec stats ventes ────────────
  listProducts: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { data: wigs, error } = await ctx.supabase
        .from('wigs')
        .select('id, slug, name, base_price, stock_quantity, active, featured, category')
        .order('featured', { ascending: false })
        .limit(input.limit);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      // Calcul ventes par wig depuis order_items (en parallèle)
      const wigIds = (wigs ?? []).map((w) => w.id);
      const { data: sales } = await ctx.supabase
        .from('order_items')
        .select('wig_id, quantity, price_at_purchase')
        .in('wig_id', wigIds);

      const statsByWig = new Map<string, { units: number; revenue: number }>();
      for (const s of sales ?? []) {
        const cur = statsByWig.get(s.wig_id) ?? { units: 0, revenue: 0 };
        cur.units += s.quantity ?? 0;
        cur.revenue += (s.price_at_purchase ?? 0) * (s.quantity ?? 0);
        statsByWig.set(s.wig_id, cur);
      }

      return (wigs ?? []).map((w) => ({
        ...w,
        sales: statsByWig.get(w.id) ?? { units: 0, revenue: 0 },
      }));
    }),

  // ─── Liste clients ───────────────────────────────
  listCustomers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      tier: z.enum(['all', 'bronze', 'argent', 'or', 'vip']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from('users')
        .select('id, email, full_name, role, points, tier, newsletter, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.tier !== 'all') {
        q = q.eq('tier', input.tier);
      }

      const { data, count, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Toggle feature flag ─────────────────────────
  toggleFlag: adminProcedure
    .input(z.object({
      key: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('feature_flags')
        .update({
          enabled: input.enabled,
          updated_at: new Date().toISOString(),
          updated_by: ctx.user.id,
        })
        .eq('key', input.key);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Détail d'une commande ───────────────────────
  orderDetails: adminProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('orders')
        .select(`
          id, user_id, total_amount, status, created_at, shipping_address, payment_intent_id,
          users(full_name, email, phone),
          order_items(id, wig_id, quantity, price_at_purchase, wigs(slug, name))
        `)
        .eq('id', input.orderId)
        .single();
      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: error.message });
      return data;
    }),

  // ─── Update statut commande ──────────────────────
  setOrderStatus: adminProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('orders')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.orderId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Update produit (prix, stock, flags) ─────────
  updateProduct: adminProcedure
    .input(z.object({
      productId: z.string().uuid(),
      patch: z.object({
        base_price: z.number().int().min(0).optional(),
        stock_quantity: z.number().int().min(0).optional(),
        active: z.boolean().optional(),
        featured: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('wigs')
        .update({ ...input.patch, updated_at: new Date().toISOString() })
        .eq('id', input.productId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Promote user to admin ───────────────────────
  setUserRole: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(['customer', 'admin', 'support']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Garde-fou : un admin ne peut pas s'auto-démote (laisser au moins 1 admin)
      if (input.userId === ctx.user.id && input.role !== 'admin') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tu ne peux pas te retirer le rôle admin toi-même. Demande à un autre admin.',
        });
      }
      const { error } = await ctx.supabase
        .from('users')
        .update({ role: input.role })
        .eq('id', input.userId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),
});
