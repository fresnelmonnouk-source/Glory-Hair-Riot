'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';
import { ButtonLink } from '@/components/ui/Button';

const NAV_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/', 'Accueil'],
  ['/catalogue', 'Catalogue'],
  ['/essayage', 'Essayage'],
  ['/elodie', 'Conseil Élodie'],
  ['/magazine', 'Magazine'],
  ['/sav', 'Aide'],
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

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      className="sticky z-90 border-b border-hairline bg-bg-app/90 backdrop-blur"
      style={{ borderColor: 'var(--border-hairline)', top: 'var(--topbar-h)' }}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-5 py-4"
      >
        <Link href="/" className="font-logo text-2xl italic text-ivory no-underline">
          Glory Hair
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors"
              style={{
                color: isActive(href, pathname) ? 'var(--accent-hi)' : 'var(--text-muted)',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            className="text-xs tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            FR / EN
          </button>
          {loading ? (
            <span className="text-sm" style={{ color: 'var(--text-faint)' }}>…</span>
          ) : user ? (
            <Link href="/compte" className="text-sm" title={user.email ?? undefined} style={{ color: 'var(--text-primary)' }}>
              {prenom ?? 'Mon compte'}
            </Link>
          ) : (
            <Link href="/connexion" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Connexion
            </Link>
          )}
          <Link
            href="/compte?tab=souhaits"
            aria-label="Favoris"
            className="inline-flex items-center gap-1 text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            <Heart size={16} strokeWidth={1.75} />
            {user ? (wishlistCount.data ?? 0) : 0}
          </Link>
          <ButtonLink href="/panier" variant="primary" size="sm">
            <ShoppingBag size={15} strokeWidth={1.75} aria-hidden />
            <span aria-label="Panier">{cartCount}</span>
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          className="inline-flex items-center justify-center md:hidden"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-100 flex flex-col md:hidden"
          style={{ background: 'var(--bg-deepest)', top: 'calc(var(--topbar-h) + 64px)' }}
        >
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-8">
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="display border-b py-4 text-2xl"
                style={{
                  borderColor: 'var(--border-hairline)',
                  color: isActive(href, pathname) ? 'var(--accent-hi)' : 'var(--text-primary)',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t px-6 py-6" style={{ borderColor: 'var(--border-hairline)' }}>
            {loading ? null : user ? (
              <Link href="/compte" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {prenom ?? 'Mon compte'}
              </Link>
            ) : (
              <Link href="/connexion" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Connexion
              </Link>
            )}
            <Link href="/compte?tab=souhaits" className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Favoris · {user ? (wishlistCount.data ?? 0) : 0}
            </Link>
            <ButtonLink href="/panier" variant="primary" className="w-full">
              Voir le panier · {cartCount}
            </ButtonLink>
            <button type="button" className="text-xs" style={{ color: 'var(--text-muted)' }}>
              FR / EN
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
