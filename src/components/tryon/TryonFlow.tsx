'use client';

/* TryonFlow — Essai Live RIOT (Next.js port du sandbox tryon-live.jsx)
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
 */

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
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
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i+1] + data[i+2]) / 3;
    const avg = sum / (SS * SS);
    if (avg < 28) return { ok: false, reason: `Photo trop sombre (luminosité ${avg.toFixed(0)}/255). Trouve plus de lumière.` };
    if (avg > 240) return { ok: false, reason: 'Photo presque blanche — l\'IA aura du mal.' };
    return { ok: true, width: w, height: h, brightness: Math.round(avg) };
  } finally {
    URL.revokeObjectURL(bUrl);
  }
}

// ─── Quotas localStorage (provisoire — Phase 5 → backend) ─

const QUOTA_KEY = 'gh-tryon-quota';
const QUOTA_LIMIT_ANON = 2;
const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

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

const INTRO_PICS: Array<{ wigId: string; pos: CSSProperties; tape: CSSProperties }> = [
  { wigId: 'mocha',    pos: { top: 20,    right: 30, width: 240, transform: 'rotate(-5deg)', zIndex: 3 }, tape: { left: 40, transform: 'rotate(-3deg)' } },
  { wigId: 'ginger',   pos: { top: 160,   left: 20,  width: 200, transform: 'rotate(6deg)',  zIndex: 2 }, tape: { left: 30, transform: 'rotate(4deg)'  } },
  { wigId: 'bordeaux', pos: { bottom: 40, right: 80, width: 210, transform: 'rotate(2deg)',  zIndex: 4 }, tape: { right: 40, transform: 'rotate(6deg)' } },
];

// ─── Flag debug : visible uniquement en dev (npm run dev). En prod = caché. ───────

const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

// ─── Composant principal ──────────────────────────────

type Status = 'idle' | 'generating' | 'done' | 'error';
type LogLevel = 'info' | 'warn' | 'error' | 'success';
interface LogEntry { t: string; msg: string; level: LogLevel }

export function TryonFlow() {
  /* État ----------------------------------------- */
  const [step, setStep] = useState<0|1|2|3>(0);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const [personBlob, setPersonBlob] = useState<Blob | null>(null);
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);

  const [selectedWig, setSelectedWig] = useState<Wig>(WIGS[0]);

  const [status, setStatus] = useState<Status>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string | null>(null);
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
  const startGeneration = useCallback(async () => {
    if (!personBlob || !selectedWig) return;

    if (!consentGiven) {
      setConsentOpen(true);
      return;
    }

    if (quota.count >= QUOTA_LIMIT_ANON) {
      setError(`Quota atteint (${QUOTA_LIMIT_ANON}/${QUOTA_LIMIT_ANON} essais anonymes). Crée un compte pour 5 essais offerts.`);
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
      setLoaderMsg(stages[stageIdx]);
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
      setLoaderMsg('Terminé ✓');

      const totalMs = Math.round(performance.now() - t0);
      log(`✓ Succès · ${(totalMs/1000).toFixed(1)}s`, 'success');

      const dataUrl = `data:${json.mimeType};base64,${json.resultBase64}`;
      setResultUrl(dataUrl);
      setLastProvider(json.provider);
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
    if (step === 0) return '▶ Commencer →';
    if (step === 1) return 'Suivant : perruque →';
    if (step === 2) return '▶ LANCER L\'ESSAI';
    if (status === 'done' || status === 'error') return '↺ Refaire';
    return '…';
  })();

  const canNext = step === 3 ? (status === 'done' || status === 'error') : canNextFromStep(step);

  /* Render --------------------------------------- */
  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', paddingBottom: 90 }}>
      <Marquee />
      <Stepper step={step} sessionCount={sessionCount} totalCostCents={totalCostCents} quota={quota} />

      <main style={{ flex: 1, position: 'relative', padding: '40px 32px', display: 'flex', justifyContent: 'center' }}>
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
          provider={lastProvider}
          onRegenerate={() => void startGeneration()}
          onDownload={handleDownload}
          onRestart={handleRestart}
        />}
      </main>

      {DEBUG_ENABLED && <DebugDrawer open={debugOpen} logs={logs} />}
      <FooterNav
        step={step}
        totalSteps={STEPS.length}
        canNext={canNext}
        onPrev={goPrev}
        onNext={step === 3 ? handleRestart : goNext}
        ctaLabel={ctaLabel}
        debugOpen={DEBUG_ENABLED && debugOpen}
        toggleDebug={() => setDebugOpen(o => !o)}
        showDebug={DEBUG_ENABLED}
      />

      <ConsentModal
        isOpen={consentOpen}
        onAccept={() => { setConsentGiven(true); setConsentOpen(false); setTimeout(() => void startGeneration(), 50); }}
        onDecline={() => { setConsentOpen(false); setStep(0); }}
      />
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────

