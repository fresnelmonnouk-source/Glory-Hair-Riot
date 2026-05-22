/**
 * FooterRiot — port fidèle de <footer class="foot-z"> dans Riot.html (lignes 3025-3082).
 *
 * Structure :
 * 1. Bandeau géant "GLORY HAIR!" (Anton 17vw)
 * 2. Mention "— by RHD Empire —" (Permanent Marker)
 * 3. Grille : Newsletter (1.5fr) + Boutique + Service + Maison (1fr chaque)
 * 4. Colophon : copyright + ISSUE N°01 + langues
 */

'use client';

import Link from 'next/link';
import { CSSProperties, FormEvent, useState } from 'react';

const COLS: { title: string; links: Array<{ href: string; label: string; star?: boolean }> }[] = [
  {
    title: 'Boutique',
    links: [
      { href: '/catalogue', label: 'Toutes les pièces', star: true },
      { href: '/catalogue?filtre=nouveautes', label: 'Nouveautés' },
      { href: '/catalogue?filtre=best', label: 'Best-sellers' },
      { href: '/catalogue?filtre=limitees', label: 'Limitées' },
      { href: '/sav/cartes-cadeau', label: 'Cartes cadeau' },
    ],
  },
  {
    title: 'Service',
    links: [
      { href: '/essayage', label: 'Essayage virtuel' },
      { href: '/elodie', label: 'Conseil Élodie' },
      { href: '/sav/livraison', label: 'Livraison 48h' },
      { href: '/sav/retours', label: 'Retours 30j' },
      { href: '/sav/garantie', label: 'Garantie 12 mois' },
    ],
  },
  {
    title: 'Maison',
    links: [
      { href: '/sav/atelier', label: 'Atelier Paris 9' },
      { href: '/maison', label: 'Notre histoire' },
      { href: '/magazine', label: 'Magazine' },
      { href: '/sav/presse', label: 'Presse' },
      { href: '/sav/contact', label: 'Contact' },
      { href: '/admin', label: 'Admin (équipe)', star: true },
    ],
  },
];

const LANGUES = 'FR · EN · ES · IT';

export function FooterRiot() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    // TODO Phase 5 : POST /api/newsletter avec Resend
  }

  return (
    <footer
      style={{
        background: '#0A0A0A',
        color: '#F4ECD8',
        padding: '64px 32px 24px',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '3px solid #D4FF3E',
      }}
    >
      {/* Big GLORY HAIR! type */}
      <div
        style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(120px,17vw,300px)',
          lineHeight: 0.85,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          color: '#F4ECD8',
        }}
      >
        GLORY{' '}
        <span style={{
          fontFamily: 'var(--font-yeseva-one),serif',
          fontStyle: 'italic',
          fontWeight: 400,
          textTransform: 'none',
          color: '#FF7A1A',
        }}>
          HAIR
        </span>
        <span style={{
          background: '#FF7A1A',
          color: '#0A0A0A',
          padding: '0 0.05em',
          display: 'inline-block',
          transform: 'rotate(-1deg)',
        }}>
          !
        </span>
      </div>

      {/* by RHD Empire */}
      <div
        style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 'clamp(20px,2.4vw,32px)',
          letterSpacing: '0.04em',
          color: '#D4FF3E',
          marginTop: 14,
          transform: 'rotate(-1deg)',
          display: 'inline-block',
        }}
      >
        — by{' '}
        <em style={{
          fontFamily: 'var(--font-yeseva-one),serif',
          fontStyle: 'italic',
          color: '#FF7A1A',
          fontSize: '1.15em',
          letterSpacing: '0.02em',
        }}>
          RHD
        </em>{' '}
        Empire —
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: 40,
          marginTop: 48,
          paddingTop: 28,
          borderTop: '3px dashed rgba(212,255,62,.3)',
        }}
      >
        {/* Newsletter */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 16, lineHeight: 1.45, marginBottom: 14, maxWidth: 380,
            }}
          >
            Recevez l&apos;
            <b style={{
              background: '#D4FF3E', color: '#0A0A0A',
              padding: '0 4px', fontWeight: 400,
            }}>
              Issue 02
            </b>
            {' '}— Automne 2026, en avant-première.
            <br />Un mail par mois. Promis.
          </div>

          {submitted ? (
            <div
              style={{
                background: '#D4FF3E', color: '#0A0A0A',
                padding: '14px 18px', border: '3px solid #0A0A0A',
                fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18,
                transform: 'rotate(-1deg)', display: 'inline-block',
              }}
            >
              ★ Inscrit·e ! Issue 02 arrive bientôt.
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              style={{ display: 'flex', border: '3px solid #D4FF3E', maxWidth: 420 }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@adresse.email"
                required
                aria-label="Adresse email"
                style={{
                  flex: 1, background: 'transparent', border: 0,
                  padding: '12px 16px', color: '#F4ECD8',
                  fontFamily: 'var(--font-special-elite),monospace', fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#D4FF3E', color: '#0A0A0A',
                  padding: '12px 18px', border: 0,
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                S&apos;INSCRIRE
              </button>
            </form>
          )}
        </div>

        {/* 3 link columns */}
        {COLS.map((col) => (
          <div key={col.title}>
            <h4
              style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                color: '#D4FF3E', fontSize: 22, marginBottom: 14,
                transform: 'rotate(-2deg)', display: 'inline-block',
              }}
            >
              {col.title}
            </h4>
            <ul
              style={{
                listStyle: 'none', display: 'flex', flexDirection: 'column',
                gap: 6, fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 14, margin: 0, padding: 0,
              }}
            >
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    style={{
                      color: '#F4ECD8', textDecoration: 'none',
                      transition: 'color .15s', display: 'inline-block',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#FF7A1A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#F4ECD8'; }}
                  >
                    {link.star && '★ '}{link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Colophon */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
          marginTop: 36, paddingTop: 24,
          borderTop: '3px dashed rgba(255,255,255,.2)',
          fontFamily: 'var(--font-vt323),monospace',
          fontSize: 18, color: 'rgba(255,255,255,.6)',
          letterSpacing: '0.04em',
        }}
      >
        <span>
          ★{' '}
          <em style={{ fontStyle: 'normal', color: '#D4FF3E' }}>GLORY HAIR</em>
          {' '}· by{' '}
          <em style={{ fontStyle: 'normal', color: '#D4FF3E' }}>RHD EMPIRE</em>
          {' '}· PARIS · © {new Date().getFullYear()}
        </span>
        <span>RIOT N°01 · VOL.I · ÉTÉ 2026</span>
        <span>{LANGUES}</span>
      </div>
    </footer>
  );
}
