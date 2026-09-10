/**
 * Service Newsletter IA — génération + envoi.
 *
 * generateNewsletterDraft() :
 *   Rassemble la matière première réelle (perruques + articles publiés) et
 *   demande à DeepSeek de rédiger un brouillon { subject, html_body }.
 *   N'insère RIEN en base — c'est à l'appelant (CRON ou mutation tRPC) de
 *   décider (created_by null pour le CRON, ctx.user.id pour un admin).
 *
 * sendNewsletterToActiveSubscribers() :
 *   Envoie un HTML donné à tous les abonnés actifs (newsletter_subscribers
 *   où unsubscribed_at IS NULL), en lot via l'API Batch de Resend (jusqu'à
 *   100 destinataires par requête — limite documentée Resend). Partagée
 *   entre la route CRON et la mutation admin.sendNewsletter pour éviter la
 *   duplication de logique d'envoi en masse (périmètre de fichiers imposé :
 *   pas de nouveau fichier newsletter-send.ts, tout reste ici).
 *
 * Pattern DeepSeek repris de src/server/services/elodie/elodie.service.ts :
 * client OpenAI-compatible instancié en lazy (évite un throw au build
 * Vercel si DEEPSEEK_API_KEY est absente), baseURL DeepSeek, modèle
 * deepseek-chat.
 */

import OpenAI from 'openai';
import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ────────────────────────────────────────────────────────────────────────
// Erreurs
// ────────────────────────────────────────────────────────────────────────

export type NewsletterGenErrorCode =
  | 'MISSING_KEY'
  | 'EMPTY_MATERIAL'
  | 'PROVIDER_ERROR'
  | 'PARSE_ERROR'
  | 'EMPTY_CONTENT';

export class NewsletterGenError extends Error {
  code: NewsletterGenErrorCode;
  constructor(code: NewsletterGenErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'NewsletterGenError';
  }
}

// ────────────────────────────────────────────────────────────────────────
// Client DeepSeek (lazy — même pattern que elodie.service.ts)
// ────────────────────────────────────────────────────────────────────────