function Marquee() {
  return (
    <div style={{ background: '#0A0A0A', color: '#D4FF3E', padding: '8px 0', overflow: 'hidden', borderBottom: '3px solid #FF7A1A' }}>
      <div style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap', animation: 'marquee 24s linear infinite', fontFamily: 'var(--font-vt323),monospace', fontSize: 20, letterSpacing: '0.04em', paddingLeft: 32, width: 'max-content' }}>
        <span>★ ESSAI LIVE ★ ESSAI LIVE ★ <em style={{ fontStyle: 'normal', color: '#FF7A1A' }}>2 essais offerts</em> ★ ESSAI LIVE ★ <em style={{ fontStyle: 'normal', color: '#FF7A1A' }}>IA réelle</em> ★ Glory Hair ★ ESSAI LIVE ★</span>
        <span>★ ESSAI LIVE ★ ESSAI LIVE ★ <em style={{ fontStyle: 'normal', color: '#FF7A1A' }}>2 essais offerts</em> ★ ESSAI LIVE ★ <em style={{ fontStyle: 'normal', color: '#FF7A1A' }}>IA réelle</em> ★ Glory Hair ★ ESSAI LIVE ★</span>
      </div>
    </div>
  );
}

function Stepper({ step, sessionCount, totalCostCents, quota }: { step: number; sessionCount: number; totalCostCents: number; quota: QuotaState }) {
  return (
    <header style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 20, padding: '16px 28px', borderBottom: '2px solid #D4FF3E', background: '#0E1B14' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              border: `2px solid ${step === s.id ? '#FF7A1A' : step > s.id ? '#D4FF3E' : '#5E6A64'}`,
              color: step === s.id ? '#FF7A1A' : step > s.id ? '#D4FF3E' : '#5E6A64',
              background: step === s.id ? 'rgba(255,122,26,.1)' : step > s.id ? 'rgba(212,255,62,.06)' : 'transparent',
              transform: step === s.id ? 'rotate(-1deg)' : undefined,
              boxShadow: step === s.id ? '3px 3px 0 #D4FF3E' : undefined,
            }}>
              <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12 }}>{s.num}</span>
              <span>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span style={{ color: '#5E6A64', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 14 }}>→</span>}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill label="quota" value={`${quota.count}/${QUOTA_LIMIT_ANON}`} hot={quota.count >= QUOTA_LIMIT_ANON} />
        <Pill label="essais" value={String(sessionCount)} />
        <Pill label="€" value={(totalCostCents / 100).toFixed(2)} />
      </div>
    </header>
  );
}

