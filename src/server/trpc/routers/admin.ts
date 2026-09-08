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

    // CA + count commandes 24h
    const { data: recent } = await supabase
      .from('orders')
      .select('total_cents, created_at')
      .gte('created_at', last24h);

    const { data: prevDay } = await supabase
      .from('orders')
      .select('total_cents')
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
  orderDetails: adminProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('orders')
        .select(`
          id, user_id, total_cents, status, created_at, shipping_address, payment_intent_id,
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
