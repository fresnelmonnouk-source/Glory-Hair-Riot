'use client';

/* TryonFlow — Essai Live (Next.js port du sandbox tryon-live.jsx)
 *
 * Flow séquentiel 4 étapes :
 *   00 INTRO   → splash + CTA
 *   01 PHOTO   → caméra/upload + validation locale
 *   02 PERRUQUE → grille 6 modèles (LIVE_WIGS via wigs-data.ts)
 *   03 RÉSULTAT → appel /api/tryon (Gemini → OpenAI fallback côté serveur)
 *
 * Sécurité (systeme.md §9) :
 *   - Aucune clé API côté client
 *   - Tout appel IA passe par /api/tryon
 *   - ConsentModal RGPD avant tout envoi
 *
 * Quotas (systeme.md §9.4) :
 *   - 2 essais anon / device / 24h (localStorage, temporaire avant table Supabase)
 *   - À terme : table tryon_quotas + adminProcedure backend
 *
 * Réhabillage visuel dans le langage Sandy Stylish (aucun équivalent chez
 * Sandy — flow caméra + IA propre à GloryHairRiot) : cartes rounded-lg
 * border-hairline bg-app, boutons bg-accent/rounded-sm, eyebrow+display,
 * mêmes proportions de grille que catalogue/panier. Éléments décoratifs
 * punk sans fonction (marquee ticker, coins caméra façon HUD, scanlines,
 * polaroids scotchés, stickers) retirés. Toute la logique (états, hooks,
 * appels API, validation, watermark, quotas, caméra/WebRTC) est strictement
 * inchangée.
 */

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { WIGS, type Wig } from '@/lib/wigs-data';
import { ConsentModal } from './ConsentModal';

// ─── Helpers (port du sandbox tryon-live-providers.jsx) ──

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const s = fr.result as string;
      const comma = s.indexOf(',');
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function resizeBlob(blob: Blob, maxDim = 1024, format: 'image/jpeg' | 'image/png' = 'image/jpeg', quality = 0.92): Promise<Blob> {
  const img = new Image();
  const bUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('load')); img.src = bUrl; });
    let { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.round(w * scale); h = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>(res => canvas.toBlob(b => res(b!), format, quality));
  } finally {
    URL.revokeObjectURL(bUrl);
  }
}

interface Validation { ok: boolean; width?: number; height?: number; brightness?: number; reason?: string }

async function validateSelfieBlob(blob: Blob): Promise<Validation> {
  const img = new Image();
  const bUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('load')); img.src = bUrl; });
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w < 400 || h < 400) return { ok: false, reason: `Photo trop petite (${w}×${h}). Minimum 400×400.` };
    if (Math.max(w, h) / Math.min(w, h) > 3) return { ok: false, reason: 'Format trop déséquilibré, prends une photo en portrait.' };
    const canvas = document.createElement('canvas');
    const SS = 64;
    canvas.width = SS; canvas.height = SS;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, SS, SS);
    const data = ctx.getImageData(0, 0, SS, SS).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += ((data[i] ?? 0) + (data[i+1] ?? 0) + (data[i+2] ?? 0)) / 3;
    const avg = sum / (SS * SS);
    if (avg < 28) return { ok: false, reason: `Photo trop sombre (luminosité ${avg.toFixed(0)}/255). Trouve plus de lumière.` };
    if (avg > 240) return { ok: false, reason: 'Photo presque blanche. L\'IA aura du mal.' };
    return { ok: true, width: w, height: h, brightness: Math.round(avg) };
  } finally {
    URL.revokeObjectURL(bUrl);
  }
}

// ─── Quotas localStorage (provisoire — Phase 5 → backend) ─

const QUOTA_KEY = 'gh-tryon-quota';
const QUOTA_LIMIT_ANON = 1;
const QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/**
 * Watermark "★ GLORY HAIR · ISSUE N°01" baked sur l'image résultat via Canvas.
 * Visible + persisté dans le download. Si le browser ne supporte pas, fallback
 * sur l'image originale.
 */
