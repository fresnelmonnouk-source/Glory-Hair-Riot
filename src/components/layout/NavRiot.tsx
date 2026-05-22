'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

const NAV_LINKS: ReadonlyArray<readonly [string, string, string]> = [
  ['/',          'Accueil',  '01'],
  ['/catalogue', 'Catalogue', '02'],
  ['/essayage',  'Essayage',  '03'],
  ['/elodie',    'Élodie',    '04'],
  ['/magazine',  'Magazine',  '05'],
  ['/sav',       'SAV',       '06'],
];

/** Match exact pour "/" ; match préfixe pour les autres (gère /essayage/live). */
function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function NavRiot() {
  const pathname = usePathname() ?? '/';
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const { user, profile, loading } = useSession();
  const prenom = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const wishlistCount = trpc.wishlist.count.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });

  const [sheetOpen, setSheetOpen] = useState(false);

  // Fermer la sheet au changement de route
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  // Lock body scroll quand sheet ouvert
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  // Fermer sur Escape
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

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
            Panier · {cartCount}
          </Link>
        </div>

        {/* Placeholder col 3 mobile (vide — le FAB est en fixed) */}
        <div className="hide-desktop" aria-hidden style={{ width: 1 }} />
      </nav>

      {/* FAB mobile — caché sur tryon live qui a son propre footer fixe */}
      {!pathname.startsWith('/essayage/live') && (
      <button
        type="button"
        className={sheetOpen ? 'nav-fab open' : 'nav-fab'}
        aria-label={sheetOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen((v) => !v)}
      >
        {sheetOpen ? (
          <X size={26} strokeWidth={2.8} />
        ) : (
          <>
            <Star className="nav-fab-star" size={22} strokeWidth={2.5} fill="#FF7A1A" />
            <span className="nav-fab-label">Menu</span>
          </>
        )}
        {!sheetOpen && cartCount > 0 && (
          <span className="nav-fab-badge" aria-label={`${cartCount} article${cartCount > 1 ? 's' : ''} dans le panier`}>
            {cartCount}
          </span>
        )}
      </button>
      )}

      {/* Sheet mobile */}
      {sheetOpen && (
        <>
          <div
            className="nav-sheet-backdrop"
            role="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={() => setSheetOpen(false)}
          />
          <aside className="nav-sheet" aria-label="Menu de navigation">
            <div className="nav-sheet-head">
              <h2>
                Menu<br />
                <em>RIOT.</em>
              </h2>
              <span className="nav-sheet-stamp">★ Issue N°01</span>
            </div>

            {NAV_LINKS.map(([href, label, num]) => {
              const active = isActive(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? 'nav-sheet-link active' : 'nav-sheet-link'}
                >
                  <span className="num">{num}</span>
                  <span>{label}</span>
                </Link>
              );
            })}

            <div className="nav-sheet-actions">
              {loading ? (
                <span className="nav-pill full" style={{ opacity: 0.4 }}>…</span>
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
                <span>{user ? (wishlistCount.data ?? 0) : 0}</span>
              </Link>
              <Link href="/panier" className="nav-pill hot full">
                ★ Panier · {cartCount}
              </Link>
              <button type="button" className="nav-pill full">FR / EN</button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
