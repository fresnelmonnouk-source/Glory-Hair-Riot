'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';

const NAV_LINKS = [
  ['/',          'Accueil'],
  ['/catalogue', 'Catalogue'],
  ['/essayage',  'Essayage'],
  ['/elodie',    'Élodie'],
  ['/magazine',  'Magazine'],
  ['/sav',       'SAV'],
] as const;

/** Match exact pour "/" ; match préfixe pour les autres (gère /essayage/live). */
function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function NavRiot() {
  const pathname = usePathname() ?? '/';
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
      <div style={{ display: 'flex', gap: 22, justifyContent: 'center' }}>
        {NAV_LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={isActive(href, pathname) ? 'nav-link active' : 'nav-link'}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right — pill buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" className="nav-pill">FR / EN</button>
        <Link href="/compte" className="nav-pill">Compte</Link>
        <button type="button" className="nav-pill">♥ 14</button>
        <Link href="/panier" className="nav-pill hot">
          Panier · {count}
        </Link>
      </div>
    </nav>
  );
}