async function applyWatermark(dataUrl: string): Promise<string> {
  if (typeof window === 'undefined') return dataUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image load failed'));
    i.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // 1. Dessine l'image source
  ctx.drawImage(img, 0, 0);

  // 2. Bandeau noir semi-transparent en bas (60px hauteur dynamique)
  const stripeH = Math.max(48, Math.round(canvas.height * 0.06));
  ctx.fillStyle = 'rgba(10,10,10,0.78)';
  ctx.fillRect(0, canvas.height - stripeH, canvas.width, stripeH);

  // 3. Texte "★ GLORY HAIR · ISSUE N°01" centré dans le bandeau, couleur lime
  ctx.fillStyle = '#ede7d6';
  const fontPx = Math.max(14, Math.round(stripeH * 0.42));
  // Note : la police display (Cormorant Garamond) n'est pas forcément dispo en
  // Canvas (font face non garanti). Fallback sur Georgia/serif.
  ctx.font = `${fontPx}px Georgia, serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const cy = canvas.height - stripeH / 2;
  ctx.fillText('Glory Hair', canvas.width / 2, cy);

  // 4. Petite signature à droite (URL site)
  ctx.fillStyle = '#9C3049';
  ctx.font = `${Math.round(fontPx * 0.5)}px "Courier New", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText('gloryhair.fr', canvas.width - 12, canvas.height - 8);

  // 5. Export en PNG (qualité fixe + watermark visible)
  return canvas.toDataURL('image/png');
}

interface QuotaState { count: number; firstAt: number }

function readQuota(): QuotaState {
  if (typeof window === 'undefined') return { count: 0, firstAt: Date.now() };
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { count: 0, firstAt: Date.now() };
    const s = JSON.parse(raw) as QuotaState;
    if (Date.now() - s.firstAt > QUOTA_WINDOW_MS) return { count: 0, firstAt: Date.now() };
    return s;
  } catch { return { count: 0, firstAt: Date.now() }; }
}

function bumpQuota(): QuotaState {
  const s = readQuota();
  const next: QuotaState = { count: s.count + 1, firstAt: s.firstAt };
  try { localStorage.setItem(QUOTA_KEY, JSON.stringify(next)); } catch { /* noop */ }
  return next;
}

// ─── Données UI ───────────────────────────────────────

const STEPS = [
  { id: 0, num: '00', label: 'Début' },
  { id: 1, num: '01', label: 'Ta tronche' },
  { id: 2, num: '02', label: 'Ta perruque' },
  { id: 3, num: '03', label: 'Le résultat' },
] as const;

// ─── Flag debug : invisible par défaut. Activer via ?debug=1 dans l'URL. ───────

function useDebugEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEnabled(new URLSearchParams(window.location.search).get('debug') === '1');
  }, []);
  return enabled;
}

// ─── Composant principal ──────────────────────────────

type Status = 'idle' | 'generating' | 'done' | 'error';
type LogLevel = 'info' | 'warn' | 'error' | 'success';
interface LogEntry { t: string; msg: string; level: LogLevel }

