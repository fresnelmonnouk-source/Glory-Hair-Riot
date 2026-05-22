'use client';

import { useMemo, useState, CSSProperties } from 'react';
import Link from 'next/link';
import { WIGS, type Wig } from '@/lib/wigs-data';

// ─── Filtres : id stable + label affiché + prédicat sur Wig ────────

type FilterId = 'all' | 'straight' | 'wavy' | 'curly' | 'coily' | 'short' | 'long' | 'budget';

const FILTERS: ReadonlyArray<{ id: FilterId; label: string; match: (w: Wig) => boolean }> = [
  { id: 'all',      label: 'Toutes',        match: ()  => true },
  { id: 'straight', label: 'Lisses',        match: (w) => w.style === 'Straight' },
  { id: 'wavy',     label: 'Ondulées',      match: (w) => w.style === 'Wavy' || w.style === 'Body Wave' },
  { id: 'curly',    label: 'Bouclées',      match: (w) => w.style === 'Curly' },
  { id: 'coily',    label: 'Crépues',       match: (w) => w.style === 'Coily' },
  { id: 'short',    label: 'Courtes',       match: (w) => w.length <= 16 },
  { id: 'long',     label: 'Longues',       match: (w) => w.length >= 20 },
  { id: 'budget',   label: 'Sous 300€',     match: (w) => w.price < 300 },
] as const;

// ─── Styles inline (cohérent avec le reste du projet) ──────────────

const SECTION: CSSProperties = {
  borderBottom: '3px solid #D4FF3E',
  padding: 'clamp(40px, 7vw, 60px) clamp(16px, 4vw, 32px)',
  position: 'relative',
};

const HEAD: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: 40,
  flexWrap: 'wrap',
  gap: 24,
};

const H2: CSSProperties = {
  fontFamily: 'var(--font-anton), Impact, sans-serif',
  fontSize: 'clamp(48px, 11vw, 180px)',
  lineHeight: 0.85,
  textTransform: 'uppercase',
  color: '#F4ECD8',
};

const LIME_STK: CSSProperties = {
  background: '#D4FF3E',
  color: '#0A0A0A',
  padding: '0 0.08em',
  display: 'inline-block',
  transform: 'rotate(-2deg)',
};

const SCRAWL: CSSProperties = {
  fontFamily: 'var(--font-caveat), cursive',
  fontWeight: 700,
  color: '#FF7A1A',
  fontSize: 32,
  lineHeight: 1.1,
  transform: 'rotate(-3deg)',
  maxWidth: 220,
  textAlign: 'right',
};

const FILTERS_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 32,
};

function pillStyle(active: boolean, disabled: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-special-elite), monospace',
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '8px 14px',
    border: '2px solid #F4ECD8',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: active ? '#D4FF3E' : 'transparent',
    color: active ? '#0A0A0A' : '#F4ECD8',
    borderColor: active ? '#D4FF3E' : '#F4ECD8',
    borderRadius: 999,
    opacity: disabled ? 0.3 : 1,
    transition: 'all .15s',
  };
}

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
  gap: '32px 20px',
};

// ─── Carte produit zine ────────────────────────────────────────────

