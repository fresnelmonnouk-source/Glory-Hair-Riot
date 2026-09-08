/* Vérification de fidélité faciale post-génération — filet de sécurité DÉTERMINISTE.
 *
 * Pourquoi ce fichier existe : buildTryOnPrompt() (voir /api/tryon/route.ts) contient déjà
 * un prompt très strict (6 ABSOLUTE RULES + self-audit checklist) qui demande au modèle de
 * ne PAS toucher au visage. Mais un LLM multimodal généraliste (Gemini 2.5 Flash Image,
 * gpt-image-1) n'offre AUCUNE garantie déterministe de respecter des instructions textuelles
 * sur la préservation de pixels — le modèle peut dériver sur le visage même avec le meilleur
 * prompt du monde. Ce module ajoute donc une VÉRIFICATION a posteriori : on redemande à un
 * modèle vision (léger, différent du modèle de génération) de comparer le visage de la photo
 * ORIGINALE à celui de l'image GÉNÉRÉE et de juger si c'est la même personne. Si non → le
 * provider est traité comme ayant échoué et /api/tryon.route.ts enchaîne sur le fallback
 * suivant dans sa chaîne existante (exactement comme une erreur réseau/API classique).
 *
 * Choix du modèle de vérification (coût/latence) :
 * - Gemini "gemini-flash-latest" (texte+vision, PAS le modèle image gemini-2.5-flash-image
 *   utilisé pour la génération — voir commentaire détaillé sur callGeminiVerify ci-dessous
 *   pour pourquoi un alias "-latest" plutôt qu'une version figée) : 2 images en entrée
 *   (~258 tokens/image côté Gemini) + prompt court (~120 tokens) + sortie JSON (~30 tokens)
 *   ≈ 700 tokens au total, dans la même fourchette tarifaire "flash" que le reste de la
 *   famille Gemini (de l'ordre de 0,3-1 $/1M tokens entrée) → coût par vérification de
 *   l'ordre de 0,0005 $ (≈ 0,05 centime) — négligeable face aux 4-17 centimes de la
 *   génération elle-même. Latence mesurée en test réel (2026-09, images 128x128 et 512x512) :
 *   ~1-1,4s.
 * - OpenAI gpt-4o-mini (fallback si c'est OpenAI qui vient de générer, ou si GEMINI_API_KEY
 *   est absente) : images envoyées en detail:"low" → coût fixe ~85 tokens/image côté OpenAI
 *   quelle que soit la résolution, donc ~170 tokens image + ~120 tokens prompt + ~40 tokens
 *   sortie. Aux tarifs gpt-4o-mini (~0,15 $/1M entrée, ~0,60 $/1M sortie), coût ≈ 0,00008 $
 *   par vérification. Latence observée : ~1-2s.
 * Dans les deux cas : coût quasi nul et latence courte devant maxDuration=60 déjà en place
 * pour toute la route (génération + fallback compris).
 *
 * On réutilise volontairement la clé API du provider qui vient de RÉUSSIR la génération
 * (on sait donc qu'elle est valide pour cette requête) plutôt que d'exiger une 3e clé dédiée.
 *
 * ─── FAIL-OPEN INTENTIONNEL (lire avant de modifier) ───────────────────────────────────
 * Si CE vérificateur plante lui-même (timeout, clé absente/révoquée, JSON invalide, panne
 * API du modèle de vérification), on ne bloque JAMAIS l'essai à cause d'un bug du filet de
 * sécurité : verifyFaceIdentity() retourne alors `{ checked: false, ... }` et l'appelant
 * (route.ts) doit laisser passer le résultat original tel quel. Un vérificateur cassé qui
 * bloque tous les essais serait STRICTEMENT PIRE que l'absence de vérificateur. Ne jamais
 * transformer une erreur technique du vérificateur en échec du try-on.
 */

export type FaceVerifyProvider = 'gemini' | 'openai';

export interface FaceVerifyResult {
  /** false = le vérificateur lui-même a échoué techniquement (skip, fail-open). */
  checked: boolean;
  /** Fiable uniquement si checked === true. Vaut true par défaut quand checked === false
   *  (fail-open : on ne bloque pas), pour que l'appelant puisse utiliser directement
   *  `!checked || samePerson` comme condition de passage s'il le souhaite. */
  samePerson: boolean;
  /** 0-100. Fiable uniquement si checked === true (vaut 0 sinon). */
  confidence: number;
  /** Motif renvoyé par le modèle si checked===true, ou motif technique du skip sinon. */
  reason: string;
  /** Provider effectivement utilisé pour la vérification, ou null si skip avant tout appel. */
  provider: FaceVerifyProvider | null;
  latencyMs: number;
}

interface VerifyArgs {
  originalBase64: string;
  originalMime: string;
  generatedBase64: string;
  generatedMime: string;
  /** Provider qui vient de générer l'image — on réutilise sa clé en priorité. */
  preferredProvider: FaceVerifyProvider;
}

// Prompt volontairement court et fermé : une tâche de comparaison simple n'a pas besoin
// de la même profondeur que buildTryOnPrompt() (qui, lui, guide une génération complexe).
const FACE_VERIFY_PROMPT = [
  'Compare these two photos.',
  'IMAGE 1 is a reference photo of a person. IMAGE 2 is a generated photo meant to show the SAME person wearing a different hairstyle (a wig).',
  'Judge ONLY the face — facial structure, eyes, nose, mouth, jawline, skin tone. IGNORE hair, wig, hairstyle and hair color entirely, they are expected to differ.',
  'Does the face in IMAGE 2 belong to the same individual as IMAGE 1?',
  'Reply with STRICT JSON only, nothing else, no markdown fences, no explanation outside the JSON:',
  '{"same_person": true or false, "confidence": integer 0-100, "reason": "one short sentence"}',
].join(' ');

