import OpenAI from 'openai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getBrandSettings } from '@/lib/settings/service';

/**
 * Génération d'articles magazine par IA — texte (DeepSeek) + image de
 * couverture (Gemini 2.5 Flash Image).
 *
 * Patterns repris de ce projet :
 * - Client DeepSeek lazy + OpenAI-compat baseURL : src/server/services/elodie/elodie.service.ts
 * - Appel Gemini generateContent + décodage base64 : src/app/api/tryon/route.ts (provider Gemini, ~L184-235)
 *
 * Différences volontaires :
 * - response_format: { type: 'json_object' } (DeepSeek exige le mot "JSON"
 *   explicite dans le prompt sous peine de 400 — présent dans le system prompt).
 * - max_tokens large (4096) : un article 500-900 mots + JSON overhead ne doit
 *   JAMAIS être tronqué (piège documenté : JSON.parse plante sur un JSON coupé).
 * - Gemini reçoit UN seul texte (pas d'image en entrée, contrairement au tryon
 *   qui fait de l'édition d'image à partir de 2 photos).
 * - GEMINI_API_KEY absente ou appel en échec → on retourne `null`, JAMAIS une
 *   exception : l'article doit pouvoir être créé en brouillon sans couverture.
 */

// ─── Client DeepSeek (lazy, comme elodie.service.ts) ─────────────────────

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

// ─── Erreurs ──────────────────────────────────────────────────────────

export type ArticleGenErrorCode =
  | 'MISSING_KEY'
  | 'INVALID_KEY'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'NETWORK'
  | 'PARSE_ERROR';

export class ArticleGenError extends Error {
  code: ArticleGenErrorCode;
  status?: number;
  constructor(code: ArticleGenErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── Prompt texte (ton éditorial élégant, PAS "fanzine punk") ────────────

// Fonction plutôt que const (rebrand, Phase 2) : le nom de marque vient
// désormais de /admin/reglages (settings.brand_name).
function buildArticleSystemPrompt(brandName: string): string {
  return `Tu es la rédactrice en chef du magazine de ${brandName}, une maison de perruques 100% cheveux humains premium (lace front HD, qualité Remy). Le magazine a abandonné son ancienne identité "fanzine punk" : le ton actuel est éditorial, élégant, chaleureux — proche d'un magazine beauté haut de gamme (registre "Sandy Stylish", recoloré dans la palette bordeaux/ivoire de ${brandName}). Tu écris en français.

Tu rédiges des articles qui mélangent conseils pratiques concrets (entretien, pose, choix de coloris, morphologie du visage) et inspiration (tendances, mise en beauté, confiance en soi). Interdiction d'utiliser un vocabulaire "punk", "rebelle", "zine", "tampon" ou "fanzine" — ce registre est révolu, ne le réintroduis jamais.

Règle de ponctuation stricte, valable pour TOUS les champs texte ci-dessous : n'utilise JAMAIS le tiret cadratin (—) ni le tiret demi-cadratin (–), même dans un titre. Remplace-les toujours par une virgule, un point, deux-points, ou reformule la phrase.

Tu dois répondre UNIQUEMENT avec un objet JSON valide (format JSON strict, sans aucun texte avant ni après, sans balises markdown \`\`\`), avec exactement ces clés :
- "title" : titre accrocheur et élégant (string)
- "excerpt" : chapô de 1 à 2 phrases, environ 140 à 200 caractères (string)
- "content" : corps de l'article en Markdown simple (des sous-titres avec "## " si utile, des paragraphes séparés par une ligne vide, pas de tableaux ni d'images intégrées), entre 500 et 900 mots. INTERDICTION d'utiliser le tiret cadratin (—) ou le tiret demi-cadratin (–) : utilise systématiquement une virgule, un point, deux-points ou une reformulation à la place.
- "tag" : une catégorie courte en 1 à 2 mots (ex. "Entretien", "Couleur", "Tendance", "Conseil pro")
- "image_prompt" : description en français d'UNE scène photographique CONCRÈTE et élégante liée à l'univers capillaire, destinée à illustrer la couverture — par exemple un gros plan sur une texture de cheveux, un flacon de soin capillaire, une brosse ou un fer à lisser, une ambiance de salon de coiffure, un geste de coiffage. INTERDICTION FORMELLE de métaphore visuelle abstraite ou de cliché littéral (par exemple : jamais de sablier pour évoquer "le temps", jamais d'horloge, de boussole, d'ampoule, d'échelle, de labyrinthe, de puzzle). INTERDICTION de texte, logo ou watermark visible dans la scène décrite. Ne décris pas de visage précis sauf si le sujet de l'article l'exige explicitement.`;
}

function buildUserPrompt(subject: string, tag?: string): string {
  return [
    `Sujet de l'article : "${subject}"`,
    tag ? `Catégorie souhaitée : "${tag}" (reprends-la telle quelle dans le champ "tag" du JSON).` : '',
    ``,
    `Réponds avec le JSON demandé, rien d'autre.`,
  ].filter(Boolean).join('\n');
}

const ArticleJsonSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(3),
  content: z.string().min(50),
  tag: z.string().min(1).optional(),
  image_prompt: z.string().min(3),
});

