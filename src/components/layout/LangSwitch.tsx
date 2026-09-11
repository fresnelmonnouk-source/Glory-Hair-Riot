'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

/* Sélecteur de langue — remplace le "FR / EN" statique/décoratif qui
   existait déjà dans NavRiot. Remplace le segment [lang] de l'URL courante
   (pattern Sandy Stylish). Limite connue (héritée de Sandy, acceptée pour
   l'instant) : sur une fiche produit, le slug peut différer par locale une
   fois wig_translations en place (Phase 1b) — à affiner spécifiquement sur
   cette page-là plutôt que de complexifier ce composant partagé. */
export function LangSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname() ?? `/${lang}`;
  const rest = pathname.split('/').slice(2).join('/'); // retire le segment [lang] actuel

  return (
    <div className="flex items-center gap-1.5">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-faint">/</span>}
          {l === lang ? (
            <span className="text-ink" aria-current="true">{l.toUpperCase()}</span>
          ) : (
            <Link href={`/${l}/${rest}`} className="text-muted transition-colors hover:text-ink">
              {l.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
