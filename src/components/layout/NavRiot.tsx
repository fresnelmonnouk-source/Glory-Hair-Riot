'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { LangSwitch } from './LangSwitch';

/* Port structurel 1:1 de sandy-stylish/src/components/site-header.tsx
   (header sticky h-16, logo font-logo, nav gap-7, actions à droite
   séparées par "/") — adapté à GloryHairRiot (wishlist + panier au lieu de
   favoris + panier). `lang`/`dict` reçus en props depuis [lang]/layout.tsx
   (pattern Sandy : pas de context, chaque route re-fournit ces valeurs). */

export function NavRiot({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const pathname = usePathname() ?? '/';
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const { user, profile, loading } = useSession();
  const prenom = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const wishlistCount = trpc.wishlist.count.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });
  // Nom de marque admin-éditable (rebrand, Phase 2) — repli sur le
  // dictionnaire i18n (dict.brand, "Glory Hair") tant que la requête charge
  // ou si l'admin n'a encore rien configuré dans /admin/reglages.
  const brandQ = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const brandName = brandQ.data?.brand.name ?? dict.brand;

  const NAV: ReadonlyArray<readonly [string, string]> = [
    [`/${lang}/catalogue`, dict.nav.catalogue],
    [`/${lang}/essayage`, dict.nav.essayage],
    [`/${lang}/elodie`, dict.nav.elodie],
    [`/${lang}/magazine`, dict.nav.magazine],
  ];

  const accountHref = user ? `/${lang}/compte` : `/${lang}/connexion`;
  const accountLabel = user ? (prenom ?? dict.nav.monCompte) : dict.nav.connexion;

  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu mobile au changement de route. Ajustement pendant le
  // rendu (plutôt que setState() dans un effet, interdit par le React
  // Compiler) : cf. https://react.dev/learn/you-might-not-need-an-effect
  // #adjusting-some-state-when-a-prop-changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-app/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-8 px-6">
        <Link href={`/${lang}`} className="font-logo text-[22px] leading-none tracking-[0.02em] text-ink md:text-[30px]">
          {brandName}
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="hidden items-center gap-4 md:flex">
            <LangSwitch lang={lang} />
            <Link href={`/${lang}/compte?tab=souhaits`} className="text-muted transition-colors hover:text-ink">
              {dict.nav.favoris}{user ? ` (${wishlistCount.data ?? 0})` : ''}
            </Link>
            <Link href={accountHref} className="text-muted transition-colors hover:text-ink">
              {loading ? '…' : accountLabel}
            </Link>
            <Link href={`/${lang}/panier`} className="text-muted transition-colors hover:text-ink">
              {dict.nav.panier} ({cartCount})
            </Link>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <Link href={`/${lang}/panier`} className="text-ink">{dict.nav.panier} ({cartCount})</Link>
            <button
              type="button"
              aria-label={menuOpen ? dict.nav.fermerMenu : dict.nav.ouvrirMenu}
              aria-expanded={menuOpen}
              className="text-ink"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col gap-1 overflow-y-auto bg-app px-6 py-8 md:hidden">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="border-b border-hairline py-4 font-display text-2xl text-ink">
              {label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3 text-sm">
            <Link href={accountHref} className="text-muted">{loading ? '…' : accountLabel}</Link>
            <Link href={`/${lang}/compte?tab=souhaits`} className="text-muted">{dict.nav.favoris}{user ? ` (${wishlistCount.data ?? 0})` : ''}</Link>
            <LangSwitch lang={lang} />
          </div>
        </div>
      )}
    </header>
  );
}
