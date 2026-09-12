'use client';

import Link from 'next/link';
import type { Wig } from '@/lib/wigs-data';
import type { Locale } from '@/i18n/config';
import { useMoneyFormatter } from '@/lib/currency-client';

/* Port structurel 1:1 de sandy-stylish/src/components/product-card.tsx
   (aspect-[4/5] bg-surface, hover scale, font-display text-xl, prix en
   text-accent) — favoris omis ici (déjà géré ailleurs via trpc.wishlist,
   pas une primitive partagée côté Sandy sur ce composant précis). `lang`
   requis (pas optionnel) : tsc doit forcer la mise à jour de chaque
   appelant lors de la migration i18n plutôt que de silencieusement
   retomber sur 'fr' quelque part.

   'use client' ajouté pour le sélecteur de devise (Phase 3) : wig.price
   est en euros ENTIERS déjà arrondis (Math.round(base_price/100) dans
   wigs/service.ts, précision centimes perdue en amont, préexistant) —
   d'où `wig.price * 100` pour retrouver des "centimes" compatibles avec
   formatMoney(), déjà l'unité utilisée par le reste de l'app (money.ts). */

export function ProductCard({ wig, lang }: { wig: Wig; lang: Locale }) {
  const { money } = useMoneyFormatter();
  return (
    <Link href={`/${lang}/perruque/${wig.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wig.img}
          alt={wig.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      <h3 className="mt-4 font-display text-xl text-ink">
        {wig.isPack ? wig.name : (
          <>{wig.name.replace(/(\d+")/, '').trim()} <span className="text-faint">{wig.length}″</span></>
        )}
      </h3>
      {wig.isPack ? (
        <p className="mt-1 line-clamp-1 text-sm text-faint">Pack</p>
      ) : (
        <p className="mt-1 line-clamp-1 text-sm text-faint">{wig.style} · {wig.tone}</p>
      )}
      <p className="mt-2 text-sm text-accent">{money(wig.price * 100)}</p>
    </Link>
  );
}