function Pill({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <span style={{
      fontFamily: 'var(--font-special-elite),monospace', fontSize: 11,
      padding: '6px 12px', borderRadius: 999,
      border: `2px solid ${hot ? '#FF3D00' : '#F4ECD8'}`,
      color: hot ? '#FF3D00' : '#F4ECD8',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {label} · <b style={{ color: hot ? '#FF3D00' : '#D4FF3E', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12 }}>{value}</b>
    </span>
  );
}

// ─── SCREEN 00 : INTRO ──────────────────────────

function ScreenIntro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ width: '100%', maxWidth: 1320, display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 60, alignItems: 'center', minHeight: 'calc(100vh - 280px)' }}>
      <div>
        <div style={{ display: 'inline-block', background: '#FF7A1A', color: '#0A0A0A', padding: '8px 14px', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', transform: 'rotate(-2deg)', marginBottom: 24, border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #D4FF3E' }}>
          ★ Sandbox · IA réelle · v1.0
        </div>
        <h1 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 'clamp(80px,11vw,180px)', lineHeight: 0.82, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#F4ECD8' }}>
          ESSAI <span style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 0.08em', display: 'inline-block', transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #FF7A1A' }}>LIVE.</span><br />
          <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', fontWeight: 400, textTransform: 'none', color: '#D4FF3E' }}>photo-réaliste,</em><br />
          <span style={{ fontFamily: 'var(--font-permanent-marker),cursive', color: '#FF7A1A', display: 'inline-block', transform: 'rotate(-3deg)', fontSize: '0.7em', textTransform: 'none' }}>pas un filtre cheap.</span>
        </h1>
        <p style={{ marginTop: 28, maxWidth: 520, fontFamily: 'var(--font-special-elite),monospace', fontSize: 17, lineHeight: 1.55, color: '#F4ECD8' }}>
          On envoie ta photo + la perruque à <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>notre IA</span> (Gemini, OpenAI en backup), elle te rend une image <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>photo-réaliste</span> en quelques secondes. Pas <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,.4)', textDecorationColor: '#FF7A1A', textDecorationThickness: '3px' }}>d&apos;overlay 3D bidon</span>, pas de cheveux qui flottent à 10cm de ton crâne.
        </p>

        <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={onStart} style={{
            fontFamily: 'var(--font-rubik-mono-one),sans-serif', fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase',
            background: '#D4FF3E', color: '#0A0A0A', border: '3px solid #0A0A0A',
            padding: '18px 28px', cursor: 'pointer', boxShadow: '5px 5px 0 #FF7A1A',
          }}>
            ▶ C&apos;est parti
          </button>
        </div>

        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <IntroStat value="~5s" label="Latence moyenne" rotate="-1deg" shadow="#D4FF3E" />
          <IntroStat value="2" label="IA en backup auto" rotate="1deg" shadow="#FF7A1A" />
          <IntroStat value="~4¢" label="Coût par essai" rotate="-1.2deg" shadow="#F5E55E" />
        </div>
      </div>

      <div style={{ position: 'relative', height: 540 }}>
        <Sticker style={{ top: -10, left: 60, transform: 'rotate(-12deg)', background: '#FF7A1A' }}>★ TRY ME</Sticker>
        <Sticker style={{ bottom: 160, left: -10, transform: 'rotate(8deg)' }}>No filter ★</Sticker>
        {INTRO_PICS.map((pic, i) => {
          const wig = WIGS.find(w => w.id === pic.wigId)!;
          return (
            <div key={i} style={{ position: 'absolute', background: '#F4ECD8', padding: '12px 12px 44px', filter: 'drop-shadow(4px 6px 0 rgba(0,0,0,.5))', ...pic.pos }}>
              <span aria-hidden style={{ position: 'absolute', top: -12, width: 90, height: 22, background: 'rgba(245,229,94,.7)', borderLeft: '1px dashed rgba(0,0,0,.3)', borderRight: '1px dashed rgba(0,0,0,.3)', ...pic.tape }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wig.img} alt={wig.name} style={{ aspectRatio: '3/4', width: '100%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.05)' }} />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 8, fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 16, color: '#0A0A0A', lineHeight: 1 }}>
                {wig.name.toUpperCase()}
                <small style={{ display: 'block', fontFamily: 'var(--font-special-elite),monospace', fontSize: 10, color: '#5E6A64', marginTop: 3 }}>{wig.cat} · {wig.tone}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sticker({ style, children }: { style: CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', background: '#D4FF3E', color: '#0A0A0A', padding: '10px 16px', borderRadius: 999, fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 16, border: '2px solid #0A0A0A', boxShadow: '2px 3px 0 #0A0A0A', zIndex: 7, ...style }}>
      {children}
    </div>
  );
}

function IntroStat({ value, label, rotate, shadow }: { value: string; label: string; rotate: string; shadow: string }) {
  return (
    <div style={{ background: '#F4ECD8', color: '#0A0A0A', padding: '14px 16px', border: '3px solid #0A0A0A', transform: `rotate(${rotate})`, boxShadow: `4px 4px 0 ${shadow}` }}>
      <div style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, color: '#5E6A64', marginTop: 6, letterSpacing: '0.06em' }}>{label}</div>
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
    <div style={{ width: '100%', maxWidth: 1320 }}>
      <ScreenHead num="01" stk="-o" word="tronche." scrawl="selfie de face, bonne lumière." />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ position: 'relative', background: '#142A1F', border: '3px solid #F4ECD8', aspectRatio: '1/1', overflow: 'hidden', boxShadow: '8px 8px 0 #D4FF3E' }}>
          <CamCorners />
          <Scanlines />

          {mode === 'idle' && !personBlob && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 13, letterSpacing: '0.14em', color: '#FF7A1A', border: '3px solid #FF7A1A', padding: '8px 14px', transform: 'rotate(-3deg)' }}>
                ★ WAITING SIGNAL
              </div>
              <h3 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 'clamp(36px,5vw,60px)', lineHeight: 0.9, textTransform: 'uppercase', color: '#F4ECD8' }}>
                Allume ta <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', textTransform: 'none', color: '#D4FF3E' }}>caméra.</em>
              </h3>
              <p style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 14, color: '#F4ECD8', maxWidth: 380, lineHeight: 1.5 }}>
                Ou balance une photo depuis ton tél.<br />JPEG, PNG · 400×400 minimum.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14, width: '100%', maxWidth: 440 }}>
                <BigChoice onClick={startCamera} icon="▶" name="Caméra" sub="getUserMedia" rotate="-1deg" shadow="#D4FF3E" />
                <BigChoice onClick={() => fileRef.current?.click()} icon="↑" name="Importer" sub="JPEG · PNG" rotate="1deg" shadow="#FF7A1A" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
            </div>
          )}

          {mode === 'camera' && (
            <>
              <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-vt323),monospace', fontSize: 18, color: '#FF7A1A', display: 'flex', gap: 8, alignItems: 'center', zIndex: 3 }}>
                <span style={{ width: 10, height: 10, background: '#FF7A1A', borderRadius: '50%' }} />
                ★ REC · LIVE
              </div>
              <div style={{ position: 'absolute', top: 18, left: 56, fontFamily: 'var(--font-vt323),monospace', fontSize: 16, color: '#D4FF3E', zIndex: 3 }}>FPS {Math.round(fps)}</div>
              <div style={{ position: 'absolute', bottom: 18, right: 56, fontFamily: 'var(--font-vt323),monospace', fontSize: 16, color: '#D4FF3E', zIndex: 3 }}>{timeStr}</div>
              <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, display: 'flex', gap: 10, justifyContent: 'center', zIndex: 4 }}>
                <button type="button" onClick={() => { stopCamera(); setMode('idle'); }} style={btnOutline}>Annuler</button>
                <button type="button" onClick={snap} style={btnOrange}>▶ Capturer</button>
              </div>
            </>
          )}

          {mode === 'preview' && personUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={personUrl} alt="Vous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {validation && (
                <div style={{
                  position: 'absolute', top: 60, left: 20,
                  fontFamily: 'var(--font-vt323),monospace', fontSize: 16,
                  padding: '8px 14px', zIndex: 4,
                  display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content',
                  background: validation.ok ? '#D4FF3E' : '#FF7A1A',
                  color: '#0A0A0A', border: '2px solid #0A0A0A',
                }}>
                  {validation.ok ? `✓ ${validation.width}×${validation.height} · lum ${validation.brightness}/255 · OK` : `✗ ${validation.reason}`}
                </div>
              )}
              <button type="button" onClick={reset} style={{ position: 'absolute', top: 14, right: 14, background: '#0A0A0A', color: '#D4FF3E', border: '2px solid #D4FF3E', padding: '8px 14px', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 10, letterSpacing: '0.1em', zIndex: 5, cursor: 'pointer' }}>↻ Reprendre</button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TipCard title='Pour que' titleEm='ça marche bien' shadow="#FF7A1A" tapeBg="rgba(255,122,26,.7)" items={['Visage de face, regard caméra', 'Lumière douce, pas de contre-jour', 'Cheveux dégagés du visage', 'Cadrage tête + épaules']} />
          <TipCard title='Vie privée ·' titleEm='RGPD' shadow="#D4FF3E" tapeBg="rgba(212,255,62,.7)" items={['Ta photo est envoyée à Gemini ou OpenAI', 'Stockage 30j max, suppression sur demande', 'Pas d\'entraînement modèle (T&C provider)']} rotate=".8deg" />
          <TipCard title='Ce que ça' titleEm='fait' shadow="#F5E55E" tapeBg="rgba(245,229,94,.7)" items={['Capture ou upload', 'Validation locale (résolution, luminosité)', 'Appel IA côté serveur (Gemini → OpenAI)', 'Image résultat + téléchargement']} rotate="-.5deg" />
        </div>
      </div>
    </div>
  );
}

