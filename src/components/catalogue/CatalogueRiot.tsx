'use client';

import { useMemo, useState } from 'react';
import { type Wig } from '@/lib/wigs-data';
import { ProductCard } from '@/components/product-card';
import type { Locale } from '@/i18n/config';

/* Port structurel 1:1 de sandy-stylish/src/app/(site)/[lang]/[category]/page.tsx
   (eyebrow + display h1 + compteur, grille grid-cols-2/3/4 gap-x-6 gap-y-12) —
   Sandy segmente par catégorie via l'URL et n'a pas de filtres client ; les
   filtres (fonctionnalité déjà existante GloryHairRiot) sont ajoutés entre le
   header et la grille, avec le même vocabulaire de composant (pilule
   rounded-full border-line, cf. la puce de conversation du conseiller Sandy). */

type FilterId = 'all' | 'straight' | 'wavy' | 'curly' | 'coily' | 'short' | 'long' | 'budget';

const FILTERS: ReadonlyArray<{ id: FilterId; label: string; match: (w: Wig) => boolean }> = [
  { id: 'all', label: 'Toutes', match: () => true },
  { id: 'straight', label: 'Lisses', match: (w) => w.style === 'Straight' },
  { id: 'wavy', label: 'Ondulées', match: (w) => w.style === 'Wavy' || w.style === 'Body Wave' },
  { id: 'curly', label: 'Bouclées', match: (w) => w.style === 'Curly' },
  { id: 'coily', label: 'Crépues', match: (w) => w.style === 'Coily' },
  { id: 'short', label: 'Courtes', match: (w) => w.length <= 16 },
  { id: 'long', label: 'Longues', match: (w) => w.length >= 20 },
  { id: 'budget', label: 'Sous 300€', match: (w) => w.price < 300 },
] as const;

export function CatalogueRiot({ wigs, lang }: { wigs: Wig[]; lang: Locale }) {
  const [activeId, setActiveId] = useState<FilterId>('all');

  const { filtered, counts } = useMemo(() => {
    const counts: Record<FilterId, number> = Object.fromEntries(
      FILTERS.map((f) => [f.id, wigs.filter(f.match).length]),
    ) as Record<FilterId, number>;
    const active = FILTERS.find((f) => f.id === activeId)!;
    return { filtered: wigs.filter(active.match), counts };
  }, [activeId, wigs]);

  const count = filtered.length <= 1 ? `${filtered.length} pièce` : `${filtered.length} pièces`;

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:px-11 md:py-20">
      <header className="mb-12">
        <p className="eyebrow">Catalogue</p>
        <h1 className="display mt-4 text-5xl text-ink">Toutes les perruques</h1>
        <p className="mt-3 text-sm text-faint">{count}</p>
      </header>

      <div className="mb-10 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
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
              {f.label} ({c})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl text-ink">Aucune perruque dans cette catégorie</p>
          <p className="mt-2 text-sm text-muted">pour Issue N°01. Reviens pour Issue N°02.</p>
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
