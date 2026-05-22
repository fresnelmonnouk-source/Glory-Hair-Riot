import Link from 'next/link';
import { CSSProperties } from 'react';

const BTN: CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),sans-serif',
  fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
  border: '3px solid #0A0A0A', padding: '16px 26px',
  display: 'inline-flex', alignItems: 'center', gap: 10,
  textDecoration: 'none', cursor: 'pointer',
};

export function Manifeste() {
  return (
    <section style={{ padding: '80px 32px', borderBottom: '3px solid #FF7A1A', overflow: 'hidden', position: 'relative' }}>

      {/* Ghost background text */}
      <div aria-hidden style={{
        position: 'absolute', top: 32, left: -40, right: -40,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 42, color: 'rgba(212,255,62,0.04)',
        whiteSpace: 'nowrap', letterSpacing: '0.08em',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        GLORY GLORY GLORY GLORY GLORY GLORY GLORY
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 60, alignItems: 'center', position: 'relative' }}>

        {/* Left — visual collage */}
        <div style={{ position: 'relative', height: 520 }}>

          {/* mi-1: yellow quote card */}
          <div style={{
            position: 'absolute', top: 0, left: 20, width: 240,
            background: '#F5E55E', color: '#0A0A0A',
            padding: 18, transform: 'rotate(-6deg)',
            boxShadow: '5px 5px 0 #0A0A0A',
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 24, lineHeight: 1.1, zIndex: 3,
          }}>
            « Pas une perruque,{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              une attitude.
              <span aria-hidden style={{
                position: 'absolute', left: '-2%', right: '-2%', top: '46%',
                height: 4, background: '#FF7A1A', transform: 'rotate(-1deg)', display: 'block',
              }} />
            </span>
            {' '}»
            <span aria-hidden style={{ display: 'block', background: '#FF7A1A', height: 4, margin: '8px 0 12px', transform: 'rotate(-1deg)' }} />
            <small style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, letterSpacing: '0.06em', color: '#5e6a64', display: 'block' }}>
              — Édito #01
            </small>
          </div>

          {/* mi-2: polaroid */}
          <div style={{
            position: 'absolute', top: 120, right: 0, width: 300,
            background: '#F4ECD8', padding: '14px 14px 50px',
            transform: 'rotate(4deg)', boxShadow: '5px 5px 0 #FF7A1A', zIndex: 2,
          }}>
            <div style={{ background: '#1a1a1a', aspectRatio: '3/4', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.15">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, fontFamily: 'var(--font-permanent-marker),cursive', color: '#0A0A0A', fontSize: 16, lineHeight: 1 }}>
              Couv. N°01
            </div>
          </div>

          {/* mi-3: lime IA card */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: 220,
            background: '#D4FF3E', color: '#0A0A0A',
            padding: 18, transform: 'rotate(-3deg)',
            border: '3px dashed #0A0A0A',
            fontFamily: 'var(--font-vt323),monospace', fontSize: 22, zIndex: 4,
          }}>
            IA · GEMINI<br />
            + OPENAI BACKUP<br />
            ~5s · PHOTO-RÉEL
            <span style={{ display: 'block', fontSize: 28, marginTop: 4 }}>↗</span>
          </div>

          {/* Sticker */}
          <div style={{
            position: 'absolute', top: -15, right: '20%',
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '8px 14px', borderRadius: 999,
            fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 12,
            border: '2px solid #0A0A0A', transform: 'rotate(-18deg)',
            boxShadow: '2px 3px 0 #0A0A0A', zIndex: 7,
          }}>
            ★ PUNK SINCE 2024
          </div>
        </div>

        {/* Right — text */}
        <div>
          <div style={{
            display: 'inline-block',
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '8px 12px', transform: 'rotate(-2deg)', marginBottom: 20,
          }}>
            ★ Édito #01 — la maison
          </div>

          <h2 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(56px,8vw,120px)',
            lineHeight: 0.85, textTransform: 'uppercase',
            color: '#F4ECD8', marginBottom: 32,
          }}>
            Une{' '}
            <span style={{
              fontFamily: 'var(--font-permanent-marker),cursive',
              color: '#D4FF3E', textTransform: 'none',
              fontSize: '0.85em', display: 'inline-block',
              transform: 'rotate(-2deg)',
            }}>
              couronne
            </span>
            <br />
            <span style={{ position: 'relative', display: 'inline-block' }}>
              pour chaque
              <span aria-hidden style={{
                position: 'absolute', left: '-2%', right: '-2%', top: '46%',
                height: 8, background: '#FF7A1A', transform: 'rotate(-1deg)', display: 'block',
              }} />
            </span>
            <br />
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', fontWeight: 400,
              textTransform: 'none', letterSpacing: '-0.02em', color: '#F4ECD8',
            }}>
              visage.
            </em>
          </h2>

          <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: 'rgba(244,236,216,.8)', fontSize: 16, lineHeight: 1.6, maxWidth: 520, marginBottom: 20 }}>
            Glory Hair{' '}
            <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', color: '#FF7A1A' }}>by RHD Empire</em>,
            c&apos;est{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>6 perruques</span>{' '}
            tirées brin par brin dans notre atelier Paris 9. Pas de stock anonyme, pas de fibres synthétiques. Cheveux humains Remy, calottes respirantes, lace front HD.
          </p>

          <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: 'rgba(244,236,216,.8)', fontSize: 16, lineHeight: 1.6, maxWidth: 520, marginBottom: 32 }}>
            Et un essayage virtuel qui marche pour de vrai :{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>IA générative image-to-image</span> (Gemini + OpenAI en backup), rendu photo-réaliste en{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>~5 secondes</span>.{' '}
            <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px' }}>2 essais offerts</b>{' '}
            sans création de compte, ou{' '}
            <b style={{ background: '#FF7A1A', color: '#0A0A0A', padding: '0 4px' }}>5 essais</b>{' '}
            à l&apos;inscription. Vous testez avant d&apos;acheter — la moindre des choses.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/catalogue" style={{ ...BTN, background: '#D4FF3E', color: '#0A0A0A', boxShadow: '6px 6px 0 #FF7A1A' }}>
              → Voir le catalogue
            </Link>
            <Link href="/magazine" style={{ ...BTN, background: 'transparent', color: '#F4ECD8', borderColor: '#F4ECD8' }}>
              Lire le mag
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
