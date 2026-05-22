/* /api/tryon — Backend proxy IA (Gemini primary, OpenAI fallback)
 *
 * Source de vérité : tryon/systeme.md §9.1 (clés serveur) + §6 (fallback chain).
 * Port serveur du sandbox `tryon-live-providers.jsx`.
 *
 * Body JSON :
 *   { personBase64: string, personMime: 'image/jpeg'|'image/png', wigId: string }
 * Réponse 200 :
 *   { resultBase64, mimeType, provider, costCents, latencyMs, attempts }
 * Réponse 4xx / 5xx :
 *   { error: string, attempts?: [...] }
 */

import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { WIG_BY_ID, type Wig } from '@/lib/wigs-data';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkLimit, getRequestIp, formatResetDuration } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ─── Types ─────────────────────────────────────────────

interface ProviderResult {
  resultBase64: string;
  mimeType: string;
  costCents: number;
  latencyMs: number;
  raw: unknown;
}

interface ProviderDef {
  id: 'gemini' | 'openai';
  label: string;
  costCents: number;
  envKey: string;
  generate: (args: {
    personBase64: string;
    personMime: string;
    wigBase64: string;
    wigMime: string;
    wig: Wig;
    apiKey: string;
  }) => Promise<ProviderResult>;
}

// ─── Prompt (renforcé v2 — zéro modif accessoires/peau/visage + fidélité wig stricte) ───

