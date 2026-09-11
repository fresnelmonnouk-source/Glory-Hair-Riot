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
import {
  generateNewsletterDraft,
  sendNewsletterToActiveSubscribers,
  NewsletterGenError,
} from '@/server/services/newsletter/newsletter-gen';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateArticleText,
  generateArticleCoverImage,
  uploadArticleCover,
  deleteArticleCoverImage,
  ArticleGenError,
} from '@/server/services/articles/article-gen';

/** Kebab-case ASCII, sans accents — pour dériver le slug d'un article depuis son titre. */
function slugifyTitle(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'article';
}

/* Filtre PostgREST "commande comptée comme CA" — paiement à la livraison dès
   la commande passée (vente réelle, rien à confirmer en ligne), OU tout
   moyen de paiement une fois confirmé (paid/shipped/delivered). Exclut
   toujours les commandes annulées, et les paiements en ligne encore
   'pending' (webhook pas encore reçu, migration 012 — les compter
   surestimerait le CA). Partagé entre kpis et getStatistics. */
const REVENUE_ORDER_FILTER = 'and(payment_method.eq.cod,status.neq.cancelled),status.in.(paid,shipped,delivered)';

/** Ajoute un suffixe numérique (-2, -3, ...) tant que le slug existe déjà en base. */
async function uniqueArticleSlug(supabase: SupabaseClient, baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let n = 2;
  // Borné en pratique par le nombre d'articles réellement en collision — pas de garde-fou
  // de boucle car chaque itération avance strictement (n++) et finit par trouver un slug libre.
  for (;;) {
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${n}`;
    n += 1;
  }
}

export const adminRouter = router({
  // ─── Dashboard KPIs ──────────────────────────────
  kpis: adminProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const last24h = new Date(Date.now() - 24 * 3600_000).toISOString();
    const prev24h = new Date(Date.now() - 48 * 3600_000).toISOString();

    // CA + count commandes 24h — exclut les paiements en ligne (stripe/
    // fedapay) encore 'pending' (webhook de confirmation pas encore reçu,
    // migration 012) pour ne pas surestimer le CA, mais garde le paiement à
    // la livraison (payment_method='cod') dès la commande passée — c'est
    // une vente réelle, rien à confirmer en ligne, seul le cash arrive plus
    // tard. Exclut toujours les commandes annulées.
    const { data: recent } = await supabase
      .from('orders')
      .select('total_cents, created_at')
      .or(REVENUE_ORDER_FILTER)
      .gte('created_at', last24h);

    const { data: prevDay } = await supabase
      .from('orders')
      .select('total_cents')
      .or(REVENUE_ORDER_FILTER)
      .gte('created_at', prev24h)
      .lt('created_at', last24h);

    const ca24h = (recent ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
    const caPrev = (prevDay ?? []).reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
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

  // ─── Statistiques avancées (page /admin/analytics) ──
  // Port du pattern getStatistics de Sandy Stylish, adapté au schéma
  // wigs/orders/order_items — remplace le stub "Bientôt disponible" (gap
  // #9 de l'audit de parité).
  getStatistics: adminProcedure
    .input(z.object({ days: z.union([z.literal(30), z.literal(90), z.literal(365)]).default(30) }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const since = new Date(Date.now() - input.days * 24 * 3600_000).toISOString();

      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, status, payment_method, total_cents, created_at')
        .gte('created_at', since);

      if (ordersErr) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ordersErr.message });

      const statusCounts = new Map<string, number>();
      const revenueOrderIds: string[] = [];
      let revenue = 0;

      for (const o of orders ?? []) {
        statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
        const isRevenue = o.status === 'cancelled'
          ? false
          : (o.payment_method === 'cod' || ['paid', 'shipped', 'delivered'].includes(o.status));
        if (isRevenue) {
          revenueOrderIds.push(o.id);
          revenue += o.total_cents ?? 0;
        }
      }

      const statusSplit = [...statusCounts.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      const ordersCount = revenueOrderIds.length;
      const averageBasket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

      if (revenueOrderIds.length === 0) {
        return { periodDays: input.days, revenue: 0, ordersCount: 0, itemsSold: 0, averageBasket: 0, topProducts: [], categories: [], statusSplit };
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('wig_id, quantity, unit_price_cents, wigs(name, category)')
        .in('order_id', revenueOrderIds);

      type ItemRow = { wig_id: string; quantity: number; unit_price_cents: number; wigs: { name: string; category: string }[] | null };
      const rows = (items ?? []) as unknown as ItemRow[];

      let itemsSold = 0;
      const byWig = new Map<string, { name: string; quantity: number; revenue: number }>();
      const byCategory = new Map<string, number>();

      for (const it of rows) {
        const wig = it.wigs?.[0];
        const name = wig?.name ?? 'Produit supprimé';
        const qty = it.quantity ?? 0;
        const lineRevenue = (it.unit_price_cents ?? 0) * qty;
        itemsSold += qty;

        const entry = byWig.get(it.wig_id) ?? { name, quantity: 0, revenue: 0 };
        entry.quantity += qty;
        entry.revenue += lineRevenue;
        byWig.set(it.wig_id, entry);

        if (wig?.category) {
          byCategory.set(wig.category, (byCategory.get(wig.category) ?? 0) + qty);
        }
      }

      const topProducts = [...byWig.values()]
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 6);

      const categorized = [...byCategory.values()].reduce((s, n) => s + n, 0);
      const categories = categorized > 0
        ? [...byCategory.entries()]
            .map(([code, quantity]) => ({ code, label: code, quantity, pct: Math.round((quantity / categorized) * 100) }))
            .sort((a, b) => b.quantity - a.quantity)
        : [];

      return { periodDays: input.days, revenue, ordersCount, itemsSold, averageBasket, topProducts, categories, statusSplit };
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
        .select('id, user_id, total_cents, status, created_at, users(full_name, email)', { count: 'exact' })
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

      // Calcul ventes par wig depuis order_items (en parallèle).
      // NB : référençait auparavant order_items.price_at_purchase, une colonne
      // inexistante (vraie colonne : unit_price_cents, cf. migration 001) — le
      // select échouait silencieusement (error ignorée), les stats de vente
      // affichaient donc toujours 0 sur /admin/produits. Même bug que celui
      // corrigé sur orderDetails ci-dessus, corrigé ici pour la même raison.
      //
      // Uniquement les commandes comptées comme CA (REVENUE_ORDER_FILTER,
      // même règle que kpis/getStatistics) — sinon un article commandé mais
      // jamais payé en ligne (webhook pas encore reçu, ou annulé) gonflerait
      // artificiellement ses ventes affichées.
      const wigIds = (wigs ?? []).map((w) => w.id);
      const { data: revenueOrders } = await ctx.supabase.from('orders').select('id').or(REVENUE_ORDER_FILTER);
      const revenueOrderIds = (revenueOrders ?? []).map((o) => o.id);

      const { data: sales } = revenueOrderIds.length === 0
        ? { data: [] }
        : await ctx.supabase
            .from('order_items')
            .select('wig_id, quantity, unit_price_cents')
            .in('wig_id', wigIds)
            .in('order_id', revenueOrderIds);

      const statsByWig = new Map<string, { units: number; revenue: number }>();
      for (const s of sales ?? []) {
        const cur = statsByWig.get(s.wig_id) ?? { units: 0, revenue: 0 };
        cur.units += s.quantity ?? 0;
        cur.revenue += (s.unit_price_cents ?? 0) * (s.quantity ?? 0);
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

  // ─── Liste des feature flags ─────────────────────
  listFlags: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('feature_flags')
      .select('key, enabled, description, updated_at')
      .order('key', { ascending: true });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
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

  // ─── Réglages paiement (clé FedaPay, migration 006) ──
  // Le secret n'est JAMAIS renvoyé en clair — seulement s'il est configuré
  // ou non. Le vrai appel API FedaPay (checkout) lit la valeur via
  // src/lib/settings/service.ts en service_role, pas via cette query.
  getPaymentSettings: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'fedapay_public_key', 'fedapay_secret_key', 'fedapay_environment',
        'stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret',
      ]);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    return {
      fedapay_public_key: map.fedapay_public_key ?? '',
      fedapay_environment: (map.fedapay_environment === 'sandbox' ? 'sandbox' : 'live') as 'live' | 'sandbox',
      fedapay_secret_configured: !!map.fedapay_secret_key,
      stripe_publishable_key: map.stripe_publishable_key ?? '',
      stripe_secret_configured: !!map.stripe_secret_key,
      stripe_webhook_secret_configured: !!map.stripe_webhook_secret,
    };
  }),

  savePaymentSettings: adminProcedure
    .input(z.object({
      fedapay_public_key: z.string().optional(),
      fedapay_secret_key: z.string().optional(), // vide/absent = on garde l'existant
      fedapay_environment: z.enum(['live', 'sandbox']).optional(),
      stripe_publishable_key: z.string().optional(),
      stripe_secret_key: z.string().optional(), // vide/absent = on garde l'existant
      stripe_webhook_secret: z.string().optional(), // idem
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const rows: { key: string; value: string; updated_at: string; updated_by: string }[] = [];
      if (input.fedapay_public_key !== undefined) {
        rows.push({ key: 'fedapay_public_key', value: input.fedapay_public_key, updated_at: now, updated_by: ctx.user.id });
      }
      if (input.fedapay_secret_key) {
        rows.push({ key: 'fedapay_secret_key', value: input.fedapay_secret_key, updated_at: now, updated_by: ctx.user.id });
      }
      if (input.fedapay_environment !== undefined) {
        rows.push({ key: 'fedapay_environment', value: input.fedapay_environment, updated_at: now, updated_by: ctx.user.id });
      }
      if (input.stripe_publishable_key !== undefined) {
        rows.push({ key: 'stripe_publishable_key', value: input.stripe_publishable_key, updated_at: now, updated_by: ctx.user.id });
      }
      if (input.stripe_secret_key) {
        rows.push({ key: 'stripe_secret_key', value: input.stripe_secret_key, updated_at: now, updated_by: ctx.user.id });
      }
      if (input.stripe_webhook_secret) {
        rows.push({ key: 'stripe_webhook_secret', value: input.stripe_webhook_secret, updated_at: now, updated_by: ctx.user.id });
      }
      if (rows.length === 0) return { ok: true };

      const { error } = await ctx.supabase.from('settings').upsert(rows, { onConflict: 'key' });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Détail d'une commande ───────────────────────
  // NB : cette procédure existait déjà mais référençait des colonnes qui
  // n'existent pas dans le schéma réel (shipping_address, payment_intent_id,
  // order_items.price_at_purchase — cf. migration 001 : orders a
  // delivery_name/delivery_street/.../stripe_payment_intent_id/
  // fedapay_transaction_id, order_items a unit_price_cents). Le select
  // échouait donc systématiquement (colonne inconnue → error → NOT_FOUND).
  // Corrigé ici sur les vrais noms de colonnes pour que la page détail
  // (/admin/commandes/[id]) puisse effectivement charger une commande.
  orderDetails: adminProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('orders')
        .select(`
          id, user_id, status,
          subtotal_cents, shipping_cents, discount_cents, total_cents,
          shipping_method, tracking_number,
          delivery_name, delivery_street, delivery_city, delivery_postal_code, delivery_country,
          payment_method, payment_status, stripe_payment_intent_id, fedapay_transaction_id,
          guest_email, guest_phone, notes, created_at, updated_at,
          users(full_name, email, phone),
          order_items(id, wig_id, variant_id, quantity, unit_price_cents, wigs(slug, name))
        `)
        .eq('id', input.orderId)
        .single();
      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Commande introuvable.' });
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
        name: z.string().min(1).max(200).optional(),
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

  // ─── Créer un produit ────────────────────────────
  // Slug unique vérifié explicitement (message clair) + filet de sécurité sur
  // la contrainte UNIQUE en base (23505) si une création concurrente gagne
  // la course entre la vérification et l'insert.
  createProduct: adminProcedure
    .input(z.object({
      slug: z.string()
        .min(1).max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets uniquement (ex. "lace-front-blonde").'),
      name: z.string().min(1).max(200),
      base_price: z.number().int().min(1, 'Le prix doit être supérieur à 0.'),
      category: z.string().min(1).max(60),
      description: z.string().max(2000).optional(),
      long_description: z.string().max(10000).optional(),
      hair_type: z.string().max(60).optional(),
      length: z.string().max(60).optional(),
      color: z.string().max(60).optional(),
      construction_type: z.string().max(60).optional(),
      tag: z.string().max(30).optional(),
      sku: z.string().max(60).optional(),
      stock_quantity: z.number().int().min(0).default(0),
      display_order: z.number().int().default(0),
      active: z.boolean().default(true),
      featured: z.boolean().default(false),
      is_pack: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: checkError } = await ctx.supabase
        .from('wigs')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle();
      if (checkError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: checkError.message });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: `Le slug "${input.slug}" est déjà utilisé par un autre produit.` });
      }

      const { data, error } = await ctx.supabase
        .from('wigs')
        .insert({
          slug: input.slug,
          name: input.name,
          base_price: input.base_price,
          category: input.category,
          description: input.description ?? null,
          long_description: input.long_description ?? null,
          hair_type: input.hair_type ?? null,
          length: input.length ?? null,
          color: input.color ?? null,
          construction_type: input.construction_type ?? null,
          tag: input.tag ?? null,
          sku: input.sku ?? null,
          stock_quantity: input.stock_quantity,
          display_order: input.display_order,
          active: input.active,
          featured: input.featured,
          is_pack: input.is_pack,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: `Le slug "${input.slug}" est déjà utilisé par un autre produit.` });
        }
        if (error.code === '42501') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Écriture refusée par la base (RLS). La migration supabase/migrations/011_admin_wigs_tryon_rls.sql doit être appliquée (Dashboard Supabase → SQL Editor) avant de pouvoir créer un produit.',
          });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  // ─── Supprimer un produit ────────────────────────
  // Ne casse jamais l'intégrité d'un historique de commande réel : si des
  // order_items référencent ce produit, on refuse (message clair, proposant
  // de désactiver plutôt). order_items.wig_id est de toute façon en
  // ON DELETE RESTRICT (migration 001) — cette vérification explicite donne
  // juste un message compréhensible avant de heurter la contrainte FK brute.
  deleteProduct: adminProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { count, error: countError } = await ctx.supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('wig_id', input.productId);
      if (countError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: countError.message });
      if ((count ?? 0) > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce produit a des commandes associées, désactive-le plutôt que de le supprimer.',
        });
      }

      // wig_images n'est PAS strictement nécessaire (ON DELETE CASCADE sur
      // wig_id) mais supprimé explicitement comme demandé — défensif si la
      // cascade venait à changer.
      const { error: imagesError } = await ctx.supabase.from('wig_images').delete().eq('wig_id', input.productId);
      if (imagesError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: imagesError.message });

      const { error } = await ctx.supabase.from('wigs').delete().eq('id', input.productId);
      if (error) {
        if (error.code === '23503') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce produit a des commandes associées, désactive-le plutôt que de le supprimer.',
          });
        }
        if (error.code === '42501') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Suppression refusée par la base (RLS). La migration supabase/migrations/011_admin_wigs_tryon_rls.sql doit être appliquée (Dashboard Supabase → SQL Editor) avant de pouvoir supprimer un produit.',
          });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return { ok: true };
    }),

  // ─── Packs (migration 015) ───────────────────────
  // Un pack = une ligne `wigs` (is_pack=true, prix fixé directement par
  // l'admin — jamais calculé depuis les composants, cf. commentaire de la
  // migration). `pack_items` n'est qu'un manifeste de composition, jamais
  // touché par le checkout. Création/édition/suppression du pack lui-même :
  // réutilise createProduct/updateProduct/deleteProduct ci-dessus.
  listPacks: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('wigs')
      .select('id, slug, name, base_price, stock_quantity, active')
      .eq('is_pack', true)
      .order('created_at', { ascending: false });
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  // Candidats pour composer un pack : tout produit qui n'est PAS lui-même
  // un pack (pas de pack imbriqué dans un pack).
  listPackableProducts: adminProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('wigs')
      .select('id, slug, name')
      .eq('is_pack', false)
      .order('name', { ascending: true });
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  getPackItems: adminProcedure
    .input(z.object({ packId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('pack_items')
        .select('id, wig_id, quantity, display_order, wigs!pack_items_wig_id_fkey(name, slug)')
        .eq('pack_id', input.packId)
        .order('display_order', { ascending: true });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  // Remplace toute la composition d'un pack en un coup (delete + re-insert) —
  // suffisant pour un formulaire admin qui soumet la liste complète à chaque
  // sauvegarde, pas de diff incrémental nécessaire.
  setPackItems: adminProcedure
    .input(z.object({
      packId: z.string().uuid(),
      items: z.array(z.object({
        wigId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })).max(30),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error: delError } = await ctx.supabase.from('pack_items').delete().eq('pack_id', input.packId);
      if (delError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: delError.message });

      if (input.items.length === 0) return { ok: true };

      const rows = input.items.map((it, i) => ({
        pack_id: input.packId,
        wig_id: it.wigId,
        quantity: it.quantity,
        display_order: i,
      }));
      const { error: insError } = await ctx.supabase.from('pack_items').insert(rows);
      if (insError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: insError.message });
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
          message: 'Vous ne pouvez pas vous retirer le rôle admin vous-même. Demandez à un autre admin.',
        });
      }
      const { error } = await ctx.supabase
        .from('users')
        .update({ role: input.role })
        .eq('id', input.userId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Détail d'un client ──────────────────────────
  // Profil complet + ses commandes récentes (requête séparée sur orders,
  // pas de FK inverse pratique à joindre proprement ici) + son historique
  // d'essai virtuel (tryon_results). Nécessite la policy admin sur
  // tryon_results ajoutée par la migration 011 (aucune policy admin
  // n'existait avant — seul le propriétaire ou un essai "shared" étaient
  // lisibles, cf. migration 001).
  customerDetails: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: profile, error: profileError } = await ctx.supabase
        .from('users')
        .select('id, email, full_name, avatar_url, phone, street_address, city, postal_code, country, role, points, tier, newsletter, accepts_marketing, created_at')
        .eq('id', input.userId)
        .maybeSingle();
      if (profileError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: profileError.message });
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client introuvable.' });

      const { data: orders, error: ordersError } = await ctx.supabase
        .from('orders')
        .select('id, status, total_cents, created_at')
        .eq('user_id', input.userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (ordersError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ordersError.message });

      const { data: tryons, error: tryonsError } = await ctx.supabase
        .from('tryon_results')
        .select('id, wig_id, snapshot_url, shared, created_at, wigs(name, slug)')
        .eq('user_id', input.userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (tryonsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: tryonsError.message });

      return { profile, orders: orders ?? [], tryons: tryons ?? [] };
    }),

  // ─── Magazine — génération d'articles par IA (migration 007) ────
  // Texte : DeepSeek (JSON forcé). Couverture : Gemini, best-effort — un
  // échec image ne bloque JAMAIS la création de l'article (brouillon sans
  // cover_image_url, régénérable/publiable depuis /admin/contenu).
  generateArticle: adminProcedure
    .input(z.object({
      subject: z.string().min(3).max(300),
      tag: z.string().max(60).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let text;
      try {
        text = await generateArticleText(input.subject, input.tag);
      } catch (err) {
        if (err instanceof ArticleGenError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Échec de la génération du texte de l\'article.' });
      }

      const baseSlug = slugifyTitle(text.title);
      const slug = await uniqueArticleSlug(ctx.supabase, baseSlug);

      // Couverture best-effort : jamais d'exception qui ferait échouer toute la génération.
      let coverUrl: string | null = null;
      try {
        const image = await generateArticleCoverImage(text.image_prompt);
        if (image) {
          coverUrl = await uploadArticleCover(image.buffer, image.mimeType, slug);
        }
      } catch (err) {
        console.warn('[admin.generateArticle] couverture IA échouée, article créé sans image :', err);
      }

      const { data, error } = await ctx.supabase
        .from('articles')
        .insert({
          slug,
          title: text.title,
          excerpt: text.excerpt,
          content: text.content,
          cover_image_url: coverUrl,
          tag: input.tag ?? text.tag ?? null,
          status: 'draft',
          created_by: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  // ─── Liste des articles (brouillons + publiés), paginée ─────────
  listArticles: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'draft', 'published']).default('all'),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from('articles')
        .select('id, slug, title, excerpt, tag, status, cover_image_url, published_at, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== 'all') {
        q = q.eq('status', input.status);
      }

      const { data, count, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Publier / dépublier un article ──────────────────────────────
  publishArticle: adminProcedure
    .input(z.object({ articleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('articles')
        .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', input.articleId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  unpublishArticle: adminProcedure
    .input(z.object({ articleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('articles')
        .update({ status: 'draft', published_at: null, updated_at: new Date().toISOString() })
        .eq('id', input.articleId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),

  // ─── Supprimer un article ─────────────────────────────────────────
  // Cleanup de l'image Storage en best-effort (fire-and-forget) : un échec
  // laisse un fichier orphelin dans le bucket, non bloquant, documenté.
  deleteArticle: adminProcedure
    .input(z.object({ articleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from('articles')
        .select('cover_image_url')
        .eq('id', input.articleId)
        .maybeSingle();

      const { error } = await ctx.supabase.from('articles').delete().eq('id', input.articleId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      if (existing?.cover_image_url) {
        deleteArticleCoverImage(existing.cover_image_url).catch((err) => {
          console.warn('[admin.deleteArticle] nettoyage image Storage échoué (fichier orphelin) :', err);
        });
      }

      return { ok: true };
    }),

  // ─── Newsletter IA — historique + génération/envoi manuels (migration 008) ──
  // Le CRON hebdomadaire (src/app/api/cron/newsletter/route.ts) utilise le
  // même service (generateNewsletterDraft / sendNewsletterToActiveSubscribers)
  // — ces procédures couvrent la génération/l'envoi À LA DEMANDE depuis
  // /admin/newsletter, indépendamment du planning CRON.
  listNewsletters: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { data, count, error } = await ctx.supabase
        .from('newsletters')
        .select('id, subject, status, recipients_count, sent_at, created_at, created_by', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { items: data ?? [], total: count ?? 0 };
    }),

  // ─── Génère un brouillon à la demande (hors CRON) ────────────────
  generateNewsletterDraft: adminProcedure.mutation(async ({ ctx }) => {
    let draft;
    try {
      draft = await generateNewsletterDraft();
    } catch (err) {
      const message = err instanceof NewsletterGenError ? err.message : 'Échec de la génération de la newsletter.';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }

    const { data, error } = await ctx.supabase
      .from('newsletters')
      .insert({
        subject: draft.subject,
        html_body: draft.html_body,
        status: 'draft',
        created_by: ctx.user.id,
      })
      .select('id, subject, status, recipients_count, sent_at, created_at, created_by')
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data;
  }),

  // ─── Envoie manuellement un brouillon existant à tous les abonnés actifs ──
  sendNewsletter: adminProcedure
    .input(z.object({ newsletterId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: nl, error: fetchError } = await ctx.supabase
        .from('newsletters')
        .select('id, subject, html_body, status')
        .eq('id', input.newsletterId)
        .single();

      if (fetchError || !nl) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Newsletter introuvable.' });
      }
      if (nl.status === 'sent') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cette newsletter a déjà été envoyée.' });
      }

      try {
        const { recipientsCount } = await sendNewsletterToActiveSubscribers(ctx.supabase, nl.subject, nl.html_body);

        const { error: updateError } = await ctx.supabase
          .from('newsletters')
          .update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: recipientsCount })
          .eq('id', input.newsletterId);

        if (updateError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateError.message });

        return { ok: true, recipientsCount };
      } catch (err) {
        // Envoi (ou mise à jour du statut sent) échoué : marque 'failed' plutôt
        // que de laisser le brouillon dans un état ambigu.
        await ctx.supabase.from('newsletters').update({ status: 'failed' }).eq('id', input.newsletterId);
        if (err instanceof TRPCError) throw err;
        const message = err instanceof Error ? err.message : 'Échec de l\'envoi de la newsletter.';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
      }
    }),
});
