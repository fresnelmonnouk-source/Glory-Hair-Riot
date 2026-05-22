'use client';

/**
 * Page Maintenance RIOT — port fidèle <section class="maint"> Riot.html (2909-2929)
 * + CSS 377-444.
 *
 * Page standalone (root level, hors (shop)/layout — pas de Topbar/Nav/Footer).
 * Affichage centré viewport avec countdown live.
 *
 * En prod : activable via feature flag (middleware redirige toutes les routes
 * vers /maintenance quand flag MAINT_MODE=true). À implémenter Phase 5.
 */

import { useEffect, useState } from 'react';

// Date cible : 2h42min18s à partir du chargement (suivant Riot.html demo "02:42:18")
const COUNTDOWN_MS = (2 * 3600 + 42 * 60 + 18) * 1000;

export default function MaintenancePage() {
  const [remaining, setRemaining] = useState(COUNTDOWN_MS);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setRemaining(Math.max(0, COUNTDOWN_MS - elapsed));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: `
        repeating-linear-gradient(45deg, rgba(255,122,26,.05) 0 18px, rgba(255,122,26,.12) 18px 19px),
        #0E1B14
      `,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost text top "MAINT · MAINT · MAINT" */}
      <div aria-hidden style={{
        position: 'absolute', top: '20%', left: -40, right: -40,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 42, color: 'rgba(255,122,26,.06)',
        whiteSpace: 'nowrap', letterSpacing: '0.08em',
        transform: 'rotate(-3deg)',
      }}>
        MAINT · MAINT · MAINT · MAINT · MAINT · MAINT · MAINT · MAINT
      </div>

      {/* Ghost text bottom "BE RIGHT BACK" */}
      <div aria-hidden style={{
        position: 'absolute', bottom: '18%', left: -40, right: -40,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 38, color: 'rgba(212,255,62,.06)',
        whiteSpace: 'nowrap', letterSpacing: '0.08em',
        transform: 'rotate(3deg)',
      }}>
        BE RIGHT BACK · BE RIGHT BACK · BE RIGHT BACK ·
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: '#F4ECD8', color: '#0A0A0A',
        border: '3px solid #0A0A0A',
        padding: '40px 36px',
        maxWidth: 640, width: '100%',
        boxShadow: '10px 10px 0 #FF7A1A',
        transform: 'rotate(-1.5deg)',
      }}>
        {/* Tape orange */}
        <span aria-hidden style={{
          position: 'absolute', top: -16, left: '30%',
          width: 200, height: 32,
          background: 'rgba(255,122,26,.7)',
          borderLeft: '1px dashed rgba(0,0,0,.3)',
          borderRight: '1px dashed rgba(0,0,0,.3)',
          transform: 'rotate(-4deg)',
        }} />

        {/* Stamp "EN MAINTENANCE" */}
        <span style={{
          display: 'inline-block',
          background: '#FF3D00', color: '#F4ECD8',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
          padding: '6px 14px',
          border: '3px solid #0A0A0A',
          transform: 'rotate(-2deg)',
          marginBottom: 18,
        }}>
          ★ EN MAINTENANCE
        </span>

        <h1 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(56px,9vw,128px)',
          lineHeight: 0.85, textTransform: 'uppercase',
          letterSpacing: '-0.01em', color: '#0A0A0A',
        }}>
          On{' '}
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', textTransform: 'none', color: '#FF7A1A',
          }}>
            répare
          </em>
          <br />
          <span style={{
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '0 0.08em', display: 'inline-block',
            transform: 'rotate(-1deg)',
          }}>
            notre
          </span>{' '}
          calotte.
        </h1>

        <p style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 17, lineHeight: 1.5, marginTop: 18, color: '#0A0A0A',
        }}>
          Le site est en pause technique. Nos équipes de Paris 9 travaillent dessus —
          on revient avec une{' '}
          <b style={{ background: '#F5E55E', padding: '0 4px', fontWeight: 400 }}>
            collection rafraîchie
          </b>{' '}
          dans quelques heures.
        </p>

        {/* Countdown */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {[
            { val: pad(h), unit: 'HEURES' },
            { val: pad(m), unit: 'MIN' },
            { val: pad(s), unit: 'SEC' },
          ].map((u) => (
            <div key={u.unit} style={{
              background: '#0A0A0A', color: '#D4FF3E',
              padding: '10px 14px',
              display: 'inline-flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              border: '2px solid #0A0A0A',
              minWidth: 64,
            }}>
              <b style={{
                fontFamily: 'var(--font-anton),Impact,sans-serif',
                fontSize: 32, lineHeight: 1, color: '#D4FF3E',
              }}>
                {u.val}
              </b>
              <span style={{
                fontSize: 10, color: '#F4ECD8', opacity: 0.7,
              }}>
                {u.unit}
              </span>
            </div>
          ))}
        </div>

        {/* Side info */}
        <div style={{
          marginTop: 24, paddingTop: 18,
          borderTop: '3px dashed #0A0A0A',
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 13, lineHeight: 1.5, color: '#0A0A0A',
        }}>
          <b style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            color: '#0A0A0A', fontSize: 16,
            display: 'block', marginBottom: 6, fontWeight: 400,
          }}>
            Une urgence ?
          </b>
          <a href="mailto:hello@maison-glory.fr" style={{
            color: '#0A0A0A',
            textDecoration: 'underline',
            textDecorationColor: '#FF7A1A',
            textDecorationThickness: 2,
          }}>
            hello@maison-glory.fr
          </a>
          {' · WhatsApp '}
          <a href="https://wa.me/33678123456" target="_blank" rel="noopener noreferrer" style={{
            color: '#0A0A0A',
            textDecoration: 'underline',
            textDecorationColor: '#FF7A1A',
            textDecorationThickness: 2,
          }}>
            +33 6 78 12 34 56
          </a>
          <br />
          Atelier Paris 9 ouvert sur RDV.
        </div>
      </div>
    </main>
  );
}