function buildTryOnPrompt(wig: Wig): string {
  return [
    `TASK — Surgical hair-only inpainting. ONE region changes (the hair). EVERYTHING ELSE is FROZEN.`,
    ``,
    `MENTAL MODEL — Think of IMAGE 1 as a LOCKED BASE LAYER. You have a binary mask covering ONLY the hair region of IMAGE 1. INSIDE the mask: paint the wig from IMAGE 2. OUTSIDE the mask: COPY pixels 1-to-1 from IMAGE 1 without any change. There is NO "rest of the image to regenerate" — only the hair region is regenerated.`,
    ``,
    `INPUTS:`,
    `- IMAGE 1 = the person. SOURCE OF TRUTH for the face, body, skin, clothing, accessories, lighting, background, pose. Treat IMAGE 1 as a LOCKED COMPOSITE — copy every single pixel that is not the hair region.`,
    `- IMAGE 2 = the reference wig "${wig.name}". SOURCE OF TRUTH for the new hair ONLY: exact color, exact length, exact texture, exact parting, exact volume, exact hairline shape, exact strand pattern.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #1 — IDENTITY PRESERVATION (NON-NEGOTIABLE)`,
    `═══════════════════════════════════════════════════════════════════`,
    `The person in the output MUST be the EXACT SAME individual as in IMAGE 1. A close friend should instantly recognize them. The face, body, AND OUTFIT are NOT to be regenerated, redrawn, retouched, or "improved" in any way — they must be reproduced pixel-perfect from IMAGE 1. You are NOT painting a portrait — you are swapping a wig on a fixed photograph.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #2 — SKIN: ZERO MODIFICATION (CRITICAL)`,
    `═══════════════════════════════════════════════════════════════════`,
    `The user's skin color, tone, undertone and shade MUST stay EXACTLY as in IMAGE 1. This is a fundamental respect rule:`,
    `- DO NOT lighten the skin. DO NOT darken the skin. DO NOT shift the undertone (warm/cool/neutral).`,
    `- DO NOT "whitewash", "tan", "even out", or "harmonize" the skin tone.`,
    `- DO NOT smooth pores, remove freckles, hide moles, cover blemishes, fade scars, erase birthmarks, soften wrinkles.`,
    `- DO NOT apply ANY kind of beauty filter, skin smoothing, or "glow up" effect.`,
    `- The skin texture, micro-detail, and color must be reproduced PIXEL-BY-PIXEL from IMAGE 1.`,
    `- If you cannot preserve the exact skin tone, RETURN IMAGE 1 UNCHANGED rather than altering it.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #3 — CLOTHING: ZERO MODIFICATION (CRITICAL)`,
    `═══════════════════════════════════════════════════════════════════`,
    `Every single garment visible in IMAGE 1 MUST be reproduced PIXEL-IDENTICAL. The torso, neckline, collar, shoulders area is a FROZEN ZONE — copy it byte-for-byte from IMAGE 1.`,
    `- COLOR: if the t-shirt is red, it STAYS red. If it is blue, it STAYS blue. If it is white, it STAYS white. If it is black, it STAYS black. NEVER shift, harmonize, recolor, brighten, darken, or "improve" any clothing color.`,
    `- PATTERN: stripes stay stripes, prints stay prints, plain stays plain. No new pattern invented, no existing pattern removed or simplified.`,
    `- FABRIC: cotton stays cotton, leather stays leather, knit stays knit. Texture and weave preserved.`,
    `- FIT & SHAPE: same silhouette, same neckline shape (V-neck stays V-neck, crew stays crew, button-up stays button-up), same sleeve type, same collar height.`,
    `- DETAILS: zippers, buttons, embroidery, logos, prints, seams, pockets, drawstrings — ALL preserved exactly.`,
    `- DO NOT swap garments (a t-shirt does NOT become a sweater, a hoodie does NOT become a shirt).`,
    `- DO NOT change the wearer of the photo — the person you see wearing this clothing is the SAME person in the output, with the SAME body underneath. Not a different model, not a "similar" person.`,
    `- If you cannot preserve the exact clothing, RETURN IMAGE 1 UNCHANGED rather than altering it.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #4 — ACCESSORIES: ZERO MODIFICATION (CRITICAL)`,
    `═══════════════════════════════════════════════════════════════════`,
    `Every accessory visible in IMAGE 1 MUST be preserved EXACTLY, including those partially hidden by the new hair. You have ZERO authorization to:`,
    `- REMOVE any accessory visible in IMAGE 1 (if the user wears a chain → the chain STAYS. Earrings → STAY. Glasses → STAY. Watch → STAYS. Piercing → STAYS. Ring → STAYS. Bracelet → STAYS. Necklace → STAYS. Pendant → STAYS. Scarf → STAYS. Tie → STAYS. Headphones → STAY. Hat or cap → STAYS.). NEVER assume an accessory is "decoration we can drop" — every visible accessory is mandatory.`,
    `- ADD any accessory that was not in IMAGE 1 (no new necklace, no new chain, no new earrings, no new watch, no new ring, no new bracelet, no new glasses, no new piercing, no new hat, no new headband, no new hair clip, no new scarf).`,
    `- MODIFY any accessory (no color change, no shape change, no material change, no size change — gold stays gold, silver stays silver, plastic stays plastic, gemstone stays the same gemstone).`,
    `- If the new hair PARTIALLY OBSCURES an accessory, preserve the visible portion EXACTLY where it shows. Do not "complete" or "remove" it. If an earring is half-hidden by a strand, the visible half stays.`,
    `- If you are UNCERTAIN whether something is hair, an accessory, or a hair-piece in IMAGE 1, treat it as an ACCESSORY and KEEP IT.`,
    `- ENUMERATE before outputting: mentally list every accessory you see in IMAGE 1 ("I see a gold chain, silver earrings, glasses, a watch") and verify each one is still present, in the same color, in the same place, in the output.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #5 — FACE: ZERO MODIFICATION`,
    `═══════════════════════════════════════════════════════════════════`,
    `Every facial feature MUST be reproduced exactly from IMAGE 1:`,
    `- Face shape, jawline, chin, cheekbones, forehead width, temples — IDENTICAL.`,
    `- Eyes: shape, size, color, iris pattern, eyelid shape, eyelashes (no extensions added), eyebrows (no reshaping, no thickening, no color change, no position shift).`,
    `- Nose: shape, size, width, nostril shape, bridge — IDENTICAL.`,
    `- Mouth: lip shape, lip color, lip thickness, expression, teeth — IDENTICAL.`,
    `- Ears (visible portions), earlobes — IDENTICAL.`,
    `- Makeup: preserve exactly. Do not add eyeliner, mascara, lipstick, blush, contour, highlighter. Do not remove existing makeup either.`,
    `- Facial hair (if present): preserve exactly.`,
    `- Age, perceived ethnicity, gender expression — IDENTICAL. Never make the person look younger, older, or different in any identity dimension.`,
    `- Head pose, tilt, rotation, gaze direction — IDENTICAL.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `ABSOLUTE RULE #6 — BODY, BACKGROUND, FRAMING: ZERO MODIFICATION`,
    `═══════════════════════════════════════════════════════════════════`,
    `- Neck, collarbone, shoulders, visible body parts — IDENTICAL.`,
    `- Background, props in scene, depth of field — IDENTICAL.`,
    `- Lighting direction, light color temperature, shadow placement, white balance, color grading — IDENTICAL. (No "improving" the photo's exposure or contrast.)`,
    `- Image dimensions, aspect ratio, framing, crop, zoom level — IDENTICAL.`,
    `- Photographic style, grain, sharpness, lens characteristics — IDENTICAL.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `WIG FIDELITY — STRICT MATCH WITH IMAGE 2 (CRITICAL)`,
    `═══════════════════════════════════════════════════════════════════`,
    `The wig in the output MUST look like the EXACT SAME wig as IMAGE 2. Not a similar wig, not an interpretation, not a "version" — the SAME wig.`,
    `Match IMAGE 2 strictly on:`,
    `- COLOR: exact tone "${wig.tone}", exact saturation, exact brightness, exact color variations and highlights/lowlights pattern.`,
    `- LENGTH: same length as IMAGE 2, do not shorten, do not extend.`,
    `- TEXTURE: ${wig.style} — strand shape, wave pattern, curl pattern must match exactly.`,
    `- STYLE / CONSTRUCTION: ${wig.cat} — same parting position, same volume distribution, same density, same hairline shape.`,
    `- STRAND BEHAVIOR: same flow, same direction, same layering visible in IMAGE 2.`,
    `Do NOT "improve", "stylize", or "adapt" the wig. Reproduce it faithfully on the user's head.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `HAIR PLACEMENT — TECHNICAL CONSTRAINTS`,
    `═══════════════════════════════════════════════════════════════════`,
    `- Replace ONLY the hair region of IMAGE 1 with the wig from IMAGE 2.`,
    `- The new hairline must follow the natural curve of the person's forehead and temples from IMAGE 1 — never cover the eyebrows, never push the hairline artificially lower.`,
    `- The wig must cast realistic shadows that match the existing lighting direction in IMAGE 1.`,
    `- Edges where hair meets skin must be soft and photographically natural — no halo, no harsh outline, no visible "wig cap" or "lace front" seam.`,
    `- If hair partially covers the face (bangs, side strands), the underlying face pixels must remain visible and unaltered where they would naturally show through.`,
    `- If the wig partially covers an accessory (earring partially hidden by long hair), preserve the accessory shape exactly where it remains visible. NEVER erase an accessory under the pretext that hair covers it.`,
    `- If the wig falls onto clothing (long hair on a shoulder), the CLOTHING UNDERNEATH where it shows must remain the same color and pattern as IMAGE 1.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `STRICTLY FORBIDDEN`,
    `═══════════════════════════════════════════════════════════════════`,
    `- Regenerating, beautifying, smoothing, retouching, or "improving" the face/skin/body in any way.`,
    `- Adding, removing, or modifying any accessory, jewelry, clothing item, makeup element, freckle, blemish, scar, or expression.`,
    `- Replacing the person wearing the clothing with a "more photogenic" model.`,
    `- Changing the COLOR of any garment for ANY reason (no harmonization with the new hair color, no contrast adjustment, no style coordination).`,
    `- Swapping a garment type (no t-shirt → sweater, no hoodie → shirt, no jacket → blazer).`,
    `- Changing the perceived age, ethnicity, skin tone, or identity of the person.`,
    `- Changing pose, expression, gaze, or head angle.`,
    `- Cartoon, illustration, painting, anime, or any stylized rendering.`,
    `- Text, watermark, logo, signature, brand name anywhere in the image.`,
    `- Different crop, framing, zoom, or aspect ratio than IMAGE 1.`,
    `- Interpreting the wig differently from IMAGE 2 ("creative reinterpretation" is forbidden).`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `SELF-AUDIT CHECKLIST (verify before outputting)`,
    `═══════════════════════════════════════════════════════════════════`,
    `Before finalizing the output, confirm each item. If ANY item fails, FIX it before outputting:`,
    `[ ] CLOTHING COLOR: every visible garment is the EXACT same color as IMAGE 1 (compare a torso patch from both — if even slightly different, FIX).`,
    `[ ] CLOTHING TYPE: every garment is the SAME garment type (t-shirt vs sweater, plain vs printed) as IMAGE 1.`,
    `[ ] ACCESSORIES INVENTORY: list every accessory visible in IMAGE 1 → verify each one is present in the output, in the same position, same color, same shape.`,
    `[ ] NO NEW ACCESSORIES: no accessory was added that wasn't in IMAGE 1.`,
    `[ ] PERSON IDENTITY: same individual (face, age, ethnicity, gender expression) as IMAGE 1.`,
    `[ ] SKIN TONE: identical to IMAGE 1 (compare a forehead patch from both).`,
    `[ ] FACE FEATURES: eyes/nose/mouth pixel-perfect from IMAGE 1.`,
    `[ ] WIG: color/length/texture matches IMAGE 2 exactly.`,
    `[ ] NO BEAUTY FILTER, no smoothing, no whitening, no glow-up.`,
    `[ ] BACKGROUND, lighting, framing identical to IMAGE 1.`,
    ``,
    `OUTPUT: ONE photorealistic image, same dimensions and crop as IMAGE 1, same person as IMAGE 1 (same skin, same face, same accessories, same clothes IN THE SAME COLOR, same background, same lighting), with ONLY the hair region replaced by the wig from IMAGE 2 (reproduced faithfully). NOTHING ELSE CHANGES.`,
  ].join('\n');
}