function ProductZineCard({ wig, index }: { wig: Wig; index: number }) {
  const rotation = [-1.2, 1.4, -1, 1.6][index % 4];
  const shadowColor = ['rgba(0,0,0,.5)', '#FF7A1A', '#D4FF3E', '#FF4D8D'][index % 4];
  const stampColor =
    wig.tag === 'NEW'  ? '#D4FF3E' :
    wig.tag === 'HOT'  ? '#FF4D8D' :
    wig.tag === 'EDIT' ? '#F5E55E' :
                         '#FF7A1A';
  const stampLabel =
    wig.tag === 'BEST' ? 'COVER' :
    wig.tag === 'NEW'  ? 'NEW★'  :
    wig.tag === 'HOT'  ? 'HOT'   :
    wig.tag === 'EDIT' ? 'EDIT'  :
                         'GLORY';

  return (
    <Link
      href={`/perruque/${wig.id}`}
      style={{
        position: 'relative',
        background: '#F4ECD8',
        color: '#0A0A0A',
        padding: '12px 12px 18px',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform .25s, box-shadow .25s',
        boxShadow: `4px 5px 0 ${shadowColor}`,
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-6px) scale(1.03)';
        e.currentTarget.style.zIndex = '5';
        e.currentTarget.style.boxShadow = '8px 12px 0 #0A0A0A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotation}deg)`;
        e.currentTarget.style.zIndex = '';
        e.currentTarget.style.boxShadow = `4px 5px 0 ${shadowColor}`;
      }}
    >
      {/* tape on card */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%) rotate(-3deg)',
          width: 80,
          height: 18,
          background: 'rgba(245,229,94,.7)',
          borderLeft: '1px dashed rgba(0,0,0,.3)',
          borderRight: '1px dashed rgba(0,0,0,.3)',
          zIndex: 2,
        }}
      />

      {/* image */}
      <div
        style={{
          background: '#0A0A0A',
          aspectRatio: '4/5',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wig.img}
          alt={wig.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: 'var(--font-rubik-mono-one), monospace',
            fontSize: 32,
            color: '#F4ECD8',
            textShadow: '2px 2px 0 #0A0A0A',
          }}
        >
          {wig.num.replace('N°', '')}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: stampColor,
            color: '#0A0A0A',
            padding: '4px 10px',
            fontFamily: 'var(--font-rubik-mono-one), monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            border: '2px solid #0A0A0A',
            transform: 'rotate(6deg)',
          }}
        >
          {stampLabel}
        </div>
      </div>

      {/* info */}
      <div style={{ padding: '14px 4px 0' }}>
        <div
          style={{
            fontFamily: 'var(--font-permanent-marker), cursive',
            fontSize: 24,
            lineHeight: 1,
            letterSpacing: '0.01em',
          }}
        >
          {wig.name.replace(/(\d+")/, '').trim()}{' '}
          <em
            style={{
              fontFamily: 'var(--font-yeseva-one), serif',
              fontStyle: 'italic',
              color: '#FF7A1A',
            }}
          >
            {wig.length}″
          </em>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            fontFamily: 'var(--font-special-elite), monospace',
            fontSize: 13,
            color: '#5E6A64',
          }}
        >
          <span>
            {wig.style} · {wig.tone}
          </span>
          <span
            style={{
              background: '#D4FF3E',
              color: '#0A0A0A',
              fontFamily: 'var(--font-rubik-mono-one), monospace',
              fontSize: 16,
              padding: '3px 10px',
              letterSpacing: '-0.01em',
              transform: 'rotate(-2deg)',
              display: 'inline-block',
            }}
          >
            {wig.price}€
          </span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 5 }}>
          {wig.swatches.map((c, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid #0A0A0A',
                background: c,
              }}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Composant principal ───────────────────────────────────────────

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
    <section style={SECTION} data-view="catalogue">
      <div style={HEAD}>
        <h2 style={H2}>
          Le <span style={LIME_STK}>CATA-</span>
          <br />
          logue.
        </h2>
        <div style={SCRAWL}>
          → {WIGS.length} pièces tirées
          <br />à la main
        </div>
      </div>

      <div style={FILTERS_ROW}>
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
              style={pillStyle(active, disabled)}
              aria-pressed={active}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            fontFamily: 'var(--font-vt323), monospace',
            color: '#F4ECD8',
            opacity: 0.6,
            padding: '40px 0',
            textAlign: 'center',
          }}
        >
          Aucune perruque dans cette catégorie pour Issue N°01. Reviens pour Issue N°02.
        </div>
      ) : (
        <div style={GRID}>
          {filtered.map((w, i) => (
            <ProductZineCard key={w.id} wig={w} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
