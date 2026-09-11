'use client';

/* Port structurel 1:1 de sandy-stylish/src/components/admin/admin-nav.tsx
   (liste plate, pas de sections — Sandy n'en a pas — item actif border-l-2
   border-accent bg-surface). Anciens badges "18"/"3" retirés : ils étaient
   des nombres codés en dur (mock), pas des données réelles. */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: { href: string; label: string }[] = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/packs', label: 'Packs' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/avis', label: 'Avis' },
  { href: '/admin/elodie', label: 'Élodie · IA' },
  { href: '/admin/contenu', label: 'Magazine' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/promos', label: 'Promotions' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/reglages', label: 'Réglages' },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? '/admin';

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Navigation admin" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="rounded-sm border-l-2 py-2.5 pl-4 pr-3 text-sm transition-colors"
            style={{
              borderColor: active ? 'var(--accent)' : 'transparent',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {item.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="mt-2 rounded-sm border-l-2 border-transparent py-2.5 pl-4 pr-3 text-sm text-muted transition-colors hover:text-ink">
        Voir le site ↗
      </Link>
    </nav>
  );
}