// ─── Provider 1 : Gemini 2.5 Flash Image (Nano Banana) ──

const Gemini: ProviderDef = {
  id: 'gemini',
  label: 'Gemini 2.5 Flash Image',
  costCents: 4,
  envKey: 'GEMINI_API_KEY',
  async generate({ personBase64, personMime, wigBase64, wigMime, wig, apiKey }) {
    const prompt = buildTryOnPrompt(wig);
    const t0 = performance.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: personMime, data: personBase64 } },
          { inline_data: { mime_type: wigMime, data: wigBase64 } },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE'] },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const latencyMs = Math.round(performance.now() - t0);

    if (!r.ok) {
      const errText = await r.text();
      let detail = errText;
      try { detail = JSON.parse(errText)?.error?.message || errText; } catch { /* keep raw */ }
      throw new Error(`Gemini · ${r.status} · ${detail.slice(0, 280)}`);
    }

    const json = await r.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; inline_data?: { mime_type?: string; data?: string }; inlineData?: { mimeType?: string; data?: string } }> } }>;
    };

    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find(p => p.inline_data || p.inlineData);
    if (!imgPart) {
      const txt = parts.find(p => p.text)?.text ?? JSON.stringify(json).slice(0, 240);
      throw new Error(`Aucune image dans la réponse Gemini · ${txt}`);
    }
    const inline = (imgPart.inline_data ?? imgPart.inlineData!) as { mime_type?: string; mimeType?: string; data?: string };
    const mime = inline.mime_type ?? inline.mimeType ?? 'image/png';
    const data = inline.data!;

    return { resultBase64: data, mimeType: mime, costCents: Gemini.costCents, latencyMs, raw: json };
  },
};

