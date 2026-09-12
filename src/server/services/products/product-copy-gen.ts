import OpenAI from 'openai';
import { z } from 'zod';
import { getBrandSettings } from '@/lib/settings/service';

/**
 * Génération de fiche produit par IA — assistant admin pour l'ajout d'une
 * perruque (demande explicite Fresnel, 2026-09-12 : équivalent du wizard IA
 * de Sandy Stylish côté admin, absent de GloryHairRiot jusqu'ici).
 *
 * Différence volontaire avec le wizard Sandy : celui de Sandy est taillé
 * pour de la bijouterie (garde-fou fraude "or", faits pierre/matière) — non
 * transposable tel quel à des perruques. Ici les faits sont propres au
 * métier (catégorie/texture, construction, longueur, couleur, type de
 * cheveux) et le prompt est réécrit pour cette identité de marque.
 *
 * Pattern DeepSeek repris à l'identique de article-gen.ts / newsletter-gen.ts
 * (client lazy, JSON forcé, parsing robuste anti-troncature).
 */

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

export type ProductCopyGenErrorCode =
  | 'MISSING_KEY'
  | 'INVALID_KEY'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'NETWORK'
  | 'PARSE_ERROR';

export class ProductCopyGenError extends Error {
  code: ProductCopyGenErrorCode;
  status?: number;
  constructor(code: ProductCopyGenErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface ProductFacts {
  name: string;
  category: string;
  constructionType: string;
  length?: string;
  color?: string;
  hairType?: string;
  priceEuros: number;
}

// Fonction plutôt que const (même raison que article-gen/newsletter-gen) :
// le nom de marque vient de /admin/reglages (settings.brand_name).
function buildSystemPrompt(brandName: string): string {
  return `Tu es la rédactrice produit de ${brandName}, maison de perruques 100% cheveux humains premium (lace front HD, qualité Remy). Ton éditorial élégant et chaleureux, jamais "punk fanzine" (identité révolue). Tu écris en français ET en anglais.

RÈGLE DE PONCTUATION STRICTE : n'utilise JAMAIS le tiret cadratin (—) ni le tiret demi-cadratin (–), dans aucune langue. Remplace-les toujours par une virgule, un point, deux-points, ou reformule la phrase.

RÈGLE ANTI-HALLUCINATION (c'est une vraie fiche produit affichée à de vraies clientes, pas un brouillon créatif libre) : base-toi UNIQUEMENT sur les faits produit fournis ci-dessous (nom, catégorie/texture, type de construction, longueur, couleur, type de cheveux, prix). N'invente AUCUNE caractéristique technique non donnée (densité, poids, marque de fixation, garantie, origine géographique précise, certification).

Tu dois répondre UNIQUEMENT avec un objet JSON valide (sans texte avant ni après, sans balises markdown \`\`\`), avec exactement ces clés :
- "description_fr" : chapô produit, 1 à 2 phrases, environ 120 à 180 caractères.
- "long_description_fr" : description complète en Markdown simple (pas de tableaux ni d'images), 150 à 300 mots : présente la texture, la coupe, le rendu porté, à qui elle s'adresse. Un conseil d'entretien général est bienvenu, mais sans inventer de produit d'entretien précis.
- "meta_description_fr" : 150 caractères maximum, orientée SEO, sans emoji.
- "name_en" : traduction naturelle et commerciale du nom (pas mot à mot si ça sonne mal en anglais).
- "description_en" : équivalent anglais de description_fr (réécriture naturelle, pas une traduction littérale).
- "long_description_en" : équivalent anglais de long_description_fr.
- "meta_description_en" : 155 caractères maximum.`;
}

function buildUserPrompt(facts: ProductFacts): string {
  return [
    `Faits produit (n'en invente aucun autre) :`,
    `- Nom : ${facts.name}`,
    `- Catégorie/texture : ${facts.category}`,
    `- Type de construction : ${facts.constructionType}`,
    facts.length ? `- Longueur : ${facts.length}` : '',
    facts.color ? `- Couleur : ${facts.color}` : '',
    facts.hairType ? `- Type de cheveux : ${facts.hairType}` : '',
    `- Prix : ${facts.priceEuros}€`,
    ``,
    `Réponds avec le JSON demandé, rien d'autre.`,
  ].filter(Boolean).join('\n');
}

const CopySchema = z.object({
  description_fr: z.string().min(3),
  long_description_fr: z.string().min(20),
  meta_description_fr: z.string().min(3),
  name_en: z.string().min(1),
  description_en: z.string().min(3),
  long_description_en: z.string().min(20),
  meta_description_en: z.string().min(3),
});

export type GeneratedProductCopy = z.infer<typeof CopySchema>;

export async function generateProductCopy(facts: ProductFacts): Promise<GeneratedProductCopy> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new ProductCopyGenError('MISSING_KEY', 'DEEPSEEK_API_KEY non configurée côté serveur.');
  }

  let raw: string;
  try {
    const brand = await getBrandSettings();
    const response = await getDeepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildSystemPrompt(brand.name) },
        { role: 'user', content: buildUserPrompt(facts) },
      ],
      temperature: 0.6,
      max_tokens: 4096, // marge large : jamais tronquer le JSON (cf. mémoire troncature max_tokens)
      response_format: { type: 'json_object' },
    });

    raw = response.choices[0]?.message?.content ?? '';
  } catch (error) {
    const e = error as { status?: number; code?: string; message?: string };
    const status = e?.status;
    const msg = e?.message ?? String(error);

    if (status === 401 || status === 403) {
      throw new ProductCopyGenError('INVALID_KEY', `Clé DeepSeek invalide ou révoquée (HTTP ${status}).`, status);
    }
    if (status === 429) {
      throw new ProductCopyGenError('RATE_LIMIT', 'Limite de requêtes DeepSeek atteinte. Réessayez dans une minute.', status);
    }
    if (e?.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
      throw new ProductCopyGenError('TIMEOUT', 'DeepSeek a mis trop de temps à répondre.', status);
    }
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED' || /fetch failed/i.test(msg)) {
      throw new ProductCopyGenError('NETWORK', "Impossible de joindre l'API DeepSeek.", status);
    }
    throw new ProductCopyGenError('PROVIDER_ERROR', `DeepSeek a renvoyé une erreur : ${msg.slice(0, 200)}`, status);
  }

  if (!raw) {
    throw new ProductCopyGenError('PROVIDER_ERROR', 'DeepSeek a renvoyé une réponse vide.');
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new ProductCopyGenError('PARSE_ERROR', 'Réponse DeepSeek non-JSON (aucun objet détecté, possible troncature).');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    throw new ProductCopyGenError(
      'PARSE_ERROR',
      `JSON invalide renvoyé par DeepSeek (probable troncature) : ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const result = CopySchema.safeParse(parsed);
  if (!result.success) {
    throw new ProductCopyGenError('PARSE_ERROR', `JSON DeepSeek incomplet : ${result.error.message.slice(0, 300)}`);
  }

  return result.data;
}
