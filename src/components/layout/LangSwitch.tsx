'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

/* Sélecteur de langue — remplace le "FR / EN" statique/décoratif qui
   existait déjà dans NavRiot. Remplace le segment [lang] de l'URL courante
   (pattern Sandy Stylish). Le risque hérité de Sandy (slug produit différent
   par locale → 404 sur simple remplacement de segment) est évité PAR DESIGN
   ici : migration 016 (wig_translations, Phase 1b) backfille le même slug
   pour 'en' que pour 'fr' tant que getWigs/getWigBySlug n'ont pas de vraie
   raison de diverger. Si un slug EN distinct est introduit un jour, ce
   composant devra être revu (résolution du slug de la locale cible avant de
   construire le lien) — jusque-là, le remplacement naïf reste correct. */
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
