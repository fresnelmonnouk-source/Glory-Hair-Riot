import { CSSProperties } from 'react';
import { BtnBold } from '@/components/ui/BtnBold';

const TAPE_BG: Record<string, string> = {
  washi:  'repeating-linear-gradient(45deg, rgba(212,255,62,.7) 0 8px, rgba(212,255,62,.4) 8px 16px)',
  orange: 'rgba(255,122,26,.6)',
  gold:   'rgba(245,229,94,.55)',
  plain:  'rgba(255,255,255,.18)',
};

function PolaroidFrame({
  caption,
  sub,
  tape = 'washi',
  bgColor = '#1a1a1a',
  style,
}: {
  caption: string;
  sub: string;
  tape?: 'washi' | 'orange' | 'gold' | 'plain';
  bgColor?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="absolute bg-paper" style={{ padding: '14px 14px 50px', filter: 'drop-shadow(4px 6px 0 rgba(0,0,0,.5))', ...style }}>
      <div
        aria-hidden
        style={{ position: 'absolute', top: -12, left: 40, width: 120, height: 28, transform: 'rotate(-3deg)', background: TAPE_BG[tape], zIndex: 6 }}
      />
      <div style={{ background: bgColor, aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.15">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>
      <div className="font-marker text-ink" style={{ position: 'absolute', bottom: 10, left: 14, right: 14, fontSize: 18, lineHeight: 1 }}>
        {caption}
        <small className="font-type block" style={{ fontSize: 11, letterSpacing: '0.06em', marginTop: 4, color: '#5e6a64' }}>{sub}</small>
      </div>
    </div>
  );
}

function StatCard({ value, sup, label, rotate = '-1deg', shadow = '#D4FF3E' }: {
  value: string; sup?: string; label: string; rotate?: string; shadow?: string;
}) {
  return (
    <div
      className="bg-paper text-ink border-2 border-ink relative"
      style={{ padding: '18px 18px 22px', transform: `rotate(${rotate})`, boxShadow: `4px 4px 0 ${shadow}` }}
    >
      <div className="font-mono" style={{ fontSize: 48, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}{sup && <sup style={{ fontSize: '0.5em' }}>{sup}</sup>}
      </div>
      <div className="font-type" style={{ fontSize: 12, letterSpacing: '0.06em', marginTop: 8, color: '#5e6a64' }}>{label}</div>
    </div>
  );
}

export function HeroRiot() {
  return (
    <section className="relative overflow-hidden border-b-2 border-dashed border-lime" style={{ padding: '60px 32px 80px' }}>

      {/* Stamp */}
      <div className="absolute font-mono uppercase text-orange border-2 border-orange"
        style={{ top: 30, right: 32, padding: '8px 16px', fontSize: 14, letterSpacing: '0.1em', transform: 'rotate(8deg)', background: 'rgba(14,27,20,.5)', zIndex: 5 }}>
        RIOT · N°01
      </div>

      {/* Hero grid */}
      <div className="max-w-7xl mx-auto relative" style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 48, alignItems: 'start' }}>

        {/* Left — text */}
        <div>
          <div className="inline-block bg-orange text-ink font-mono uppercase border-2 border-ink"
            style={{ padding: '8px 14px', fontSize: 11, letterSpacing: '0.18em', transform: 'rotate(-2deg)', marginBottom: 24, boxShadow: '3px 3px 0 #D4FF3E' }}>
            ★ Été 2026 · Nouvelle collection
          </div>

          <h1 className="font-impact text-paper uppercase"
            style={{ fontSize: 'clamp(96px, 14vw, 220px)', lineHeight: 0.82, letterSpacing: '-0.01em', position: 'relative' }}>
            Votre<br />
            <span style={{ position: 'relative', display: 'inline-block' }}>
              beauté,
              <span style={{ content: '', position: 'absolute', left: '-4%', right: '-4%', top: '46%', height: 8, background: '#FF7A1A', transform: 'rotate(-2deg)' }} />
            </span>
            <br />
            <em style={{ fontFamily: 'var(--font-yeseva-one)', fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: '-0.02em' }}>
              votre
            </em>
            <br />
            <span style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 0.1em', display: 'inline-block', transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #FF7A1A' }}>
              couronne!
            </span>
          </h1>

          <p className="font-type text-paper" style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 520, marginTop: 32 }}>
            32 perruques en cheveux humains, photographiées, collées, déchirées — et un essayage virtuel{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>photo-réaliste IA</span>.{' '}
            <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,.4)', textDecorationColor: '#FF7A1A', textDecorationThickness: '3px' }}>
              Pas de filtre cheap.
            </span>{' '}
            <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px' }}>2 essais gratuits</b> par appareil,
            ou <b style={{ background: '#FF7A1A', color: '#0A0A0A', padding: '0 4px' }}>5 essais à l'inscription</b>.
          </p>

          <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <BtnBold variant="lime" size="lg" href="/catalogue">→ Voir le catalogue</BtnBold>
            <BtnBold variant="orange" size="lg" href="/essayage">▶ Essayer live</BtnBold>
          </div>
        </div>

        {/* Right — photo stack */}
        <div style={{ position: 'relative', height: 640 }}>
          <PolaroidFrame caption="Ginger" sub='22″ · cuivre flame' tape="washi" bgColor="#3d1f0a"
            style={{ top: 0, right: 80, width: 260, transform: 'rotate(-5deg)', zIndex: 3 }} />
          <PolaroidFrame caption="Argent" sub='10″ · pixie' tape="orange" bgColor="#2a2a2a"
            style={{ top: 120, left: 0, width: 200, transform: 'rotate(6deg)', zIndex: 2 }} />
          <PolaroidFrame caption="Buns" sub='20″ · space curls' tape="gold" bgColor="#1a2a2a"
            style={{ bottom: 0, right: 0, width: 220, transform: 'rotate(3deg)', zIndex: 4 }} />
          <PolaroidFrame caption="Bordeaux" sub='18″ · vin' tape="plain" bgColor="#2a0a0a"
            style={{ bottom: 60, left: 40, width: 160, transform: 'rotate(-8deg)', zIndex: 1 }} />

          {/* Stickers */}
          <div className="absolute font-marker text-ink bg-lime border-2 border-ink"
            style={{ top: -20, right: 240, padding: '8px 14px', borderRadius: 999, transform: 'rotate(-12deg) translateX(-100px)', boxShadow: '2px 3px 0 #0A0A0A', zIndex: 7, fontSize: 14 }}>
            ★ Nouveau
          </div>
          <div className="absolute font-marker text-ink bg-orange border-2 border-ink"
            style={{ bottom: 180, right: 220, padding: '8px 14px', borderRadius: 999, transform: 'rotate(8deg)', boxShadow: '2px 3px 0 #0A0A0A', zIndex: 7, fontSize: 14 }}>
            -20%
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto" style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard value="87K" sup="+" label="// Essayages" rotate="-1deg" shadow="#D4FF3E" />
        <StatCard value="4,9★" label="// 12k avis" rotate="1.5deg" shadow="#FF7A1A" />
        <StatCard value="48h" label="// Livraison FR" rotate="-1.5deg" shadow="#F5E55E" />
        <StatCard value="32" label="// Pièces collection" rotate="1deg" shadow="#FF4D8D" />
      </div>
    </section>
  );
}