let _deepseek: OpenAI | null = null;
function getDeepseek(): OpenAI {
  if (!_deepseek) {
    _deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY ?? 'missing-key',
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _deepseek;
}

// ────────────────────────────────────────────────────────────────────────
// Matière première
// ────────────────────────────────────────────────────────────────────────

interface WigMaterial {
  name: string;
  slug: string;
  description: string | null;
  price_display: string; // ex: "72€" — prix réel formaté, jamais inventé
  category: string | null;
}

interface ArticleMaterial {
  title: string;
  excerpt: string | null;
  slug: string;
}

async function fetchWigMaterial(supabase: SupabaseClient): Promise<WigMaterial[]> {
  const { data, error } = await supabase
    .from('wigs')
    .select('name, slug, description, base_price, category, featured, display_order, active')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(5);

  if (error) {
    // wigs est une table cœur du catalogue — si la lecture échoue, on log
    // fort mais on ne fait pas planter toute la génération pour autant
    // (même logique défensive que pour `articles`, cohérence du service).
    console.error('[newsletter-gen] lecture wigs échouée:', error.message);
    return [];
  }

  return (data ?? []).map((w) => ({
    name: w.name as string,
    slug: w.slug as string,
    description: (w.description as string | null) ?? null,
    price_display: `${Math.round((w.base_price as number) / 100)}€`,
    category: (w.category as string | null) ?? null,
  }));
}

/**
 * La table `articles` (migration 007, agent Magazine) peut ne pas encore
 * exister en base — les migrations de ce projet sont collées manuellement
 * par Fresnel, pas exécutées automatiquement. Requête strictement
 * défensive : toute erreur (table absente, réseau, etc.) fait continuer la
 * génération SANS cette source plutôt que de la faire échouer.
 */
async function fetchArticleMaterial(supabase: SupabaseClient): Promise<ArticleMaterial[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('title, excerpt, slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.warn('[newsletter-gen] table articles indisponible, on continue sans (', error.message, ')');
      return [];
    }

    return (data ?? []).map((a) => ({
      title: a.title as string,
      excerpt: (a.excerpt as string | null) ?? null,
      slug: a.slug as string,
    }));
  } catch (err) {
    console.warn('[newsletter-gen] exception lecture articles, on continue sans:', err);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────
// Prompt
// ────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es la rédactrice éditoriale IA de la newsletter hebdomadaire de Glory Hair, marque de perruques 100% cheveux humains. Univers de marque : premium, élégant, palette bordeaux/ivoire, jamais de ton "punk fanzine" ou familier (cette identité est révolue).

RÈGLE DE PONCTUATION STRICTE : n'utilise JAMAIS le tiret cadratin (—) ni le tiret demi-cadratin (–), dans le sujet comme dans le corps. Remplace-les toujours par une virgule, un point, deux-points, ou reformule la phrase.

RÈGLES STRICTES ANTI-HALLUCINATION (c'est un email commercial réel envoyé à de vraies abonnées, pas un brouillon créatif libre) :
1. N'invente JAMAIS un prix, un pourcentage de réduction, une offre promotionnelle ou une date limite qui ne t'a pas été fournie explicitement dans les données ci-dessous.
2. Utilise UNIQUEMENT les prix donnés, recopiés tels quels (ex: "72€"). Si aucun prix n'est fourni pour un élément, ne mentionne AUCUN prix pour lui — ne calcule rien, n'estime rien.
3. Ne mentionne aucune réduction, code promo, livraison offerte ou urgence ("plus que 3 jours", "stock limité"...) sauf si cette information t'a été explicitement donnée.
4. N'invente pas de nouveaux produits, avis clients, statistiques, chiffres de vente ou témoignages.
5. Si aucune matière (ni perruques ni articles) ne t'est fournie, rédige un contenu éditorial générique sur l'univers de la marque, sans inventer de produit précis.

FORMAT DE SORTIE — réponds UNIQUEMENT avec un objet JSON valide, rien d'autre :
{ "subject": string, "html_body": string }

- "subject" : objet d'email court et engageant (moins de 70 caractères), cohérent avec le contenu.
- "html_body" : HTML simple et propre, pensé pour un client mail (styles inline basiques si besoin, PAS de <script>, PAS de feuille de style externe, PAS de sélecteurs CSS avancés). Structure suggérée : une accroche courte, puis 3 à 5 éléments (perruques et/ou articles fournis) présentés avec leur nom + description courte + prix réel s'il est fourni, puis un appel à l'action vers le catalogue. Ton élégant, phrases courtes, pas de superlatifs excessifs.`;

function buildUserPrompt(wigs: WigMaterial[], articles: ArticleMaterial[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glory-hair-riot.vercel.app';
  return `Voici les données RÉELLES à utiliser pour la newsletter de cette semaine. N'utilise aucune autre information que celle-ci (voir règles anti-hallucination).

PERRUQUES EN AVANT (catalogue actif) :
${wigs.length > 0 ? JSON.stringify(wigs, null, 2) : '(aucune perruque disponible cette semaine)'}

ARTICLES DE MAGAZINE RÉCENTS :
${articles.length > 0 ? JSON.stringify(articles, null, 2) : '(aucun article publié récemment)'}

URL du catalogue à utiliser pour le lien d'appel à l'action : ${appUrl}/boutique

Rédige la newsletter hebdomadaire au format JSON demandé.`;
}

// ────────────────────────────────────────────────────────────────────────
// Parsing robuste
// ────────────────────────────────────────────────────────────────────────

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new NewsletterGenError('EMPTY_CONTENT', 'DeepSeek a renvoyé une réponse vide.');
  }

  // Extraction défensive du bloc {...} avant JSON.parse : même si
  // response_format json_object est demandé, on ne fait jamais confiance
  // aveuglément à un LLM (cf. mémoire "pipeline LLM→JSON robuste").
  const match = trimmed.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new NewsletterGenError(
      'PARSE_ERROR',
      `Réponse DeepSeek non-JSON : ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────
// generateNewsletterDraft
// ────────────────────────────────────────────────────────────────────────

export interface NewsletterDraft {
  subject: string;
  html_body: string;
}

export async function generateNewsletterDraft(): Promise<NewsletterDraft> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new NewsletterGenError('MISSING_KEY', 'DEEPSEEK_API_KEY non configurée côté serveur.');
  }

  const supabase = await createServerSupabaseClient(true); // service role : pas de session (CRON) ni RLS à gérer ici

  const [wigs, articles] = await Promise.all([
    fetchWigMaterial(supabase),
    fetchArticleMaterial(supabase),
  ]);

  let completion;
  try {
    completion = await getDeepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(wigs, articles) },
      ],
      temperature: 0.6,
      max_tokens: 4096, // large : jamais tronquer le JSON (cf. mémoire troncature max_tokens)
      response_format: { type: 'json_object' },
    });
  } catch (error) {
    const e = error as { status?: number; message?: string };
    console.error('[newsletter-gen] DeepSeek API error:', error);
    throw new NewsletterGenError(
      'PROVIDER_ERROR',
      `DeepSeek a renvoyé une erreur (HTTP ${e?.status ?? '?'}) : ${(e?.message ?? String(error)).slice(0, 200)}`,
    );
  }

  const raw = completion.choices[0]?.message?.content ?? '';
  const parsed = extractJsonObject(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new NewsletterGenError('PARSE_ERROR', 'Réponse DeepSeek : JSON valide mais pas un objet.');
  }

  const { subject, html_body } = parsed as Record<string, unknown>;

  if (typeof subject !== 'string' || !subject.trim() || typeof html_body !== 'string' || !html_body.trim()) {
    throw new NewsletterGenError(
      'PARSE_ERROR',
      'Réponse DeepSeek incomplète : "subject" ou "html_body" manquant ou vide.',
    );
  }

  return { subject: subject.trim(), html_body: html_body.trim() };
}

