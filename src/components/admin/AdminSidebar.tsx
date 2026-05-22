'use client';

/**
 * AdminSidebar — port fidèle <aside class="side"> Admin.html (666-723) + CSS 67-145.
 *
 * Sidebar sticky avec 4 sections (Pilotage / Relation / Marketing / Système)
 * + user card en bas.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';

interface NavItem {
  href: string;
  ico: string;
  label: string;
  badge?: string;
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'PILOTAGE',
    items: [
      { href: '/admin',           ico: '▣', label: 'Tableau de bord' },
      { href: '/admin/commandes', ico: '▤', label: 'Commandes', badge: '18' },
      { href: '/admin/produits',  ico: '★', label: 'Produits' },
      { href: '/admin/stock',     ico: '▥', label: 'Stock', badge: '3' },
    ],
  },
  {
    label: 'RELATION',
    items: [
      { href: '/admin/clients', ico: '◉', label: 'Clients' },
      { href: '/admin/avis',    ico: '✦', label: 'Avis' },
      { href: '/admin/elodie',  ico: '●', label: 'Élodie · IA' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { href: '/admin/contenu',   ico: '▦', label: 'Magazine' },
      { href: '/admin/promos',    ico: '%', label: 'Promos' },
      { href: '/admin/analytics', ico: '⌃', label: 'Analytics' },
    ],
  },
  {
    label: 'SYSTÈME',
    items: [
      { href: '/admin/reglages', ico: '⚙', label: 'Réglages' },
      { href: '/',               ico: '↗', label: 'Voir le site' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? '/admin';

  return (
    <aside style={{
      background: '#0A0A0A',
      color: '#F4ECD8',
      borderRight: '3px solid #D4FF3E',
      padding: '24px 18px',
      display: 'flex', flexDirection: 'column',
      gap: 18,
      width: 240,
      position: 'sticky', top: 0,
      height: '100vh', overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Header logo */}
      <div>
        <div style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 32, lineHeight: 1, color: '#F4ECD8',
          transform: 'rotate(-3deg)', display: 'inline-block',
        }}>
          Glory{' '}
          <b style={{
            color: '#FF7A1A', background: '#D4FF3E',
            padding: '0 6px', display: 'inline-block',
            transform: 'rotate(2deg)',
          }}>
            !
          </b>
        </div>
        <div style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#D4FF3E', marginTop: 4,
        }}>
          by{' '}
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', color: '#FF7A1A',
            textTransform: 'none', fontSize: 12,
          }}>
            RHD
          </em>{' '}
          Empire
        </div>
        <span style={{
          display: 'inline-block', marginTop: 10,
          background: '#FF7A1A', color: '#0A0A0A',
          padding: '3px 8px',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 9, letterSpacing: '0.18em',
          border: '2px solid #D4FF3E',
          transform: 'rotate(-2deg)',
        }}>
          ★ ADMIN · RIOT
        </span>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <div style={{
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 10, letterSpacing: '0.14em',
            color: '#5E6A64', marginBottom: 6,
            padding: '0 4px',
          }}>
            // {section.label}
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.items.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...linkStyle,
                    ...(isActive ? activeLinkStyle : {}),
                  }}
                >
                  <span style={icoStyle}>{item.ico}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      ...badgeStyle,
                      ...(isActive ? activeBadgeStyle : {}),
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* User card */}
      <div style={{
        marginTop: 'auto',
        background: '#142A1F',
        border: '2px dashed #D4FF3E',
        padding: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div aria-hidden style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #f5d4b8 0%, #e8b794 50%, #b8755a 90%)',
          border: '2px solid #D4FF3E',
          flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 15, lineHeight: 1, color: '#F4ECD8',
          }}>
            Olivia M.
          </div>
          <div style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 10, color: '#5E6A64',
            letterSpacing: '0.06em', marginTop: 3,
          }}>
            ADMIN · NIVEAU 1
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Styles ─────────────────────────────────────────

const linkStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 12px',
  borderRadius: 8,
  fontFamily: 'var(--font-special-elite),monospace',
  fontSize: 14, letterSpacing: '0.02em',
  color: '#F4ECD8',
  background: 'transparent',
  border: '2px solid transparent',
  textDecoration: 'none',
  transition: 'background .15s, color .15s, transform .12s',
};

// Active : Permanent Marker 16px + rotate -1deg + shadow orange + border ink
const activeLinkStyle: CSSProperties = {
  background: '#D4FF3E',
  color: '#0A0A0A',
  border: '2px solid #0A0A0A',
  fontFamily: 'var(--font-permanent-marker),cursive',
  fontSize: 16,
  transform: 'rotate(-1deg)',
  boxShadow: '3px 3px 0 #FF7A1A',
};

const icoStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 22, height: 22,
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 12, color: 'inherit',
  flexShrink: 0,
};

const badgeStyle: CSSProperties = {
  marginLeft: 'auto',
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 10, letterSpacing: '0.06em',
  padding: '2px 7px',
  background: '#FF7A1A',
  color: '#0A0A0A',
  border: '1px solid #0A0A0A',
};

const activeBadgeStyle: CSSProperties = {
  background: '#0A0A0A',
  color: '#D4FF3E',
};