export function TryonFlow() {
  /* État ----------------------------------------- */
  const debugEnabled = useDebugEnabled();
  const [step, setStep] = useState<0|1|2|3>(0);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const [personBlob, setPersonBlob] = useState<Blob | null>(null);
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);

  const [selectedWig, setSelectedWig] = useState<Wig>(WIGS[0]!);

  const [status, setStatus] = useState<Status>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCostCents, setLastCostCents] = useState<number | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [totalCostCents, setTotalCostCents] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  const [progress, setProgress] = useState(0);
  const [loaderMsg, setLoaderMsg] = useState('Préparation…');

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaState>({ count: 0, firstAt: Date.now() });

  const abortRef = useRef<AbortController | null>(null);

  /* Logger -------------------------------------- */
  const log = useCallback((msg: string, level: LogLevel = 'info') => {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setLogs(L => [...L.slice(-300), { t, msg, level }]);
  }, []);

  /* personBlob → personUrl + validation --------- */
  useEffect(() => {
    if (!personBlob) { setPersonUrl(null); setValidation(null); return; }
    const url = URL.createObjectURL(personBlob);
    setPersonUrl(url);
    validateSelfieBlob(personBlob).then(v => {
      setValidation(v);
      if (v.ok) log(`✓ Photo valide · ${v.width}×${v.height} · lum ${v.brightness}/255`, 'success');
      else log(`✗ Photo invalide · ${v.reason}`, 'warn');
    }).catch(() => setValidation(null));
    return () => URL.revokeObjectURL(url);
  }, [personBlob, log]);

  /* Charge quota au montage --------------------- */
  useEffect(() => { setQuota(readQuota()); }, []);

  /* Validation par étape ------------------------ */
  const canNextFromStep = (s: number): boolean => {
    if (s === 0) return true;
    if (s === 1) return Boolean(personBlob && validation?.ok);
    if (s === 2) return Boolean(selectedWig) && quota.count < QUOTA_LIMIT_ANON;
    return false;
  };

  /* Génération (appel /api/tryon) -------------- */
  const startGeneration = useCallback(async (consentOverride = false) => {
    if (!personBlob || !selectedWig) return;

    if (!consentGiven && !consentOverride) {
      setConsentOpen(true);
      return;
    }

    if (quota.count >= QUOTA_LIMIT_ANON) {
      setError(`Quota atteint (${QUOTA_LIMIT_ANON}/${QUOTA_LIMIT_ANON} essai anonyme). Crée un compte pour +2 essais Premium.`);
      setStatus('error');
      return;
    }

    setStatus('generating');
    setError(null);
    setResultUrl(null);
    setProgress(0);
    setLoaderMsg('Préparation des images…');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const stages = ['Préparation des images…', 'Redimensionnement…', 'Encodage base64…', 'Envoi au serveur Glory Hair…', 'Génération IA…', 'Finalisation…'];
    let stageIdx = 0;
    const timer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setLoaderMsg(stages[stageIdx]!);
      setProgress(p => Math.min(p + Math.random() * 10 + 3, 92));
    }, 900);

    const t0 = performance.now();
    try {
      log(`▶ Préparation perruque=${selectedWig.name}`);
      const resized = await resizeBlob(personBlob, 1024, 'image/jpeg');
      const personBase64 = await blobToBase64(resized);

      log('POST /api/tryon');
      const r = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personBase64,
          personMime: 'image/jpeg',
          wigId: selectedWig.id,
        }),
        signal: ctrl.signal,
      });

      const json = await r.json();

      // Log technique des tentatives serveur (debug drawer uniquement)
      if (Array.isArray(json?.attempts)) {
        for (const a of json.attempts) {
          if (a.ok) {
            log(`✓ ${a.provider} OK · ${a.latencyMs}ms`, 'success');
          } else {
            log(`✗ ${a.provider} a échoué (${a.kind || 'erreur'})${a.error ? ' · ' + String(a.error).slice(0, 160) : ''}`, 'warn');
          }
        }
      }

      if (!r.ok) {
        const friendly = json?.userMessage || 'L\'essai n\'a pas pu être généré pour le moment. Réessaie dans un instant.';
        // pas de throw — on n'expose jamais le message brut au catch
        clearInterval(timer);
        log(`✗ Génération impossible (HTTP ${r.status})`, 'error');
        setError(friendly);
        setStatus('error');
        return;
      }

      clearInterval(timer);
      setProgress(100);
      setLoaderMsg('Terminé');

      const totalMs = Math.round(performance.now() - t0);
      log(`✓ Succès · ${(totalMs/1000).toFixed(1)}s`, 'success');

      const rawDataUrl = `data:${json.mimeType};base64,${json.resultBase64}`;
      // Watermark client-side : ajoute "★ GLORY HAIR · ISSUE N°01" en bas-droite.
      // Le résultat affiché ET téléchargé est watermarked.
      const watermarkedUrl = await applyWatermark(rawDataUrl).catch((e) => {
        log(`⚠ Watermark skip : ${(e as Error).message}`, 'warn');
        return rawDataUrl;
      });
      setResultUrl(watermarkedUrl);
      setLastCostCents(json.costCents);
      setLastLatencyMs(json.latencyMs ?? totalMs);
      setTotalCostCents(c => c + (json.costCents || 0));
      setSessionCount(n => n + 1);
      setQuota(bumpQuota());

      setTimeout(() => setStatus('done'), 250);
    } catch (e) {
      clearInterval(timer);
      const err = e as Error;
      if (err.name === 'AbortError') {
        log('⏹ Annulé', 'warn');
        setStatus('idle');
        return;
      }
      // Erreurs réseau / fetch / JSON parse — message technique uniquement dans le log
      log(`✗ ${err.message}`, 'error');
      setError('La connexion au service a échoué. Vérifie ta connexion et réessaie.');
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [personBlob, selectedWig, consentGiven, quota.count, log]);

  /* Navigation ---------------------------------- */
  const goNext = () => {
    if (step === 2) {
      setStep(3);
      void startGeneration();
    } else if (step < 3) {
      setStep((step + 1) as 0|1|2|3);
    }
  };
  const goPrev = () => {
    if (status === 'generating') abortRef.current?.abort();
    if (step > 0) setStep((step - 1) as 0|1|2|3);
  };
  const handleRestart = () => {
    setStep(0);
    setStatus('idle');
    setResultUrl(null);
    setError(null);
  };

  /* Téléchargement ------------------------------ */
  const handleDownload = async () => {
    if (!resultUrl) return;
    const r = await fetch(resultUrl);
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `glory-hair-tryon-${selectedWig.id}-${Date.now()}.png`;
    a.click();
    log(`💾 Téléchargé : ${a.download}`, 'success');
  };

  /* CTA label par étape ------------------------- */
  const ctaLabel = (() => {
    if (step === 0) return 'Commencer →';
    if (step === 1) return 'Suivant : perruque →';
    if (step === 2) return 'Lancer l\'essai';
    if (status === 'done' || status === 'error') return 'Refaire';
    return '…';
  })();

  const canNext = step === 3 ? (status === 'done' || status === 'error') : canNextFromStep(step);

  /* Render --------------------------------------- */
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col pb-24">
      <Stepper step={step} sessionCount={sessionCount} totalCostCents={totalCostCents} quota={quota} />

      <main className="relative flex flex-1 justify-center px-4 py-10 md:px-8 md:py-14">
        {step === 0 && <ScreenIntro onStart={() => setStep(1)} />}
        {step === 1 && <ScreenPhoto
          personBlob={personBlob}
          personUrl={personUrl}
          setPerson={setPersonBlob}
          validation={validation}
          log={log}
        />}
        {step === 2 && <ScreenWig selectedWig={selectedWig} setSelectedWig={setSelectedWig} quota={quota} />}
        {step === 3 && <ScreenResult
          status={status}
          resultUrl={resultUrl}
          personUrl={personUrl}
          error={error}
          selectedWig={selectedWig}
          progress={progress}
          loaderMsg={loaderMsg}
          costCents={lastCostCents}
          latencyMs={lastLatencyMs}
          onRegenerate={() => void startGeneration()}
          onDownload={handleDownload}
          onRestart={handleRestart}
        />}
      </main>

      {debugEnabled && <DebugDrawer open={debugOpen} logs={logs} />}
      <FooterNav
        step={step}
        totalSteps={STEPS.length}
        canNext={canNext}
        onPrev={goPrev}
        onNext={step === 3 ? handleRestart : goNext}
        ctaLabel={ctaLabel}
        debugOpen={debugEnabled && debugOpen}
        toggleDebug={() => setDebugOpen(o => !o)}
        showDebug={debugEnabled}
      />

      <ConsentModal
        isOpen={consentOpen}
        onAccept={() => { setConsentGiven(true); setConsentOpen(false); setTimeout(() => void startGeneration(true), 50); }}
        onDecline={() => { setConsentOpen(false); setStep(0); }}
      />
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────

