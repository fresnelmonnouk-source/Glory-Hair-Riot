'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WIGS, type Wig } from '@/lib/wigs-data';

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

function ProductCard({ wig }: { wig: Wig }) {
  const badge = wig.tag === 'NEW' ? 'Nouveau' : wig.tag === 'HOT' ? 'Populaire' : wig.tag === 'BEST' ? 'Best-seller' : null;

  return (
    <Link href={`/perruque/${wig.id}`} className="group block">
      <div className="relative overflow-hidden rounded-sm" style={{ aspectRatio: '4/5', background: 'var(--surface)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wig.img}
          alt={wig.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {badge && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide"
            style={{ background: 'var(--bg-deepest)', color: 'var(--text-primary)' }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px]" style={{ color: 'var(--text-primary)' }}>
            {wig.name.replace(/(\d+")/, '').trim()} <span style={{ color: 'var(--text-faint)' }}>{wig.length}″</span>
          </h3>
          <span className="whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {wig.price}€
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>{wig.style} · {wig.tone}</p>
        <div className="mt-2 flex gap-1.5">
          {wig.swatches.map((c, i) => (
            <span key={i} className="h-3.5 w-3.5 rounded-full border" style={{ borderColor: 'var(--border-hairline)', background: c }} />
          ))}
        </div>
      </div>
    </Link>
  );
}

export function CatalogueRiot() {
  const [activeId, setActiveId] = useState<FilterId>('all');

  const { filtered, counts } = useMemo(() => {
    const counts: Record<FilterId, number> = Object.fromEntries(
      FILTERS.map((f) => [f.id, WIGS.filter(f.match).length]),
    ) as Record<FilterId, number>;
    const active = FILTERS.find((f) => f.id === activeId)!;
    return { filtered: WIGS.filter(active.match), counts };
  }, [activeId]);

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-20" data-view="catalogue">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[clamp(36px,6vw,64px)]" style={{ color: 'var(--text-primary)' }}>Le catalogue</h1>
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>{WIGS.length} pièces tirées à la main</p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = counts[f.id];
          const disabled = count === 0;
          const active = activeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveId(f.id)}
              aria-pressed={active}
              className="rounded-full border px-4 py-2 text-xs transition-colors"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border-input)',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--on-accent)' : 'var(--text-muted)',
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
          Aucune perruque dans cette catégorie pour Issue N°01. Reviens pour Issue N°02.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((w) => (
            <ProductCard key={w.id} wig={w} />
          ))}
        </div>
      )}
    </section>
  );
}
