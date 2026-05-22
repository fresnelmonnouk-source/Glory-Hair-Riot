'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

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
  const { user, profile, loading } = useSession();
  const prenom = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const wishlistCount = trpc.wishlist.count.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fermer le drawer au changement de route
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll quand drawer ouvert
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="nav-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '2px solid #D4FF3E',
          background: '#0E1B14',
          position: 'sticky',
          top: 'var(--topbar-h)',
          zIndex: 90,
          gap: 12,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-permanent-marker), cursive',
            fontSize: 'clamp(26px, 5vw, 42px)',
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
            className="hide-sm"
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

        {/* Nav links — desktop only */}
        <div
          className="nav-links-desktop"
          style={{ display: 'flex', gap: 22, justifyContent: 'center' }}
        >
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

        {/* Right pills — desktop only */}
        <div
          className="nav-actions-desktop"
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <button type="button" className="nav-pill">FR / EN</button>
          {loading ? (
            <span className="nav-pill" style={{ opacity: 0.4 }}>…</span>
          ) : user ? (
            <Link href="/compte" className="nav-pill" title={user.email ?? undefined}>
              {prenom ? `★ ${prenom}` : 'Compte'}
            </Link>
          ) : (
            <Link href="/connexion" className="nav-pill">Connexion</Link>
          )}
          <Link
            href="/compte?tab=souhaits"
            className="nav-pill"
            aria-label="Souhaits"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Heart size={14} strokeWidth={2.5} />
            {user ? (wishlistCount.data ?? 0) : 0}
          </Link>
          <Link href="/panier" className="nav-pill hot">
            Panier · {count}
          </Link>
        </div>

        {/* Burger button — mobile only (visible via CSS) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <Link
            href="/panier"
            className="nav-pill hot hide-desktop"
            aria-label="Panier"
            style={{ padding: '0 10px' }}
          >
            {count}
          </Link>
          <button
            type="button"
            className="nav-burger-btn"
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div
            className="nav-drawer-backdrop"
            role="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="nav-drawer" aria-label="Menu de navigation">
            <button
              type="button"
              className="nav-drawer-close"
              aria-label="Fermer le menu"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={isActive(href, pathname) ? 'nav-drawer-link active' : 'nav-drawer-link'}
              >
                {label}
              </Link>
            ))}

            <div className="nav-drawer-actions">
              <button type="button" className="nav-pill">FR / EN</button>
              {loading ? (
                <span className="nav-pill" style={{ opacity: 0.4 }}>…</span>
              ) : user ? (
                <Link href="/compte" className="nav-pill" title={user.email ?? undefined}>
                  {prenom ? `★ ${prenom}` : 'Mon compte'}
                </Link>
              ) : (
                <Link href="/connexion" className="nav-pill">Connexion</Link>
              )}
              <Link
                href="/compte?tab=souhaits"
                className="nav-pill"
                aria-label="Souhaits"
              >
                <Heart size={14} strokeWidth={2.5} />
                <span>Souhaits · {user ? (wishlistCount.data ?? 0) : 0}</span>
              </Link>
              <Link href="/panier" className="nav-pill hot">
                Panier · {count}
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