function Stepper({ step, sessionCount, totalCostCents, quota }: { step: number; sessionCount: number; totalCostCents: number; quota: QuotaState }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-surface px-4 py-4 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <span key={s.id} className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={{
                borderColor: step === s.id ? 'var(--accent)' : step > s.id ? 'var(--border-accent)' : 'var(--border-hairline)',
                color: step === s.id ? 'var(--accent)' : step > s.id ? 'var(--text-primary)' : 'var(--text-faint)',
                background: step === s.id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
              }}
            >
              <span className="font-display">{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="text-xs text-faint">→</span>}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Pill label="quota" value={`${quota.count}/${QUOTA_LIMIT_ANON}`} hot={quota.count >= QUOTA_LIMIT_ANON} />
        <Pill label="essais" value={String(sessionCount)} />
        <Pill label="coût" value={`${(totalCostCents / 100).toFixed(2)}€`} />
      </div>
    </header>
  );
}

function Pill({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${hot ? 'border-[color:var(--danger)] text-[color:var(--danger)]' : 'border-line text-faint'}`}>
      {label} · <b className="text-ink">{value}</b>
    </span>
  );
}

// ─── SCREEN 00 : INTRO ──────────────────────────

function ScreenIntro({ onStart }: { onStart: () => void }) {
  const heroWigA = WIGS.find((w) => w.id === 'ginger') ?? WIGS[0]!;
  const heroWigB = WIGS.find((w) => w.id === 'bordeaux') ?? WIGS[1] ?? WIGS[0]!;

  return (
    <div className="grid w-full max-w-[1180px] items-center gap-12 md:grid-cols-2">
      <div>
        <p className="eyebrow">Essai live · IA réelle</p>
        <h1 className="display mt-4 text-[clamp(2.25rem,6vw,4rem)] text-ink">
          Photo-réaliste, pas un filtre.
        </h1>
        <p className="mt-6 max-w-[460px] leading-relaxed text-muted">
          On envoie votre photo et la perruque choisie à notre IA (Gemini, OpenAI en
          secours) : elle vous rend une image photo-réaliste en quelques secondes. Pas
          d&apos;overlay 3D approximatif, pas de cheveux qui flottent au-dessus du crâne.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-[2px] bg-accent px-7 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            Commencer <span aria-hidden>→</span>
          </button>
          <Link href="/essayage" className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent">
            Comment ça marche ?
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3">
          <IntroStat value="~5s" label="Latence moyenne" />
          <IntroStat value="2 IA" label="Fallback auto" />
          <IntroStat value="~4¢" label="Coût par essai" />
        </div>
      </div>

      <div aria-hidden className="relative hidden h-[480px] md:block">
        <div className="absolute right-0 top-0 h-[420px] w-[64%] overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroWigA.img} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 h-[260px] w-[42%] overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroWigB.img} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function IntroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-sm border border-hairline bg-app p-4">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-faint">{label}</p>
    </div>
  );
}

// ─── SCREEN 01 : PHOTO ──────────────────────────

function ScreenPhoto({ personBlob, personUrl, setPerson, validation, log }: {
  personBlob: Blob | null;
  personUrl: string | null;
  setPerson: (b: Blob | null) => void;
  validation: Validation | null;
  log: (msg: string, level?: LogLevel) => void;
}) {
  const [mode, setMode] = useState<'idle'|'camera'|'preview'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fps, setFps] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (personBlob && mode !== 'preview') setMode('preview'); }, [personBlob, mode]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  }, [stream]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setMode('camera');
    log('📷 Demande accès caméra…');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 1280 }, facingMode: 'user' }, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      const track = s.getVideoTracks()[0];
      if (!track) throw new Error('Aucune piste vidéo disponible.');
      const settings = track.getSettings();
      setFps(settings.frameRate ?? 30);
      log(`📷 Caméra OK · ${settings.width}×${settings.height} @ ${Math.round(settings.frameRate ?? 30)}fps`);
    } catch (e) {
      const err = e as Error;
      log(`✗ Caméra refusée : ${err.message}`, 'error');
      setMode('idle');
      alert(`Caméra inaccessible : ${err.message}`);
    }
  };

  const snap = async () => {
    const v = videoRef.current; if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0);
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92));
    stopCamera();
    setPerson(blob);
    setMode('preview');
    log(`📸 Capture · ${v.videoWidth}×${v.videoHeight} · ${(blob.size/1024).toFixed(0)} KB`);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Choisis une image.'); return; }
    setPerson(f);
    setMode('preview');
    log(`🖼️ Upload · ${f.name} · ${(f.size/1024).toFixed(0)} KB`);
  };

  const reset = () => { stopCamera(); setPerson(null); setMode('idle'); };

  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  return (
    <div className="w-full max-w-[1180px]">
      <ScreenHead eyebrow="Étape 01" title="Votre photo" subtitle="Selfie de face, bonne lumière." />

      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline bg-surface sm:aspect-square">
          {mode === 'idle' && !personBlob && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
              <p className="eyebrow">En attente</p>
              <h3 className="display text-2xl text-ink md:text-3xl">Allumez votre caméra.</h3>
              <p className="max-w-[360px] text-sm leading-relaxed text-muted">
                Ou envoyez une photo depuis votre téléphone.<br />JPEG, PNG · 400×400 minimum.
              </p>
              <div className="mt-2 grid w-full max-w-[420px] grid-cols-2 gap-3">
                <button type="button" onClick={startCamera} className="rounded-lg border border-hairline bg-app px-4 py-5 text-center transition-colors hover:border-[color:var(--border-accent)]">
                  <span className="block font-display text-lg text-ink">Caméra</span>
                  <span className="mt-1 block text-xs text-faint">Accès direct</span>
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-hairline bg-app px-4 py-5 text-center transition-colors hover:border-[color:var(--border-accent)]">
                  <span className="block font-display text-lg text-ink">Importer</span>
                  <span className="mt-1 block text-xs text-faint">JPEG · PNG</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
            </div>
          )}

          {mode === 'camera' && (
            <>
              <div className="absolute left-4 top-4 z-[3] rounded-full bg-black/60 px-2.5 py-1 text-xs text-ink">{Math.round(fps)} fps</div>
              <div className="absolute left-1/2 top-4 z-[3] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-[color:var(--danger)]">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[color:var(--danger)]" />
                REC · live
              </div>
              <div className="absolute bottom-4 right-4 z-[3] rounded-full bg-black/60 px-2.5 py-1 text-xs text-ink">{timeStr}</div>
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute inset-x-0 bottom-6 z-[4] flex justify-center gap-3">
                <button type="button" onClick={() => { stopCamera(); setMode('idle'); }} className="rounded-sm border border-line bg-black/40 px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">Annuler</button>
                <button type="button" onClick={snap} className="rounded-sm bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">Capturer</button>
              </div>
            </>
          )}

          {mode === 'preview' && personUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={personUrl} alt="Vous" className="h-full w-full object-cover" />
              {validation && (
                <div className={`absolute left-4 top-4 z-[4] rounded-full bg-black/70 px-3 py-1.5 text-xs ${validation.ok ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                  {validation.ok ? `${validation.width}×${validation.height} · lum ${validation.brightness}/255 · OK` : validation.reason}
                </div>
              )}
              <button type="button" onClick={reset} className="absolute right-4 top-4 z-[5] rounded-full border border-line bg-black/60 px-3 py-1.5 text-xs text-ink transition-colors hover:border-[color:var(--border-accent)]">
                ↻ Reprendre
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <TipCard title="Pour que ça marche bien" items={['Visage de face, regard caméra', 'Lumière douce, pas de contre-jour', 'Cheveux dégagés du visage', 'Cadrage tête + épaules']} />
          <TipCard title="Vie privée · RGPD" items={['Votre photo est envoyée à Gemini ou OpenAI', 'Stockage 30 jours max, suppression sur demande', "Pas d'entraînement modèle (T&C provider)"]} />
          <TipCard title="Ce que ça fait" items={['Capture ou import', 'Validation locale (résolution, luminosité)', 'Appel IA côté serveur (Gemini → OpenAI)', 'Image résultat + téléchargement']} />
        </div>
      </div>
    </div>
  );
}

function TipCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-hairline bg-app p-6">
      <p className="eyebrow">{title}</p>
      <ul className="mt-4 space-y-2.5 p-0 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-muted">
            <span aria-hidden className="mt-0.5 shrink-0 text-accent">→</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── SCREEN 02 : WIG ────────────────────────────

function ScreenWig({ selectedWig, setSelectedWig, quota }: { selectedWig: Wig; setSelectedWig: (w: Wig) => void; quota: QuotaState }) {
  return (
    <div className="w-full max-w-[1180px]">
      <ScreenHead eyebrow="Étape 02" title="Votre perruque" subtitle={`${WIGS.length} modèles disponibles`} />

      {quota.count >= QUOTA_LIMIT_ANON && (
        <div className="mb-8 rounded-sm border border-[color:var(--danger)] bg-app px-5 py-3.5 text-sm text-[color:var(--danger)]">
          Quota atteint · {quota.count}/{QUOTA_LIMIT_ANON} essai anonyme : créez un compte pour 2 essais Premium offerts.
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3" role="radiogroup">
        {WIGS.map((w) => {
          const isActive = selectedWig.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelectedWig(w)}
              className="group block text-left"
            >
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-sm border-2 bg-surface transition-colors"
                style={{ borderColor: isActive ? 'var(--accent)' : 'transparent' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.img} alt={w.name} className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]" loading="lazy" />
                {w.tag && (
                  <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] uppercase tracking-wide text-on-accent">{w.tag}</span>
                )}
                {isActive && (
                  <span aria-hidden className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg text-ink">{w.name}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-faint">{w.cat} · {w.style} · {w.tone}</p>
              <p className="mt-1.5 text-sm text-accent">{w.price}€</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN 03 : RESULT ─────────────────────────

function ScreenResult({ status, resultUrl, personUrl, error, selectedWig, progress, loaderMsg, costCents, latencyMs, onRegenerate, onDownload, onRestart }: {
  status: Status; resultUrl: string | null; personUrl: string | null; error: string | null;
  selectedWig: Wig; progress: number; loaderMsg: string;
  costCents: number | null; latencyMs: number | null;
  onRegenerate: () => void; onDownload: () => void; onRestart: () => void;
}) {
  const [showBefore, setShowBefore] = useState(false);

  const subtitle =
    status === 'generating' ? 'Génération en cours…' :
    status === 'done' ? 'Maintenez le clic pour voir avant/après' :
    status === 'error' ? 'Une erreur est survenue' : 'Prêt à lancer';

  return (
    <div className="w-full max-w-[1180px]">
      <ScreenHead eyebrow="Étape 03" title="Le résultat" subtitle={subtitle} />

      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-hairline bg-surface sm:aspect-square">
          {status === 'generating' && (
            <div className="absolute inset-0 z-[8] flex flex-col items-center justify-center gap-5 bg-surface/95 p-8 text-center">
              <h3 className="display text-2xl text-ink md:text-3xl">Génération en cours…</h3>
              <p className="text-sm text-faint">{loaderMsg}</p>
              <div className="h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-app">
                <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-faint">via /api/tryon · Gemini → OpenAI en secours</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 z-[8] flex flex-col items-center justify-center gap-4 bg-surface/95 p-8 text-center">
              <span className="rounded-full border border-[color:var(--danger)] px-3 py-1 text-xs uppercase tracking-wide text-[color:var(--danger)]">Échec</span>
              <h3 className="display text-2xl text-ink md:text-3xl">Ça n&apos;a pas fonctionné.</h3>
              <p className="max-w-[360px] rounded-sm border border-hairline bg-app px-4 py-3 text-sm text-muted">{error}</p>
            </div>
          )}

          {(status === 'done' || status === 'idle') && resultUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={showBefore ? (personUrl ?? '') : resultUrl} alt={showBefore ? 'Avant' : 'Après'} className="h-full w-full object-cover" />
              <div className="absolute left-4 top-4 z-[5] rounded-full bg-black/70 px-3 py-1.5 text-xs text-ink">
                {showBefore ? 'Avant' : 'Après · Glory Hair'}
              </div>
              {costCents != null && (
                <div className="absolute bottom-4 right-4 z-[5] rounded-full bg-black/70 px-3 py-1.5 text-xs text-faint">
                  {(costCents/100).toFixed(2)}€ · {((latencyMs ?? 0)/1000).toFixed(1)}s
                </div>
              )}
            </>
          )}

          {status === 'idle' && !resultUrl && (
            <div className="absolute inset-0 z-[8] flex flex-col items-center justify-center gap-3 p-8 text-center">
              <h3 className="display text-2xl text-ink md:text-3xl">Prêt à lancer.</h3>
              <p className="text-sm text-faint">Cliquez sur « Lancer l&apos;essai » en bas</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-hairline bg-app p-6">
            <p className="eyebrow">Vous essayez</p>
            <div className="mt-3 divide-y divide-hairline text-sm">
              <SummaryRow k="Perruque" v={selectedWig.name} />
              <SummaryRow k="Style" v={`${selectedWig.cat} · ${selectedWig.style} · ${selectedWig.tone}`} />
              <SummaryRow k="Prix" v={`${selectedWig.price}€`} />
            </div>
          </div>

          {status === 'done' && resultUrl && (
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onMouseDown={() => setShowBefore(true)} onMouseUp={() => setShowBefore(false)} onMouseLeave={() => setShowBefore(false)}
                onTouchStart={() => setShowBefore(true)} onTouchEnd={() => setShowBefore(false)}
                className="w-full rounded-sm border border-line px-5 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]"
              >
                Maintenir · voir avant
              </button>
              <button type="button" onClick={onDownload} className="w-full rounded-sm bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
                Télécharger
              </button>
              <button type="button" onClick={onRegenerate} className="w-full rounded-sm border border-line px-5 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
                Re-générer
              </button>
              <button type="button" onClick={onRestart} className="w-full rounded-sm border border-line px-5 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
                Tout recommencer
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-2.5">
              <button type="button" onClick={onRegenerate} className="w-full rounded-sm bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
                Réessayer
              </button>
              <button type="button" onClick={onRestart} className="w-full rounded-sm border border-line px-5 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
                Recommencer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs uppercase tracking-wide text-faint">{k}</span>
      <span className="text-ink">{v}</span>
    </div>
  );
}

// ─── Screen head commun ─────────────────────────

function ScreenHead({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-2 text-3xl text-ink md:text-4xl">{title}</h2>
      </div>
      <p className="text-sm text-faint">{subtitle}</p>
    </div>
  );
}

// ─── Footer nav (prev / next / debug) ───────────

function FooterNav({ step, totalSteps, canNext, onPrev, onNext, ctaLabel, debugOpen, toggleDebug, showDebug }: {
  step: number; totalSteps: number; canNext: boolean;
  onPrev: () => void; onNext: () => void; ctaLabel: string;
  debugOpen: boolean; toggleDebug: () => void; showDebug: boolean;
}) {
  const pct = Math.round((step / (totalSteps - 1)) * 100);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface/95 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3">
        <button type="button" onClick={onPrev} disabled={step === 0} className="shrink-0 rounded-sm border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-40">
          ← Précédent
        </button>

        <div className="flex min-w-[120px] flex-1 items-center gap-3 text-xs text-faint">
          <span className="shrink-0 tabular-nums">Étape {step}/{totalSteps - 1}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-app">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {showDebug && (
          <button type="button" onClick={toggleDebug} className="shrink-0 rounded-sm border border-line px-3 py-2.5 text-xs text-ink transition-colors hover:border-[color:var(--border-accent)]">
            {debugOpen ? '▼' : '▲'} Debug
          </button>
        )}

        <button type="button" onClick={onNext} disabled={!canNext} className="shrink-0 rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-40">
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function DebugDrawer({ open, logs }: { open: boolean; logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div
      className="fixed inset-x-0 bottom-[60px] z-40 flex max-h-[40vh] flex-col border-t border-hairline bg-surface transition-transform"
      style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="border-b border-hairline px-5 py-2.5 text-xs text-faint">Logs · {logs.length}</div>
      <div ref={ref} className="min-h-[120px] flex-1 overflow-y-auto px-5 py-3.5 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-faint">// aucun log</div>
        ) : logs.map((l, i) => {
          const color = l.level === 'error' ? 'var(--danger)' : l.level === 'warn' ? 'var(--warning)' : l.level === 'success' ? 'var(--success)' : 'var(--text-primary)';
          return (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-faint">[{l.t}]</span>
              <span style={{ color }}>{l.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