function CamCorners() {
  const cs: CSSProperties = { position: 'absolute', width: 32, height: 32, border: '3px solid #D4FF3E', zIndex: 3 };
  return (
    <>
      <span style={{ ...cs, top: 14, left: 14, borderRight: 0, borderBottom: 0 }} />
      <span style={{ ...cs, top: 14, right: 14, borderLeft: 0, borderBottom: 0 }} />
      <span style={{ ...cs, bottom: 14, left: 14, borderRight: 0, borderTop: 0 }} />
      <span style={{ ...cs, bottom: 14, right: 14, borderLeft: 0, borderTop: 0 }} />
    </>
  );
}

function Scanlines() {
  return <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(212,255,62,.06) 3px 4px)', pointerEvents: 'none' }} />;
}

function BigChoice({ onClick, icon, name, sub, rotate, shadow }: { onClick: () => void; icon: string; name: string; sub: string; rotate: string; shadow: string }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: '#F4ECD8', color: '#0A0A0A', padding: '18px 14px',
      border: '3px solid #0A0A0A', transform: `rotate(${rotate})`,
      boxShadow: `5px 5px 0 ${shadow}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, cursor: 'pointer',
    }}>
      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 32, color: '#FF7A1A', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, color: '#5E6A64', letterSpacing: '0.06em' }}>{sub}</span>
    </button>
  );
}

function TipCard({ title, titleEm, items, shadow, tapeBg, rotate = '-.8deg' }: { title: string; titleEm: string; items: string[]; shadow: string; tapeBg: string; rotate?: string }) {
  return (
    <div style={{ background: '#F4ECD8', color: '#0A0A0A', padding: '18px 20px', border: '3px solid #0A0A0A', transform: `rotate(${rotate})`, boxShadow: `5px 5px 0 ${shadow}`, position: 'relative' }}>
      <span aria-hidden style={{ position: 'absolute', top: -12, left: 24, width: 80, height: 18, background: tapeBg, borderLeft: '1px dashed rgba(0,0,0,.3)', borderRight: '1px dashed rgba(0,0,0,.3)', transform: 'rotate(-3deg)' }} />
      <h4 style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, marginBottom: 6 }}>{title} <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', color: '#FF7A1A' }}>{titleEm}</em></h4>
      <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-special-elite),monospace', fontSize: 13, lineHeight: 1.6 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0' }}>
            <span style={{ color: '#FF7A1A', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 13, flexShrink: 0 }}>→</span>
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
    <div style={{ width: '100%', maxWidth: 1320 }}>
      <ScreenHead num="02" stk="" word="perruque." scrawl={`choisis ta couronne · ${WIGS.length} modèles dispo`} />
      {quota.count >= QUOTA_LIMIT_ANON && (
        <div style={{ background: '#FF3D00', color: '#F4ECD8', padding: '14px 18px', border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A', marginBottom: 24, fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12, letterSpacing: '0.1em' }}>
          ⚠ QUOTA ATTEINT · {quota.count}/{QUOTA_LIMIT_ANON} ESSAIS ANONYMES · CRÉE UN COMPTE POUR 5 ESSAIS OFFERTS
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '32px 24px' }}>
        {WIGS.map((w, i) => {
          const isActive = selectedWig.id === w.id;
          const r = i % 3 === 0 ? '-1.2deg' : i % 3 === 1 ? '1.4deg' : '-1deg';
          const sh = i % 3 === 0 ? '#D4FF3E' : i % 3 === 1 ? '#FF7A1A' : '#FF4D8D';
          return (
            <button key={w.id} type="button" onClick={() => setSelectedWig(w)} style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: '12px 12px 18px',
              transform: isActive ? 'rotate(0) scale(1.03)' : `rotate(${r})`,
              transition: 'transform .25s, box-shadow .25s',
              boxShadow: isActive ? `8px 10px 0 #D4FF3E, 0 0 0 4px #D4FF3E` : `5px 6px 0 ${sh}`,
              cursor: 'pointer', position: 'relative', textAlign: 'left', border: 'none', zIndex: isActive ? 6 : 1,
            }}>
              <span aria-hidden style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: 70, height: 16, background: 'rgba(245,229,94,.7)', borderLeft: '1px dashed rgba(0,0,0,.3)', borderRight: '1px dashed rgba(0,0,0,.3)', zIndex: 2 }} />
              <div style={{ background: '#0A0A0A', aspectRatio: '4/5', position: 'relative', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.img} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(1.05)' }} />
                <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 30, color: '#F4ECD8', textShadow: '2px 2px 0 #0A0A0A', lineHeight: 1 }}>{w.num}</div>
                {w.tag && (
                  <div style={{ position: 'absolute', top: 14, right: 14, background: isActive ? '#D4FF3E' : '#FF7A1A', color: '#0A0A0A', padding: '4px 10px', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 10, letterSpacing: '0.12em', border: '2px solid #0A0A0A', transform: 'rotate(6deg)' }}>{w.tag}</div>
                )}
              </div>
              <div style={{ padding: '12px 4px 0' }}>
                <div style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 22, lineHeight: 1, color: '#0A0A0A' }}>{w.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, color: '#5E6A64' }}>
                  <span>{w.cat} · {w.style} · {w.tone}</span>
                  <span style={{ background: isActive ? '#FF7A1A' : '#D4FF3E', color: '#0A0A0A', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 14, padding: '3px 8px', letterSpacing: '-0.01em', transform: 'rotate(-2deg)' }}>{w.price}€</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN 03 : RESULT ─────────────────────────

