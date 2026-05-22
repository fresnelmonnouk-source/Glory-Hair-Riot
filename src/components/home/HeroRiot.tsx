import Link from 'next/link';
import { CSSProperties } from 'react';

const TAPE_BG: Record<string, string> = {
  washi:  'repeating-linear-gradient(45deg,rgba(212,255,62,.7) 0 8px,rgba(212,255,62,.4) 8px 16px)',
  orange: 'rgba(255,122,26,.6)',
  gold:   'rgba(245,229,94,.55)',
  plain:  'rgba(255,255,255,.18)',
};

const TAPE_BASE: CSSProperties = {
  position: 'absolute',
  width: 120,
  height: 28,
  backdropFilter: 'blur(2px)',
  borderLeft: '1px dashed rgba(255,255,255,.4)',
  borderRight: '1px dashed rgba(255,255,255,.4)',
  boxShadow: '0 2px 6px rgba(0,0,0,.35)',
  pointerEvents: 'none',
  zIndex: 6,
  display: 'block',
};

function Polaroid({ caption, sub, tape, tapePos, img, frameStyle }: {
  caption: string; sub: string;
  tape: keyof typeof TAPE_BG;
  tapePos: CSSProperties;
  img: string;
  frameStyle: CSSProperties;
}) {
  return (
    <div style={{
      position: 'absolute',
      background: '#F4ECD8',
      padding: '14px 14px 50px',
      filter: 'drop-shadow(4px 6px 0 rgba(0,0,0,.5))',
      ...frameStyle,
    }}>
      <span aria-hidden style={{ ...TAPE_BASE, background: TAPE_BG[tape], ...tapePos }} />
      <div style={{ background: '#1a1a1a', aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={caption} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(1.05)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, fontFamily: 'var(--font-permanent-marker),cursive', color: '#0A0A0A', fontSize: 18, lineHeight: 1 }}>
        {caption}
        <small style={{ fontFamily: 'var(--font-special-elite),monospace', display: 'block', fontSize: 11, letterSpacing: '0.06em', marginTop: 4, color: '#5e6a64' }}>{sub}</small>
      </div>
    </div>
  );
}

function StatCard({ value, sup, label, rotate, shadow }: {
  value: string; sup?: string; label: string; rotate: string; shadow: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      padding: '18px 18px 22px', position: 'relative',
      border: '3px solid #0A0A0A',
      transform: `rotate(${rotate})`,
      boxShadow: `4px 4px 0 ${shadow}`,
    }}>
      {/* replaces ::before trapezoid */}
      <span aria-hidden style={{
        position: 'absolute', top: -8, left: '50%',
        transform: 'translateX(-50%)',
        width: 60, height: 8,
        background: '#0E1B14',
        clipPath: 'polygon(0 0,100% 0,90% 100%,10% 100%)',
        display: 'block',
      }} />
      <div style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 48, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}{sup && <sup style={{ fontSize: '0.5em' }}>{sup}</sup>}
      </div>
      <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, letterSpacing: '0.06em', marginTop: 8, color: '#5e6a64' }}>{label}</div>
    </div>
  );
}

const BTN: CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),sans-serif',
  fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
  border: '3px solid #0A0A0A', padding: '16px 26px',
  display: 'inline-flex', alignItems: 'center', gap: 10,
  textDecoration: 'none', cursor: 'pointer',
};

