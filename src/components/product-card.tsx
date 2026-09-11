import Link from 'next/link';
import type { Wig } from '@/lib/wigs-data';

/* Port structurel 1:1 de sandy-stylish/src/components/product-card.tsx
   (aspect-[4/5] bg-surface, hover scale, font-display text-xl, prix en
   text-accent) — favoris omis ici (déjà géré ailleurs via trpc.wishlist,
   pas une primitive partagée côté Sandy sur ce composant précis). */

export function ProductCard({ wig }: { wig: Wig }) {
  return (
    <Link href={`/perruque/${wig.id}`} className="group block">
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
      <p className="mt-2 text-sm text-accent">{wig.price}€</p>
    </Link>
  );
}
