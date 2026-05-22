'use client';

import Link from 'next/link';

const LINKS = [
  { href: '/catalogue',  label: 'Catalogue' },
  { href: '/essayage',   label: 'Essayage IA' },
  { href: '/elodie',     label: 'Chat Élodie' },
  { href: '/sav',        label: 'SAV & FAQ' },
  { href: '/fidelite',   label: 'Glory Club' },
  { href: '/connexion',  label: 'Connexion' },
];

export function FooterRiot() {
  return (
    <footer
      style={{
        borderTop: '3px solid #0A0A0A',
        background: '#1A2E1F',
        marginTop: 96,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* Brand */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-anton), Impact, sans-serif',
                fontSize: 32,
                color: '#D4FF3E',
                textTransform: 'uppercase',
                lineHeight: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Glory Hair
            </p>
            <p
              style={{
                fontFamily: 'var(--font-special-elite), monospace',
                fontSize: 12,
                color: '#F4ECD8',
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                marginTop: 4,
              }}
            >
              Édition RIOT N°01
            </p>
            <p
              style={{
                fontFamily: 'var(--font-caveat), cursive',
                fontSize: 18,
                color: '#F4ECD8',
                opacity: 0.5,
                marginTop: 12,
                maxWidth: 320,
                lineHeight: 1.3,
              }}
            >
              Perruques cheveux humains premium.
              <br />
              DIY. Brutal. Sans compromis.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Liens footer">
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, auto)',
                columnGap: 48,
                rowGap: 8,
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      fontFamily: 'var(--font-archivo-black), sans-serif',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      color: '#F4ECD8',
                      opacity: 0.6,
                      textDecoration: 'none',
                      transition: 'opacity .15s, color .15s',
                      display: 'inline-block',
                      padding: '2px 0',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#D4FF3E';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.color = '#F4ECD8';
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid #0A0A0A',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-special-elite), monospace',
              fontSize: 12,
              color: '#F4ECD8',
              opacity: 0.4,
            }}
          >
            © {new Date().getFullYear()} Glory Hair by RHD Empire
          </p>
          <p
            style={{
              fontFamily: 'var(--font-special-elite), monospace',
              fontSize: 12,
              color: '#F4ECD8',
              opacity: 0.3,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
            }}
          >
            Issue N°01 — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