// ─── Provider 2 : OpenAI gpt-image-1 ────────────────────

const OpenAI: ProviderDef = {
  id: 'openai',
  label: 'OpenAI gpt-image-1',
  costCents: 17,
  envKey: 'OPENAI_API_KEY',
  async generate({ personBase64, wigBase64, wig, apiKey }) {
    const prompt = buildTryOnPrompt(wig);
    const t0 = performance.now();

    // OpenAI /images/edits exige multipart/form-data avec PNG.
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('image[]', new Blob([Buffer.from(personBase64, 'base64')], { type: 'image/png' }), 'person.png');
    form.append('image[]', new Blob([Buffer.from(wigBase64, 'base64')], { type: 'image/png' }), 'wig.png');
    form.append('size', '1024x1024');
    form.append('quality', 'medium');
    form.append('n', '1');

    const r = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const latencyMs = Math.round(performance.now() - t0);

    if (!r.ok) {
      const errText = await r.text();
      let detail = errText;
      try { detail = JSON.parse(errText)?.error?.message || errText; } catch { /* keep raw */ }
      throw new Error(`OpenAI · ${r.status} · ${detail.slice(0, 280)}`);
    }

    const json = await r.json() as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = json?.data?.[0];
    if (!item?.b64_json) {
      throw new Error(`OpenAI a renvoyé une réponse sans image base64 utilisable.`);
    }

    return { resultBase64: item.b64_json, mimeType: 'image/png', costCents: OpenAI.costCents, latencyMs, raw: json };
  },
};