function ScreenResult({ status, resultUrl, personUrl, error, selectedWig, progress, loaderMsg, costCents, latencyMs, provider, onRegenerate, onDownload, onRestart }: {
  status: Status; resultUrl: string | null; personUrl: string | null; error: string | null;
  selectedWig: Wig; progress: number; loaderMsg: string;
  costCents: number | null; latencyMs: number | null; provider: string | null;
  onRegenerate: () => void; onDownload: () => void; onRestart: () => void;
}) {
  const [showBefore, setShowBefore] = useState(false);

  return (
    <div style={{ width: '100%', maxWidth: 1320 }}>
      <ScreenHead num="03" stk="" word="résultat." scrawl={
        status === 'generating' ? '★ génération en cours…' :
        status === 'done' ? '★ tiens · maintien clic sur AVANT/APRÈS' :
        status === 'error' ? '✗ raté · réessaie ou recommence' : '★ prêt à lancer…'
      } />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 24, alignItems: 'start' }}>
        <div style={{ position: 'relative', background: '#142A1F', border: '3px solid #F4ECD8', aspectRatio: '1/1', overflow: 'hidden', boxShadow: '8px 8px 0 #D4FF3E' }}>
          <CamCorners />
          <Scanlines />

          {status === 'generating' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,27,20,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40, textAlign: 'center', zIndex: 8 }}>
              <h3 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 48, lineHeight: 0.9, textTransform: 'uppercase', color: '#F4ECD8' }}>
                Génération <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', textTransform: 'none', color: '#D4FF3E' }}>en cours…</em>
              </h3>
              <div style={{ fontFamily: 'var(--font-vt323),monospace', fontSize: 20, color: '#D4FF3E', minHeight: 24 }}>{loaderMsg}</div>
              <div style={{ width: '80%', maxWidth: 320, height: 18, background: 'rgba(255,255,255,.1)', border: '3px solid #F4ECD8', position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', inset: 0, left: 0, width: `${progress}%`, background: '#D4FF3E', transition: 'width .3s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, color: '#5E6A64', letterSpacing: '0.1em' }}>via /api/tryon · Gemini → OpenAI fallback</div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,27,20,.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 40, textAlign: 'center', zIndex: 8 }}>
              <div style={{ background: '#FF3D00', color: '#F4ECD8', padding: '8px 14px', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', border: '3px solid #F4ECD8', transform: 'rotate(-3deg)' }}>✗ ÉCHEC · ERROR</div>
              <h3 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 48, lineHeight: 0.9, textTransform: 'uppercase', color: '#F4ECD8' }}>
                Ça a <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', textTransform: 'none', color: '#FF7A1A' }}>cassé.</em>
              </h3>
              <div style={{ background: '#F4ECD8', color: '#0A0A0A', padding: '14px 18px', fontFamily: 'var(--font-vt323),monospace', fontSize: 14, border: '3px solid #F4ECD8', maxWidth: 420, wordBreak: 'break-word', textAlign: 'left', transform: 'rotate(-1deg)', boxShadow: '4px 4px 0 #FF7A1A' }}>{error}</div>
            </div>
          )}

          {(status === 'done' || status === 'idle') && resultUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={showBefore ? (personUrl ?? '') : resultUrl} alt={showBefore ? 'Avant' : 'Après'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 18, left: 18, background: '#0A0A0A', color: showBefore ? '#FF7A1A' : '#D4FF3E', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11, padding: '6px 12px', letterSpacing: '0.12em', border: `2px solid ${showBefore ? '#FF7A1A' : '#D4FF3E'}`, zIndex: 5 }}>
                {showBefore ? '★ AVANT' : '★ APRÈS · GLORY'}
              </div>
              {costCents != null && (
                <div style={{ position: 'absolute', bottom: 18, right: 18, background: '#FF7A1A', color: '#0A0A0A', fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11, padding: '6px 12px', letterSpacing: '0.06em', border: '2px solid #0A0A0A', transform: 'rotate(-3deg)', zIndex: 5, boxShadow: '3px 3px 0 #0A0A0A' }}>
                  {(costCents/100).toFixed(2)} € · {((latencyMs ?? 0)/1000).toFixed(1)}s
                </div>
              )}
            </>
          )}

          {status === 'idle' && !resultUrl && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,27,20,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 40, zIndex: 8 }}>
              <h3 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 42, textTransform: 'uppercase', color: '#F4ECD8' }}>Prêt à <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', textTransform: 'none', color: '#D4FF3E' }}>lancer.</em></h3>
              <div style={{ fontFamily: 'var(--font-vt323),monospace', fontSize: 18, color: '#D4FF3E' }}>Clique sur ▶ en bas pour démarrer</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F4ECD8', color: '#0A0A0A', padding: 20, border: '3px solid #0A0A0A', transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #D4FF3E', position: 'relative' }}>
            <span aria-hidden style={{ position: 'absolute', top: -12, left: 24, width: 120, height: 22, background: 'rgba(212,255,62,.7)', borderLeft: '1px dashed rgba(0,0,0,.3)', borderRight: '1px dashed rgba(0,0,0,.3)', transform: 'rotate(-3deg)' }} />
            <h4 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 32, lineHeight: 0.9, textTransform: 'uppercase' }}>Tu <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', textTransform: 'none', color: '#FF7A1A' }}>essaies.</em></h4>
            <SummaryRow k="Perruque" v={selectedWig.name} />
            <SummaryRow k="Style" v={`${selectedWig.cat} · ${selectedWig.style} · ${selectedWig.tone}`} />
            <SummaryRow k="Prix" v={`${selectedWig.price} €`} />
            {/* Nom du moteur IA volontairement masqué côté utilisateur (cf. UX décisions session 3) */}
          </div>

          {status === 'done' && resultUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button"
                onMouseDown={() => setShowBefore(true)} onMouseUp={() => setShowBefore(false)} onMouseLeave={() => setShowBefore(false)}
                onTouchStart={() => setShowBefore(true)} onTouchEnd={() => setShowBefore(false)}
                style={{ ...btnLime, width: '100%' }}>★ Maintenir · voir AVANT</button>
              <button type="button" onClick={onDownload} style={{ ...btnOrange, width: '100%' }}>↓ Télécharger</button>
              <button type="button" onClick={onRegenerate} style={{ ...btnOutline, width: '100%' }}>↻ Re-générer</button>
              <button type="button" onClick={onRestart} style={{ ...btnOutline, width: '100%' }}>← Tout recommencer</button>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" onClick={onRegenerate} style={{ ...btnLime, width: '100%' }}>↻ Réessayer</button>
              <button type="button" onClick={onRestart} style={{ ...btnOutline, width: '100%' }}>← Recommencer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, padding: '8px 0', borderBottom: '2px dashed #0A0A0A', fontFamily: 'var(--font-special-elite),monospace', fontSize: 13 }}>
      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 10, letterSpacing: '0.1em', color: '#FF7A1A', textTransform: 'uppercase', paddingTop: 2 }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

