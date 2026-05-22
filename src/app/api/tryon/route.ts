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

// ─── Prompt (port direct du sandbox) ───────────────────

function buildTryOnPrompt(wig: Wig): string {
  return [
    `TASK — Hair-only swap (surgical inpainting).`,
    `ONLY the hair changes. EVERYTHING else stays pixel-identical to IMAGE 1.`,
    ``,
    `INPUTS:`,
    `- IMAGE 1 = the person. SOURCE OF TRUTH for the face, body, clothing, lighting, background, pose. Treat IMAGE 1 as a locked composite — copy every pixel that is not hair.`,
    `- IMAGE 2 = the reference wig. SOURCE OF TRUTH for the new hair ONLY: color, length, texture, parting, volume, hairline shape.`,
    ``,
    `ABSOLUTE RULE — IDENTITY PRESERVATION (CRITICAL):`,
    `The person in the output MUST be the SAME individual as in IMAGE 1. A close friend should instantly recognize them. The face is NOT to be regenerated — it must be reproduced pixel-perfect from IMAGE 1.`,
    ``,
    `DO NOT alter ANY of the following — they must remain IDENTICAL to IMAGE 1:`,
    `- Face shape, jawline, chin, cheekbones, forehead, temples`,
    `- Eyes: shape, size, color, iris pattern, eyelid shape, eyelashes, eyebrows (shape, thickness, color, position)`,
    `- Nose: shape, size, width, nostrils, bridge`,
    `- Mouth: lip shape, lip color, lip thickness, mouth expression, smile or neutral, teeth`,
    `- Ears (visible parts), earlobes, earrings or piercings`,
    `- Skin: tone, undertone, texture, pores, freckles, moles, scars, birthmarks, blemishes, wrinkles`,
    `- Makeup: keep exactly as is, do not add or remove anything`,
    `- Facial hair if present`,
    `- Age, perceived ethnicity, gender expression`,
    `- Head pose, tilt, rotation, gaze direction`,
    `- Neck, collarbone, shoulders, body`,
    `- Clothing, accessories (glasses, jewelry, necklace)`,
    `- Background, props, scene`,
    `- Lighting direction, shadow placement on the face, white balance, color grading, photographic style`,
    `- Image dimensions, aspect ratio, framing and crop`,
    ``,
    `HAIR REPLACEMENT — what TO change (only this):`,
    `- Replace the hair region of IMAGE 1 with hair matching IMAGE 2.`,
    `- Match IMAGE 2's: color (and color variation), length, texture (${wig.style}), style (${wig.cat}), tone family "${wig.tone}", parting, volume and density.`,
    `- The new hairline must follow the natural curve of the person's forehead and temples from IMAGE 1 — never cover the eyebrows or push the hairline lower than in IMAGE 1.`,
    `- Hair must cast realistic shadows that match the existing lighting direction in IMAGE 1.`,
    `- Edges where hair meets skin must be soft and photographically natural — no halo, no harsh outline, no visible "wig cap" or "lace front" seam.`,
    `- If hair partially covers the face (bangs, side strands), the underlying face pixels must remain unaltered where visible.`,
    ``,
    `QUALITY:`,
    `- Photorealistic editorial photography, same camera and lens characteristics as IMAGE 1.`,
    `- Do NOT smooth, beautify, retouch or de-age the face. Keep skin texture intact.`,
    `- Do NOT shift colors of the rest of the image — only the hair region's color may change.`,
    ``,
    `STRICTLY FORBIDDEN:`,
    `- Regenerating, beautifying, smoothing or "improving" the face in any way.`,
    `- Adding, removing or modifying makeup, freckles, blemishes, expression.`,
    `- Changing the perceived age, ethnicity or identity of the person.`,
    `- Changing pose, expression, gaze, or head angle.`,
    `- Cartoon, illustration, painting, anime or any stylized rendering.`,
    `- Text, watermark, logo, signature, brand name anywhere in the image.`,
    `- Different crop, framing, zoom or aspect ratio than IMAGE 1.`,
    ``,
    `OUTPUT: ONE photorealistic image, same dimensions, same crop, same person as IMAGE 1, with ONLY the hair replaced to match IMAGE 2.`,
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
    const inline = imgPart.inline_data ?? imgPart.inlineData!;
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

const PROVIDERS: ProviderDef[] = [Gemini, OpenAI];

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
      return NextResponse.json({
        resultBase64: r.resultBase64,
        mimeType: r.mimeType,
        provider: p.id,
        costCents: r.costCents,
        latencyMs: r.latencyMs,
        attempts,
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
