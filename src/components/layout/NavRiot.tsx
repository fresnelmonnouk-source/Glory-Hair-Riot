'use client';

import Link from 'next/link';
import { CSSProperties } from 'react';
import { useCartStore } from '@/stores/cart.store';

const PILL: CSSProperties = {
  border: '2px solid #D4FF3E',
  padding: '0 14px',
  borderRadius: 999,
  height: 36,
  background: 'transparent',
  color: '#F4ECD8',
  fontFamily: 'var(--font-special-elite), monospace',
  fontSize: 14,
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  textDecoration: 'none',
};

const PILL_HOT: CSSProperties = {
  ...PILL,
  background: '#FF7A1A',
  color: '#0A0A0A',
  borderColor: '#0A0A0A',
  fontFamily: 'var(--font-rubik-mono-one), monospace',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const NAV_LINKS = [
  ['/', 'Accueil'],
  ['/catalogue', 'Catalogue'],
  ['/essayage', 'Essayage'],
  ['/elodie', 'Élodie'],
  ['/magazine', 'Magazine'],
  ['/sav', 'SAV'],
] as const;

export function NavRiot() {
  const count = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        padding: '18px 32px',
        borderBottom: '2px solid #D4FF3E',
        background: '#0E1B14',
        position: 'sticky',
        top: 'var(--topbar-h)',
        zIndex: 90,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-permanent-marker), cursive',
          fontSize: 42,
          lineHeight: 1,
          color: '#F4ECD8',
          transform: 'rotate(-3deg)',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textDecoration: 'none',
        }}
      >
        <span>
          Glory{' '}
          <span
            style={{
              color: '#FF7A1A',
              background: '#D4FF3E',
              padding: '0 6px',
              display: 'inline-block',
              transform: 'rotate(2deg)',
            }}
          >
            Hair!
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-special-elite), monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#D4FF3E',
            transform: 'rotate(1deg)',
            display: 'block',
            marginTop: 2,
          }}
        >
          by{' '}
          <em
            style={{
              fontFamily: 'var(--font-yeseva-one), serif',
              fontStyle: 'italic',
              color: '#FF7A1A',
            }}
          >
            RHD
          </em>{' '}
          Empire
        </span>
      </Link>

      {/* Nav links */}
      <div
        style={{
          display: 'flex',
          gap: 22,
          justifyContent: 'center',
          fontFamily: 'var(--font-special-elite), monospace',
          fontSize: 15,
        }}
      >
        {NAV_LINKS.map(([href, label]) => (
          <Link key={href} href={href} style={{ color: '#F4ECD8', textDecoration: 'none' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Right — pill buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={PILL}>FR / EN</button>
        <Link href="/compte" style={PILL}>Compte</Link>
        <button style={PILL}>♥ 14</button>
        <Link href="/panier" style={PILL_HOT}>
          Panier · {count}
        </Link>
      </div>
    </nav>
  );
}