export interface GeneratedArticleText {
  title: string;
  excerpt: string;
  content: string;
  tag?: string;
  image_prompt: string;
}

/**
 * Génère le texte de l'article via DeepSeek (deepseek-chat, JSON forcé).
 * Parsing robuste : on extrait la sous-chaîne entre la 1ère '{' et la
 * dernière '}' avant JSON.parse (au lieu d'un parse naïf) pour tolérer
 * un éventuel texte parasite autour du JSON — mais PAS une troncature en
 * plein milieu de l'objet, d'où le max_tokens généreux ci-dessous.
 */
export async function generateArticleText(subject: string, tag?: string): Promise<GeneratedArticleText> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new ArticleGenError('MISSING_KEY', 'DEEPSEEK_API_KEY non configurée côté serveur.');
  }

  let raw: string;
  try {
    const brand = await getBrandSettings();
    const response = await getDeepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildArticleSystemPrompt(brand.name) },
        { role: 'user', content: buildUserPrompt(subject, tag) },
      ],
      temperature: 0.7,
      max_tokens: 4096, // marge confortable : 900 mots FR + overhead JSON ne doit jamais tronquer
      response_format: { type: 'json_object' },
    });

    raw = response.choices[0]?.message?.content ?? '';
  } catch (error) {
    const e = error as { status?: number; code?: string; message?: string };
    const status = e?.status;
    const msg = e?.message ?? String(error);

    if (status === 401 || status === 403) {
      throw new ArticleGenError('INVALID_KEY', `Clé DeepSeek invalide ou révoquée (HTTP ${status}).`, status);
    }
    if (status === 429) {
      throw new ArticleGenError('RATE_LIMIT', 'Limite de requêtes DeepSeek atteinte. Réessayez dans une minute.', status);
    }
    if (e?.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
      throw new ArticleGenError('TIMEOUT', 'DeepSeek a mis trop de temps à répondre.', status);
    }
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED' || /fetch failed/i.test(msg)) {
      throw new ArticleGenError('NETWORK', "Impossible de joindre l'API DeepSeek.", status);
    }
    throw new ArticleGenError('PROVIDER_ERROR', `DeepSeek a renvoyé une erreur : ${msg.slice(0, 200)}`, status);
  }

  if (!raw) {
    throw new ArticleGenError('PROVIDER_ERROR', 'DeepSeek a renvoyé une réponse vide.');
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new ArticleGenError('PARSE_ERROR', "Réponse DeepSeek non-JSON (aucun objet détecté — possible troncature).");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    throw new ArticleGenError(
      'PARSE_ERROR',
      `JSON invalide renvoyé par DeepSeek (probable troncature) : ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const result = ArticleJsonSchema.safeParse(parsed);
  if (!result.success) {
    throw new ArticleGenError('PARSE_ERROR', `JSON DeepSeek incomplet : ${result.error.message.slice(0, 300)}`);
  }

  return result.data;
}

// ─── Image de couverture (Gemini 2.5 Flash Image) ────────────────────────

/* Suffixe de style constant appliqué à TOUT prompt d'image de couverture,
   pour une identité visuelle cohérente sur l'ensemble du magazine. */
const IMAGE_STYLE_SUFFIX = "Photographie éditoriale premium, palette bordeaux profond et ivoire, lumière douce et flatteuse, cadrage soigné façon magazine beauté haut de gamme, format portrait. Aucun texte, logo ou watermark incrusté dans l'image. Aucune personne reconnaissable ou identifiable, sauf si la scène décrite l'exige explicitement.";

/* Sanitizer best-effort : le LLM qui rédige `image_prompt` glisse parfois
   malgré la consigne un cliché visuel littéral (ex. sujet "gagner du temps"
   → une image de sablier — piège documenté sur un autre projet de la même
   écurie). On retire les motifs les plus évidents avant l'envoi à Gemini.
   Ce n'est PAS exhaustif : c'est une 2e ligne de défense après l'instruction
   stricte du prompt DeepSeek, pas un filtre garanti — amélioration future
   possible : liste plus large / détection sémantique. */
const CLICHE_PATTERNS: RegExp[] = [
  /\bsabliers?\b/gi,
  /\bhorloges?\b/gi,
  /\bmontres? à gousset\b/gi,
  /\bboussoles?\b/gi,
  /\bampoules?( allumées?| électriques?)?\b/gi,
  /\béchelles?( vers le succès| du succès)?\b/gi,
  /\bentonnoirs?\b/gi,
  /\bpuzzles?\b/gi,
  /\blabyrinthes?\b/gi,
  /\bpanneaux? de signalisation\b/gi,
];

function sanitizeImagePrompt(prompt: string): string {
  let out = prompt;
  for (const re of CLICHE_PATTERNS) out = out.replace(re, '');
  return out.replace(/\s{2,}/g, ' ').trim();
}

export interface GeneratedCoverImage {
  buffer: Buffer;
  mimeType: string;
}

interface GeminiImagePart {
  text?: string;
  inline_data?: { mime_type?: string; data?: string };
  inlineData?: { mimeType?: string; data?: string };
}

/**
 * Génère l'image de couverture via Gemini. Ne lance JAMAIS d'exception :
 * retourne `null` sur toute défaillance (clé absente, erreur HTTP, réponse
 * sans image) pour que l'appelant puisse créer l'article en brouillon SANS
 * couverture plutôt que d'échouer entièrement — décision produit explicite
 * (voir prompt de la tâche : l'admin publie/régénère la couverture plus tard).
 */
export async function generateArticleCoverImage(imagePrompt: string): Promise<GeneratedCoverImage | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[article-gen] GEMINI_API_KEY absente — article créé sans image de couverture.');
    return null;
  }

  const fullPrompt = `${sanitizeImagePrompt(imagePrompt)}\n\n${IMAGE_STYLE_SUFFIX}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.warn(`[article-gen] Gemini image error ${r.status}: ${errText.slice(0, 280)}`);
      return null;
    }

    const json = await r.json() as {
      candidates?: Array<{ content?: { parts?: GeminiImagePart[] } }>;
    };

    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inline_data || p.inlineData);
    if (!imgPart) {
      const txt = parts.find((p) => p.text)?.text ?? JSON.stringify(json).slice(0, 240);
      console.warn(`[article-gen] Gemini a répondu sans image (probable filtrage sécurité) : ${txt}`);
      return null;
    }

    const inline = (imgPart.inline_data ?? imgPart.inlineData) as { mime_type?: string; mimeType?: string; data?: string } | undefined;
    const data = inline?.data;
    if (!data) return null;

    const mimeType = inline?.mime_type ?? inline?.mimeType ?? 'image/png';
    return { buffer: Buffer.from(data, 'base64'), mimeType };
  } catch (err) {
    console.warn('[article-gen] Gemini image generation failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── Réhébergement Supabase Storage (bucket `article-covers`, public) ────

function extFromMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

/**
 * Upload l'image décodée dans le bucket public `article-covers` via un
 * client service_role (bypass RLS/Storage policies — pas de policy Storage
 * dédiée créée pour l'écriture, seul le bucket est marqué public en lecture,
 * cf. migration 007). Retourne l'URL publique, ou `null` en cas d'échec
 * (jamais d'exception : même logique défensive que generateArticleCoverImage).
 */
export async function uploadArticleCover(buffer: Buffer, mimeType: string, slug: string): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient(true);
    const path = `${slug}-${Date.now()}.${extFromMime(mimeType)}`;

    const { error } = await supabase.storage
      .from('article-covers')
      .upload(path, buffer, { contentType: mimeType, cacheControl: '31536000', upsert: false });

    if (error) {
      console.warn('[article-gen] Storage upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('article-covers').getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch (err) {
    console.warn('[article-gen] uploadArticleCover threw:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Supprime l'image de couverture d'un article dans Storage à partir de son
 * URL publique. Best-effort : appelée en fire-and-forget depuis
 * admin.deleteArticle, une erreur ici ne doit jamais faire échouer la
 * suppression de l'article lui-même (documenté comme limite acceptée).
 */
export async function deleteArticleCoverImage(publicUrl: string): Promise<void> {
  const marker = '/article-covers/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
  const supabase = await createServerSupabaseClient(true);
  const { error } = await supabase.storage.from('article-covers').remove([path]);
  if (error) throw new Error(error.message);
}
