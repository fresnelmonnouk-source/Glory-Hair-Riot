'use client';

import { useMemo, useState } from 'react';
import { type Wig } from '@/lib/wigs-data';
import { ProductCard } from '@/components/product-card';
import type { Locale } from '@/i18n/config';
import { getDictionaryClient } from '@/i18n/client';

/* Port structurel 1:1 de sandy-stylish/src/app/(site)/[lang]/[category]/page.tsx
   (eyebrow + display h1 + compteur, grille grid-cols-2/3/4 gap-x-6 gap-y-12) —
   Sandy segmente par catégorie via l'URL et n'a pas de filtres client ; les
   filtres (fonctionnalité déjà existante GloryHairRiot) sont ajoutés entre le
   header et la grille, avec le même vocabulaire de composant (pilule
   rounded-full border-line, cf. la puce de conversation du conseiller Sandy). */

type FilterId = 'all' | 'straight' | 'wavy' | 'curly' | 'coily' | 'short' | 'long' | 'budget';

const FILTER_MATCHERS: ReadonlyArray<{ id: FilterId; match: (w: Wig) => boolean }> = [
  { id: 'all', match: () => true },
  { id: 'straight', match: (w) => w.style === 'Straight' },
  { id: 'wavy', match: (w) => w.style === 'Wavy' || w.style === 'Body Wave' },
  { id: 'curly', match: (w) => w.style === 'Curly' },
  { id: 'coily', match: (w) => w.style === 'Coily' },
  { id: 'short', match: (w) => w.length <= 16 },
  { id: 'long', match: (w) => w.length >= 20 },
  { id: 'budget', match: (w) => w.price < 300 },
] as const;

export function CatalogueRiot({ wigs, lang }: { wigs: Wig[]; lang: Locale }) {
  const dict = getDictionaryClient(lang);
  const [activeId, setActiveId] = useState<FilterId>('all');

  const { filtered, counts } = useMemo(() => {
    const counts: Record<FilterId, number> = Object.fromEntries(
      FILTER_MATCHERS.map((f) => [f.id, wigs.filter(f.match).length]),
    ) as Record<FilterId, number>;
    const active = FILTER_MATCHERS.find((f) => f.id === activeId)!;
    return { filtered: wigs.filter(active.match), counts };
  }, [activeId, wigs]);

  const countLabel = (filtered.length <= 1 ? dict.catalogue.resultCountSingular : dict.catalogue.resultCountPlural)
    .replace('{count}', String(filtered.length));

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-11 md:py-20">
      <header className="mb-12">
        <p className="eyebrow">{dict.catalogue.eyebrow}</p>
        <h1 className="display mt-4 text-5xl text-ink">{dict.catalogue.title}</h1>
        <p className="mt-3 text-sm text-faint">{countLabel}</p>
      </header>

      <div className="mb-10 flex flex-wrap gap-2">
        {FILTER_MATCHERS.map((f) => {
          const c = counts[f.id];
          const disabled = c === 0;
          const active = activeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveId(f.id)}
              aria-pressed={active}
              className="rounded-full border px-4 py-2 text-sm transition-colors"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border-card)',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--on-accent)' : 'var(--text-muted)',
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {dict.catalogue.filters[f.id]} ({c})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl text-ink">{dict.catalogue.emptyTitle}</p>
          <p className="mt-2 text-sm text-muted">{dict.catalogue.emptyBody}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((w) => (
            <ProductCard key={w.id} wig={w} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}