// ─── Screen head commun ─────────────────────────

function ScreenHead({ num, stk, word, scrawl }: { num: string; stk: string; word: string; scrawl: string }) {
  const stkBg = stk === '-o' ? '#FF7A1A' : '#D4FF3E';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 18, borderBottom: '3px dashed #D4FF3E', paddingBottom: 24, marginBottom: 32 }}>
      <h2 style={{ fontFamily: 'var(--font-anton),Impact,sans-serif', fontSize: 'clamp(56px,8vw,120px)', lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8', letterSpacing: '-0.01em' }}>
        {num} · TA <span style={{ background: stkBg, color: '#0A0A0A', padding: '0 0.08em', display: 'inline-block', transform: 'rotate(-1deg)' }}>{word}</span>
      </h2>
      <div style={{ fontFamily: 'var(--font-caveat),cursive', fontWeight: 700, color: '#D4FF3E', fontSize: 28, lineHeight: 1.1, transform: 'rotate(-3deg)', maxWidth: 300 }}>
        → {scrawl}
      </div>
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
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#0A0A0A', color: '#F4ECD8', borderTop: '3px solid #D4FF3E', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 50 }}>
      <button type="button" onClick={onPrev} disabled={step === 0} style={footerBtn(step === 0)}>← Précédent</button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-vt323),monospace', fontSize: 16, color: '#D4FF3E' }}>
        <span>STEP {String(step).padStart(2,'0')}/{String(totalSteps-1).padStart(2,'0')}</span>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.1)', border: '2px solid #F4ECD8', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', inset: 0, left: 0, width: `${pct}%`, background: '#D4FF3E', transition: 'width .35s' }} />
        </div>
        <span>{pct}%</span>
      </div>
      {showDebug && (
        <button type="button" onClick={toggleDebug} style={{ fontFamily: 'var(--font-vt323),monospace', fontSize: 16, color: '#D4FF3E', background: 'transparent', border: '2px solid #D4FF3E', padding: '8px 14px', cursor: 'pointer' }}>{debugOpen ? '▼' : '▲'} Debug</button>
      )}
      <button type="button" onClick={onNext} disabled={!canNext} style={{ ...footerBtn(!canNext), background: '#D4FF3E', color: '#0A0A0A', borderColor: '#0A0A0A', boxShadow: '4px 4px 0 #FF7A1A' }}>{ctaLabel}</button>
    </div>
  );
}