export function HeroRiot() {
  return (
    <section style={{ position: 'relative', padding: '60px 32px 80px', overflow: 'hidden', borderBottom: '3px dashed #D4FF3E' }}>

      {/* Stamp */}
      <div style={{
        position: 'absolute', top: 30, right: 32,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#FF7A1A', border: '2px solid #FF7A1A',
        padding: '8px 16px', transform: 'rotate(8deg)',
        background: 'rgba(14,27,20,.5)', zIndex: 5,
      }}>
        RIOT · N°01
      </div>

      {/* Hero grid — no max-width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 48, alignItems: 'start', position: 'relative' }}>

        {/* Left — text */}
        <div>
          <div style={{
            display: 'inline-block',
            background: '#FF7A1A', color: '#0A0A0A',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '8px 14px', border: '2px solid #0A0A0A',
            transform: 'rotate(-2deg)', marginBottom: 24,
            boxShadow: '3px 3px 0 #D4FF3E',
          }}>
            ★ Été 2026 · Nouvelle collection
          </div>

          <h1 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(96px,14vw,220px)',
            lineHeight: 0.82, letterSpacing: '-0.01em',
            textTransform: 'uppercase', color: '#F4ECD8', position: 'relative',
          }}>
            Votre<br />
            {/* .stk — orange bar via child span (replaces ::after) */}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              beauté,
              <span aria-hidden style={{
                position: 'absolute', left: '-4%', right: '-4%', top: '46%',
                height: 8, background: '#FF7A1A', transform: 'rotate(-2deg)', display: 'block',
              }} />
            </span>
            <br />
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', fontWeight: 400,
              textTransform: 'none', letterSpacing: '-0.02em',
              color: '#F4ECD8', display: 'inline-block',
            }}>
              votre
            </em>
            <br />
            <span style={{
              background: '#D4FF3E', color: '#0A0A0A',
              padding: '0 0.1em', display: 'inline-block',
              transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #FF7A1A',
            }}>
              couronne!
            </span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-special-elite),monospace',
            color: '#F4ECD8', fontSize: 18, lineHeight: 1.5,
            maxWidth: 520, marginTop: 32,
          }}>
            6 perruques en cheveux humains, photographiées, collées, déchirées — et un essayage virtuel{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>photo-réaliste IA</span>.{' '}
            <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,.4)', textDecorationColor: '#FF7A1A', textDecorationThickness: '3px' }}>
              Pas d&apos;overlay 3D bidon.
            </span>{' '}
            <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px' }}>2 essais gratuits</b> par appareil,
            ou <b style={{ background: '#FF7A1A', color: '#0A0A0A', padding: '0 4px' }}>5 essais à l&apos;inscription</b>.
          </p>

          <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/catalogue" style={{ ...BTN, background: '#D4FF3E', color: '#0A0A0A', boxShadow: '6px 6px 0 #FF7A1A' }}>
              → Voir le catalogue
            </Link>
            <Link href="/essayage" style={{ ...BTN, background: '#FF7A1A', color: '#0A0A0A', boxShadow: '6px 6px 0 #D4FF3E' }}>
              ▶ Essayer live
            </Link>
          </div>
        </div>

        {/* Right — photo stack (catalogue réel : LIVE_WIGS) */}
        <div style={{ position: 'relative', height: 640 }}>
          <Polaroid caption="Ginger" sub='N°03 · 18″ · Lace Front' tape="washi" img="/images/ginger.jpg"
            tapePos={{ top: -12, left: 60, transform: 'rotate(4deg)' }}
            frameStyle={{ top: 0, right: 80, width: 260, transform: 'rotate(-5deg)', zIndex: 3 }} />
          <Polaroid caption="Argent" sub='N°05 · 18″ · Full Lace' tape="orange" img="/images/argent.jpg"
            tapePos={{ top: -12, left: 40, transform: 'rotate(-6deg)' }}
            frameStyle={{ top: 120, left: 0, width: 200, transform: 'rotate(6deg)', zIndex: 2 }} />
          <Polaroid caption="Velours" sub='N°01 · 14″ · Closure' tape="gold" img="/images/velours.jpg"
            tapePos={{ top: -12, right: 60, transform: 'rotate(8deg)' }}
            frameStyle={{ bottom: 0, right: 0, width: 220, transform: 'rotate(3deg)', zIndex: 4 }} />
          <Polaroid caption="Bordeaux" sub='N°04 · 22″ · 360 Lace' tape="plain" img="/images/bordeaux.jpg"
            tapePos={{ top: -12, left: 30, transform: 'rotate(-3deg)' }}
            frameStyle={{ bottom: 60, left: 40, width: 160, transform: 'rotate(-8deg)', zIndex: 1 }} />

          {/* Sticker lime */}
          <div style={{
            position: 'absolute', top: -20, right: 240,
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '8px 14px', borderRadius: 999,
            fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 14, letterSpacing: '0.02em',
            transform: 'rotate(-12deg) translateX(-100px)',
            boxShadow: '2px 3px 0 #0A0A0A', border: '2px solid #0A0A0A', zIndex: 7,
          }}>
            ★ Nouveau
          </div>
          {/* Sticker orange */}
          <div style={{
            position: 'absolute', bottom: 180, right: 220,
            background: '#FF7A1A', color: '#0A0A0A',
            padding: '8px 14px', borderRadius: 999,
            fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 14, letterSpacing: '0.02em',
            transform: 'rotate(8deg)',
            boxShadow: '2px 3px 0 #0A0A0A', border: '2px solid #0A0A0A', zIndex: 7,
          }}>
            -20%
          </div>
        </div>
      </div>

      {/* Stats — alignées sur systeme.md + LIVE_WIGS */}
      <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard value="~5s" label="// Latence IA" rotate="-1deg" shadow="#D4FF3E" />
        <StatCard value="2" label="// IA en backup auto" rotate="1.5deg" shadow="#FF7A1A" />
        <StatCard value="48h" label="// Livraison FR" rotate="-1.5deg" shadow="#F5E55E" />
        <StatCard value="6" label="// Pièces Issue N°01" rotate="1deg" shadow="#FF4D8D" />
      </div>
    </section>
  );
}