// ────────────────────────────────────────────────────────────────────────
// sendNewsletterToActiveSubscribers — envoi en masse partagé (CRON + admin)
// ────────────────────────────────────────────────────────────────────────

export interface NewsletterSendResult {
  recipientsCount: number;
}

/**
 * Envoie `htmlBody` à tous les abonnés actifs (unsubscribed_at IS NULL).
 *
 * Choix d'implémentation : sendEmail() (src/lib/email/send.ts) est conçu
 * pour un destinataire unique basé sur un template fichier — pas adapté à
 * un envoi en masse de contenu généré dynamiquement. On utilise donc
 * directement l'API Batch de Resend (resend.batch.send), qui accepte
 * jusqu'à 100 emails par requête (limite documentée Resend) : on découpe
 * la liste en lots de 100. Un lot qui échoue est loggé et n'interrompt pas
 * les lots suivants (mieux vaut un envoi partiel réel qu'un abandon total).
 *
 * Chaque email reçoit un pied de page de désabonnement personnalisé
 * (même URL/convention que /api/newsletter → email-newsletter-confirm.html :
 * /sav?action=unsubscribe&email=...).
 */
export async function sendNewsletterToActiveSubscribers(
  supabase: SupabaseClient,
  subject: string,
  htmlBody: string,
): Promise<NewsletterSendResult> {
  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .is('unsubscribed_at', null);

  if (error) {
    throw new NewsletterGenError('PROVIDER_ERROR', `Impossible de charger les abonnés : ${error.message}`);
  }

  const emails = (subscribers ?? [])
    .map((s) => (s as { email: string }).email)
    .filter((e): e is string => typeof e === 'string' && e.length > 0);

  if (emails.length === 0) {
    return { recipientsCount: 0 };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[newsletter-gen] RESEND_API_KEY absente — envoi impossible, 0 email envoyé.');
    return { recipientsCount: 0 };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || 'Glory Hair RIOT <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const BATCH_SIZE = 100; // limite Resend Batch API
  let sent = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const payload = chunk.map((email) => ({
      from,
      to: email,
      subject,
      html: appendUnsubscribeFooter(htmlBody, email, appUrl),
    }));

    try {
      await resend.batch.send(payload);
      sent += chunk.length;
    } catch (err) {
      // On continue les lots suivants plutôt que d'abandonner tout l'envoi —
      // recipients_count reflètera alors le nombre réel de lots réussis.
      console.error(`[newsletter-gen] échec du lot ${i / BATCH_SIZE + 1} (${chunk.length} destinataires), lot ignoré:`, err);
    }
  }

  return { recipientsCount: sent };
}

function appendUnsubscribeFooter(html: string, email: string, appUrl: string): string {
  const unsubscribeUrl = `${appUrl}/sav?action=unsubscribe&email=${encodeURIComponent(email)}`;
  const footer = `
    <hr style="margin:32px 0;border:none;border-top:1px solid #e6ddd4;" />
    <p style="font-family:sans-serif;font-size:12px;color:#8a8078;text-align:center;line-height:1.6;">
      Tu reçois cet email car tu es inscrit·e à la newsletter Glory Hair RIOT.<br />
      <a href="${unsubscribeUrl}" style="color:#7a1f2b;">Se désabonner</a>
    </p>`;
  return `${html}${footer}`;
}
