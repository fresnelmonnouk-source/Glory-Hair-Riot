import Link from 'next/link';
import { getWigs } from '@/lib/wigs/service';
import { ProductCard } from '@/components/product-card';
import type { Locale } from '@/i18n/config';

/* Port structurel 1:1 de la section "LA SÉLECTION" de sandy-stylish
   home page.tsx (titre + lien "voir tout", grille 4 col ProductCard).
   Catalogue réel depuis Supabase (migration 006) au lieu du fichier
   statique — mêmes 4 premiers produits par display_order. */

export async function Selection({ lang }: { lang: Locale }) {
  const wigs = await getWigs();
  const featured = wigs.slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1180px] px-6 pb-24 md:px-11">
      <div className="flex items-end justify-between">
        <h2 className="display text-4xl text-ink">La sélection</h2>
        <Link href={`/${lang}/catalogue`} className="eyebrow hover:opacity-80">
          Voir tout →
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {featured.map((w) => (
          <ProductCard key={w.id} wig={w} lang={lang} />
        ))}
      </div>
    </section>
  );
}