// Budget de temps pour CE seul appel de vérification. La route entière a maxDuration=60 et
// la génération (Gemini/OpenAI) peut déjà prendre plusieurs secondes à ~20s — on garde donc
// la vérification volontairement courte pour laisser de la marge à un éventuel fallback.
const VERIFY_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function clampConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

interface VerdictJson {
  same_person?: unknown;
  confidence?: unknown;
  reason?: unknown;
}

// Modèle : alias "gemini-flash-latest" plutôt qu'une version figée (ex: "gemini-2.5-flash").
// Constat en testant ce module (2026-09) : "gemini-2.5-flash" renvoie déjà 404 "no longer
// available to new users" sur la clé de ce projet, alors qu'il apparaît encore dans
// ListModels — les versions Gemini figées se font retirer sous les pieds sans préavis
// applicatif. L'alias "-latest" est maintenu par Google pour toujours pointer vers un
// modèle flash en production, ce qui est exactement la propriété de fiabilité recherchée
// pour un vérificateur fail-open à faible enjeu (mieux vaut un modèle qui répond toujours,
// quitte à ce que son comportement précis dérive légèrement dans le temps, plutôt qu'un nom
// figé qui finit 404 et fait tomber la vérification en fail-open en permanence).
async function callGeminiVerify(args: VerifyArgs, apiKey: string): Promise<VerdictJson> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{
      parts: [
        { text: FACE_VERIFY_PROMPT },
        { inline_data: { mime_type: args.originalMime, data: args.originalBase64 } },
        { inline_data: { mime_type: args.generatedMime, data: args.generatedBase64 } },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
      // Budget plus large que le strict nécessaire pour le JSON de sortie (~30 tokens) :
      // certains modèles Gemini récents consomment une partie de maxOutputTokens en tokens
      // de "raisonnement" internes avant de produire la réponse visible — un budget trop
      // serré tronque alors la sortie utile à une chaîne vide.
      maxOutputTokens: 500,
    },
  };

  const r = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, VERIFY_TIMEOUT_MS);

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Gemini verify · ${r.status} · ${errText.slice(0, 200)}`);
  }

  const json = await r.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse Gemini verify sans texte exploitable.');
  return JSON.parse(text) as VerdictJson;
}

async function callOpenAIVerify(args: VerifyArgs, apiKey: string): Promise<VerdictJson> {
  const body = {
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: FACE_VERIFY_PROMPT },
        { type: 'image_url', image_url: { url: `data:${args.originalMime};base64,${args.originalBase64}`, detail: 'low' } },
        { type: 'image_url', image_url: { url: `data:${args.generatedMime};base64,${args.generatedBase64}`, detail: 'low' } },
      ],
    }],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 200,
  };

  const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  }, VERIFY_TIMEOUT_MS);

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`OpenAI verify · ${r.status} · ${errText.slice(0, 200)}`);
  }

  const json = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Réponse OpenAI verify sans contenu exploitable.');
  return JSON.parse(text) as VerdictJson;
}

/**
 * Compare le visage de la photo originale à celui de l'image générée et retourne un verdict.
 * Ne lève JAMAIS d'exception : toute erreur technique interne est capturée et retournée sous
 * forme de `{ checked: false, ... }` (fail-open, voir commentaire en tête de fichier).
 */
export async function verifyFaceIdentity(args: VerifyArgs): Promise<FaceVerifyResult> {
  const t0 = performance.now();
  try {
    // Respecte le même interrupteur que la chaîne de génération (route.ts) : si Gemini est
    // désactivé (ex. quota/facturation console non rechargé), on ne l'utilise pas non plus
    // ici, même en fallback — cohérence avec l'intention de l'opérateur de ne plus taper sur
    // ce compte Gemini du tout, pas seulement pour la génération d'image.
    const geminiDisabled = process.env.TRYON_DISABLE_GEMINI === '1';
    const geminiKey = geminiDisabled ? undefined : process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let useProvider: FaceVerifyProvider | null = null;
    if (args.preferredProvider === 'gemini' && geminiKey) useProvider = 'gemini';
    else if (args.preferredProvider === 'openai' && openaiKey) useProvider = 'openai';
    else if (geminiKey) useProvider = 'gemini';
    else if (openaiKey) useProvider = 'openai';

    if (!useProvider) {
      return {
        checked: false,
        samePerson: true,
        confidence: 0,
        reason: 'Aucune clé API disponible pour la vérification de fidélité faciale.',
        provider: null,
        latencyMs: Math.round(performance.now() - t0),
      };
    }

    const verdict = useProvider === 'gemini'
      ? await callGeminiVerify(args, geminiKey!)
      : await callOpenAIVerify(args, openaiKey!);

    return {
      checked: true,
      samePerson: Boolean(verdict.same_person),
      confidence: clampConfidence(verdict.confidence),
      reason: typeof verdict.reason === 'string' ? verdict.reason.slice(0, 300) : '',
      provider: useProvider,
      latencyMs: Math.round(performance.now() - t0),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      checked: false,
      samePerson: true,
      confidence: 0,
      reason: `Vérificateur de fidélité faciale indisponible : ${msg.slice(0, 200)}`,
      provider: null,
      latencyMs: Math.round(performance.now() - t0),
    };
  }
}