function DebugDrawer({ open, logs }: { open: boolean; logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 60,
      background: '#0A0A0A', color: '#F4ECD8',
      borderTop: '3px solid #FF7A1A', zIndex: 40,
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform .3s cubic-bezier(.2,.7,.2,1)',
      maxHeight: '40vh', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 18px', borderBottom: '2px solid #2c2418', fontFamily: 'var(--font-vt323),monospace', fontSize: 14, color: '#D4FF3E' }}>
        &gt; LOGS · {logs.length}
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', fontFamily: 'var(--font-vt323),monospace', fontSize: 14, lineHeight: 1.6, minHeight: 120 }}>
        {logs.length === 0 ? (
          <div style={{ color: '#5E6A64', textAlign: 'center', padding: 30 }}>// no logs yet</div>
        ) : logs.map((l, i) => {
          const color = l.level === 'error' ? '#FF3D00' : l.level === 'warn' ? '#F5E55E' : l.level === 'success' ? '#D4FF3E' : '#F4ECD8';
          return (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#5E6A64', flexShrink: 0 }}>[{l.t}]</span>
              <span style={{ color }}>{l.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Boutons partagés ───────────────────────────

const btnLime: CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),sans-serif', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
  background: '#D4FF3E', color: '#0A0A0A', border: '3px solid #0A0A0A', padding: '14px 22px', cursor: 'pointer',
  boxShadow: '5px 5px 0 #FF7A1A',
};
const btnOrange: CSSProperties = { ...btnLime, background: '#FF7A1A', boxShadow: '5px 5px 0 #D4FF3E' };
const btnOutline: CSSProperties = { ...btnLime, background: 'transparent', color: '#F4ECD8', borderColor: '#F4ECD8', boxShadow: '5px 5px 0 #D4FF3E' };

function footerBtn(disabled: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    padding: '10px 16px',
    background: 'transparent', color: '#F4ECD8',
    border: '2px solid #F4ECD8',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
  };
}
