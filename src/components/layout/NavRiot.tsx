'use client';

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

const NAV_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/essayage', label: 'Essayage' },
  { href: '/elodie', label: 'Élodie' },
  { href: '/sav', label: 'SAV' },
];

export function NavRiot() {
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <nav
      className="fixed top-8 left-0 right-0 z-[90] bg-forest border-b-2 border-ink"
      aria-label="Navigation principale"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-['Anton'] text-xl uppercase tracking-tight text-lime hover:text-lime-dim transition-colors"
        >
          Glory Hair
          <span className="text-paper text-xs font-['Special_Elite'] ml-1 tracking-widest">RIOT</span>
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-6 list-none">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="font-['Archivo_Black'] text-xs uppercase tracking-widest text-paper hover:text-lime transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/compte"
            className="text-paper hover:text-lime transition-colors"
            aria-label="Mon compte"
          >
            <User size={20} strokeWidth={2} />
          </Link>

          <Link
            href="/panier"
            className="relative text-paper hover:text-lime transition-colors"
            aria-label={`Panier — ${itemCount} article${itemCount !== 1 ? 's' : ''}`}
          >
            <ShoppingCart size={20} strokeWidth={2} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-lime text-ink text-[10px] font-['Archivo_Black'] w-4 h-4 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