/**
 * Chaîne de providers — par défaut [Gemini, OpenAI] avec fallback.
 *
 * Désactivation Gemini possible via env var `TRYON_DISABLE_GEMINI=1` (sans
 * commit). Utile quand le quota / facturation Gemini console n'est pas
 * rechargé : on bascule 100% sur OpenAI sans toucher au code.
 */
const PROVIDERS: ProviderDef[] = process.env.TRYON_DISABLE_GEMINI === '1'
  ? [OpenAI]
  : [Gemini, OpenAI];

// ─── Handler ───────────────────────────────────────────

async function loadWigImage(wig: Wig): Promise<{ base64: string; mime: string }> {
  // wig.img = '/images/velours.jpg' → public/images/velours.jpg
  const rel = wig.img.replace(/^\//, '');
  const abs = path.join(process.cwd(), 'public', rel);
  const buf = await readFile(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return { base64: buf.toString('base64'), mime };
}

export async function POST(request: Request) {
  let body: { personBase64?: string; personMime?: string; wigId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide.' }, { status: 400 });
  }

  const { personBase64, personMime, wigId } = body;
  if (!personBase64 || !personMime || !wigId) {
    return NextResponse.json({ error: 'Champs requis : personBase64, personMime, wigId.' }, { status: 400 });
  }

  const wig = WIG_BY_ID[wigId];
  if (!wig) {
    return NextResponse.json({ error: `Perruque inconnue : ${wigId}` }, { status: 404 });
  }

  // ─── Quota check ──────────────────────────────────────
  // Logged : tryon_quotas en DB (lecture + bump après succès)
  // Anon : rate limit sliding window par IP (2 / 24h)
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  let quotaRow: { user_id: string; used_count: number; granted: number } | null = null;

  if (!user) {
    const ip = getRequestIp(request);
    // Nouveaux quotas anon : 1 essai par appareil par 30 jours
    const limit = checkLimit(`tryon:${ip}`, 1, 30 * 24 * 3600_000);
    if (!limit.allowed) {
      const wait = formatResetDuration(limit.resetMs);
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          userMessage: `Tu as utilisé ton essai gratuit par appareil (réessaie dans ${wait}). Crée un compte pour gagner 2 essais Premium en plus.`,
          retryAfterMs: limit.resetMs,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(limit.resetMs / 1000)) },
        },
      );
    }
  }

  if (user) {
    const { data } = await supabase
      .from('tryon_quotas')
      .select('user_id, used_count, granted')
      .eq('user_id', user.id)
      .single();
    quotaRow = data;

    if (quotaRow && quotaRow.used_count >= quotaRow.granted) {
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          userMessage: `Tu as utilisé tes ${quotaRow.granted} essais Premium offerts. Recharge avec tes points Glory Club (100 pts = 1 essai) ou achète un essai à 4,99€.`,
          quota: { used: quotaRow.used_count, granted: quotaRow.granted },
        },
        { status: 402 }, // Payment Required
      );
    }
  }

  let wigImg;
  try {
    wigImg = await loadWigImage(wig);
  } catch (e) {
    return NextResponse.json(
      { error: `Image perruque introuvable côté serveur (${wig.img}). Copier les fichiers dans public/images/.`, detail: String(e) },
      { status: 500 },
    );
  }

  // Build fallback chain : keep only providers with a key configured.
  const chain = PROVIDERS.filter(p => Boolean(process.env[p.envKey]));
  if (chain.length === 0) {
    return NextResponse.json(
      {
        error: 'NO_PROVIDER_CONFIGURED',
        userMessage: 'Le service d\'essai virtuel est temporairement indisponible. Réessaie dans quelques instants.',
      },
      { status: 503 },
    );
  }

  type ErrKind = 'quota' | 'auth' | 'safety' | 'timeout' | 'network' | 'other';
  function classify(msg: string): ErrKind {
    const m = msg.toLowerCase();
    if (/429|quota|rate.?limit|exceeded/.test(m)) return 'quota';
    if (/401|403|unauthor|forbidden|invalid.?api.?key|incorrect.?api.?key/.test(m)) return 'auth';
    if (/safety|policy|content.?filter|moderation|blocked/.test(m)) return 'safety';
    if (/timeout|timed.?out|etimedout/.test(m)) return 'timeout';
    if (/fetch|network|enotfound|econnrefused|econnreset/.test(m)) return 'network';
    return 'other';
  }

  function userMessageFor(kinds: ErrKind[]): string {
    if (kinds.includes('safety')) return 'Cette photo n\'a pas pu être traitée. Essaie avec une autre photo (visage bien visible, fond neutre).';
    if (kinds.every(k => k === 'quota')) return 'Le service est très demandé en ce moment. Réessaie dans quelques minutes.';
    if (kinds.every(k => k === 'auth')) return 'Le service d\'essai virtuel est en maintenance. L\'équipe a été prévenue.';
    if (kinds.every(k => k === 'timeout' || k === 'network')) return 'La connexion au service a échoué. Vérifie ta connexion et réessaie.';
    return 'L\'essai n\'a pas pu être généré pour le moment. Réessaie dans un instant.';
  }

  const attempts: Array<{ provider: string; ok: boolean; latencyMs?: number; error?: string; kind?: ErrKind }> = [];
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i]!; // i < chain.length garantit non-undefined
    const t = performance.now();
    try {
      const r = await p.generate({
        personBase64,
        personMime,
        wigBase64: wigImg.base64,
        wigMime: wigImg.mime,
        wig,
        apiKey: process.env[p.envKey]!,
      });
      attempts.push({ provider: p.id, ok: true, latencyMs: r.latencyMs });

      // Bump quota DB pour user logged + log dans tryon_results
      let newQuota: { used: number; granted: number } | null = null;
      if (user) {
        const usedAfter = (quotaRow?.used_count ?? 0) + 1;
        const granted = quotaRow?.granted ?? 5;
        const upsert = await supabase
          .from('tryon_quotas')
          .upsert({
            user_id: user.id,
            used_count: usedAfter,
            granted,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        if (upsert.error) {
          console.warn('[tryon] upsert quota failed:', upsert.error.message);
        }
        newQuota = { used: usedAfter, granted };
      }

      return NextResponse.json({
        resultBase64: r.resultBase64,
        mimeType: r.mimeType,
        provider: p.id,
        costCents: r.costCents,
        latencyMs: r.latencyMs,
        attempts,
        ...(newQuota && { quota: newQuota }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const kind = classify(msg);
      attempts.push({ provider: p.id, ok: false, latencyMs: Math.round(performance.now() - t), error: msg, kind });
      const next = chain[i + 1];
      if (next) {
        console.warn(`[tryon] ${p.id} failed (${kind}) → fallback ${next.id}. detail=${msg.slice(0, 180)}`);
      } else {
        console.error(`[tryon] all providers failed. last=${p.id} (${kind}). detail=${msg.slice(0, 180)}`);
      }
    }
  }

  const kinds = attempts.filter(a => !a.ok).map(a => a.kind!).filter(Boolean);
  return NextResponse.json(
    {
      error: 'ALL_PROVIDERS_FAILED',
      userMessage: userMessageFor(kinds),
      attempts,
    },
    { status: 502 },
  );
}
