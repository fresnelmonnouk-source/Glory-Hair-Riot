'use client';

/**
 * Page Produit RIOT — port fidèle <section class="feature-prod"> Riot.html (2204-2287)
 * + CSS lignes 1034-1161.
 *
 * Composant client (sélections coloris/taille/densité + ajout panier).
 */

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { WIGS, type Wig } from '@/lib/wigs-data';
import { useCartStore } from '@/stores/cart.store';

const SIZES_AVAILABLE = [16, 18, 20, 22, 24] as const;
const DENSITIES = [
  { value: 150, label: '150%', note: 'légère' },
  { value: 180, label: '180%', note: 'standard' },
  { value: 200, label: '200%', note: 'volume' },
] as const;

const FEATURES = [
  { key: 'Compo',       value: 'Cheveux humains Remy 100%' },
  { key: 'Calotte',     value: 'Lace front HD invisible · respirante' },
  { key: 'Densité',     value: '180% — naturelle, mobile' },
  { key: 'Entretien',   value: 'Lavage doux toutes les 6 semaines' },
  { key: 'Livraison',   value: 'France 48h · International 4-6j' },
];

function tagLabel(tag?: Wig['tag']): string {
  switch (tag) {
    case 'BEST': return '★ COVER';
    case 'NEW':  return '★ NEW';
    case 'HOT':  return '★ HOT';
    case 'EDIT': return '★ ÉDITION';
    default:     return '★ GLORY';
  }
}

function refCode(wig: Wig): string {
  // ex: GH-VEL-14
  const prefix = wig.id.slice(0, 3).toUpperCase();
  return `RÉF GH-${prefix}-${wig.length}`;
}

export function ProduitRiot({ wig }: { wig: Wig }) {
  // ─── état des sélections ────────────────────────────
  const [selectedColor, setSelectedColor] = useState(0); // index swatches
  const [selectedSize, setSelectedSize] = useState<number>(wig.length);
  const [selectedDensity, setSelectedDensity] = useState<number>(180);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // 3 autres wigs pour les thumbs polaroïds (3 différents du courant)
  const otherWigs = useMemo(() => {
    return WIGS.filter((w) => w.id !== wig.id).slice(0, 3);
  }, [wig.id]);

  // Prix "was" mock à +30%
  const wasPrice = Math.round(wig.price * 1.3 / 10) * 10;

  // Nom sans la longueur (ex: "Velours 14"" → "Velours")
  const nameOnly = wig.name.replace(/\s*\d+"$/, '').trim();

  function handleAddToCart() {
    addItem({
      wig_id: wig.id,
      variant_id: `${wig.id}-${selectedColor}-${selectedSize}-${selectedDensity}`,
      quantity: 1,
      price_at_added: wig.price,
      name: `${nameOnly} ${selectedSize}″`,
      image_url: wig.img,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <section className="container-pad" style={{
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
      borderBottom: '3px solid #FF7A1A',
      position: 'relative',
      background: `
        repeating-linear-gradient(135deg, transparent 0 80px, rgba(212,255,62,.04) 80px 82px),
        #0E1B14
      `,
    }}>
      <div
        className="row-grid row-1-15"
        style={{ gap: 'clamp(24px, 5vw, 60px)', alignItems: 'start' }}
      >
        {/* ═══ Stage gauche : polaroïd principal + 3 thumbs + stamps ═══ */}
        <FpStage wig={wig} thumbs={otherWigs} />

        {/* ═══ Info droite ═══ */}
        <div>
          {/* Eyebrow tags */}
          <div style={{
            display: 'inline-flex', gap: 8, alignItems: 'center',
            flexWrap: 'wrap', marginBottom: 18,
          }}>
            <Tag>{tagLabel(wig.tag)}</Tag>
            <Tag variant="lime">{refCode(wig)}</Tag>
            <Tag variant="outline">{wig.swatches.length} coloris</Tag>
          </div>

          {/* H1 nom + taille + ″ */}
          <h1 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(72px,9vw,140px)',
            lineHeight: 0.85, textTransform: 'uppercase',
            color: '#F4ECD8', letterSpacing: '-0.01em',
          }}>
            {nameOnly}
            <br />
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', fontWeight: 400, textTransform: 'none',
              color: '#D4FF3E', display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>
              {selectedSize}
            </em>
            <span style={{
              background: '#FF7A1A', color: '#0A0A0A',
              padding: '0 0.08em', display: 'inline-block',
            }}>″</span>
          </h1>

          {/* Deck */}
          <p style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 17, lineHeight: 1.5,
            marginTop: 18, maxWidth: 480, color: '#F4ECD8',
          }}>
            {wig.style} {wig.length}″ teinte <em style={{ fontStyle: 'normal', color: '#FF7A1A' }}>{wig.tone.toLowerCase()}</em>. Lace front HD invisible, baby hair pré-épilé.
            Cheveux{' '}
            <span style={{ background: '#F5E55E', color: '#0A0A0A', padding: '0 4px' }}>Remy</span>
            {' '}100% humains, densité {selectedDensity}%, calotte 13×4 respirante. Garantie 12 mois, retour 30 jours.
          </p>

          {/* Price strip */}
          <div style={{
            marginTop: 28, display: 'flex', alignItems: 'flex-end',
            gap: 16, flexWrap: 'wrap', padding: '18px 0',
            borderTop: '3px dashed #D4FF3E',
            borderBottom: '3px dashed #D4FF3E',
          }}>
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 80, lineHeight: 1,
              color: '#F4ECD8', letterSpacing: '-0.02em',
            }}>
              {wig.price}
              <span style={{ color: '#FF7A1A' }}>€</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-permanent-marker),cursive',
              fontSize: 26, color: '#5E6A64',
              textDecoration: 'line-through',
              textDecorationColor: '#FF7A1A',
              textDecorationThickness: 4,
            }}>
              {wasPrice}€
            </div>
            {wig.rating != null && wig.reviews != null && (
              <div style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-vt323),monospace',
                fontSize: 22, color: '#D4FF3E',
              }}>
                ★★★★★ <b style={{
                  color: '#F4ECD8',
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 16, fontWeight: 400,
                }}>{wig.rating.toFixed(1)}</b> · {wig.reviews} avis
              </div>
            )}
          </div>

          {/* Coloris */}
          <OptionGroup
            title="Coloris"
            note={`// ${wig.tone} · N°${selectedColor + 1}`}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {wig.swatches.map((color, i) => (
                <ColorChip
                  key={i}
                  color={color}
                  active={selectedColor === i}
                  onClick={() => setSelectedColor(i)}
                />
              ))}
            </div>
          </OptionGroup>

          {/* Longueur */}
          <OptionGroup
            title="Longueur"
            note={`// ${selectedSize} pouces`}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIZES_AVAILABLE.map((size) => (
                <SizeChip
                  key={size}
                  active={selectedSize === size}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}″
                </SizeChip>
              ))}
            </div>
          </OptionGroup>

          {/* Densité */}
          <OptionGroup
            title="Densité"
            note={`// ${selectedDensity}% — ${DENSITIES.find(d => d.value === selectedDensity)?.note ?? ''}`}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DENSITIES.map((d) => (
                <SizeChip
                  key={d.value}
                  active={selectedDensity === d.value}
                  onClick={() => setSelectedDensity(d.value)}
                >
                  {d.label}
                </SizeChip>
              ))}
            </div>
          </OptionGroup>

          {/* Actions */}
          <div style={{
            marginTop: 26, display: 'flex', gap: 14, flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-bold"
            >
              {added ? '✓ Ajouté' : '→ Ajouter au sac'}
            </button>
            <Link href="/essayage" className="btn-bold orange">
              ▶ Essayage live
            </Link>
            <button
              type="button"
              className="btn-bold outline"
              aria-label="Ajouter aux souhaits"
              title="Ajouter aux souhaits"
            >
              ♡
            </button>
          </div>

          {/* Feature list */}
          <div style={{ marginTop: 32 }}>
            {FEATURES.map((f) => (
              <FeatureRow key={f.key} k={f.key} v={f.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══ Sous-composants ════════════════════════════════

function FpStage({ wig, thumbs }: { wig: Wig; thumbs: Wig[] }) {
  const thumbPositions: Array<{ bottom: number; right: number; rotate: string; z: number }> = [
    { bottom: 60,  right: 30,  rotate: '6deg',  z: 3 },
    { bottom: 160, right: 120, rotate: '-4deg', z: 3 },
    { bottom: 30,  right: 170, rotate: '9deg',  z: 3 },
  ];

  return (
    <div style={{ position: 'relative', height: 720 }}>
      {/* Stamp COVER · ISSUE 01 (top right) */}
      <div style={{
        position: 'absolute', top: 30, right: 30,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14, letterSpacing: '0.1em',
        border: '3px solid #FF7A1A', color: '#FF7A1A',
        padding: '8px 14px',
        transform: 'rotate(-12deg)',
        background: 'rgba(14,27,20,.7)',
        zIndex: 5,
      }}>
        COVER · ISSUE 01
      </div>

      {/* Stamp ★ HOT ★ (left middle) */}
      <div style={{
        position: 'absolute', bottom: 200, left: -20,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14, letterSpacing: '0.1em',
        border: '3px solid #D4FF3E', color: '#D4FF3E',
        padding: '8px 14px',
        transform: 'rotate(8deg)',
        background: 'rgba(14,27,20,.7)',
        zIndex: 5,
      }}>
        ★ HOT ★
      </div>

      {/* Sticker "Tirée à la main" */}
      <div style={{
        position: 'absolute', top: 300, left: -20,
        background: '#F5E55E', color: '#0A0A0A',
        padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 12, border: '2px solid #0A0A0A',
        transform: 'rotate(-22deg)',
        boxShadow: '2px 3px 0 #0A0A0A',
        zIndex: 6,
      }}>
        Tirée à la main
      </div>

      {/* Polaroïd principal */}
      <div style={{
        position: 'absolute', top: 0, left: 30,
        width: '80%',
        background: '#F4ECD8',
        padding: '18px 18px 60px',
        transform: 'rotate(-3deg)',
        boxShadow: '8px 10px 0 #0A0A0A',
        zIndex: 2,
      }}>
        <div style={{
          background: '#0A0A0A',
          aspectRatio: '4/5',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wig.img}
            alt={`${wig.name} — vue principale`}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'contrast(1.05) saturate(1.05)',
            }}
          />
        </div>
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 28, lineHeight: 1, color: '#0A0A0A',
          }}>
            {wig.num} · {wig.name.replace(/\s*\d+"$/, '').trim()}
          </div>
          <small style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12, color: '#5E6A64', letterSpacing: '0.06em',
          }}>
            {wig.length}″ — {wig.tone}
          </small>
        </div>
      </div>

      {/* 3 thumbs polaroïds */}
      {thumbs.map((t, i) => {
        const pos = thumbPositions[i]!;
        return (
          <div
            key={t.id}
            style={{
              position: 'absolute',
              bottom: pos.bottom, right: pos.right,
              background: '#F4ECD8',
              padding: 8,
              transform: `rotate(${pos.rotate})`,
              boxShadow: '4px 5px 0 #0A0A0A',
              zIndex: pos.z,
            }}
          >
            <Link href={`/perruque/${t.id}`} style={{ display: 'block', textDecoration: 'none' }} aria-label={`Voir ${t.name}`}>
              <div style={{
                background: '#0A0A0A',
                width: 90, height: 110,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.img}
                  alt={t.name}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    filter: 'contrast(1.05) saturate(1.05)',
                  }}
                  loading="lazy"
                />
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function Tag({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'lime' | 'outline';
}) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-special-elite),monospace',
    fontSize: 11, letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    transform: 'rotate(-2deg)',
    display: 'inline-block',
  };
  const variants: Record<string, CSSProperties> = {
    default: { background: '#F5E55E', color: '#0A0A0A' },
    lime:    { background: '#D4FF3E', color: '#0A0A0A' },
    outline: { background: 'transparent', color: '#F4ECD8', border: '2px solid #F4ECD8' },
  };
  return <span style={{ ...base, ...variants[variant] }}>{children}</span>;
}

function OptionGroup({ title, note, children }: {
  title: string; note: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={{
        display: 'inline-block',
        fontFamily: 'var(--font-permanent-marker),cursive',
        color: '#D4FF3E', fontSize: 18,
        transform: 'rotate(-2deg)', marginBottom: 10,
      }}>
        {title}
        <small style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 11, color: '#F4ECD8',
          letterSpacing: '0.1em', marginLeft: 8, textTransform: 'uppercase',
        }}>
          {note}
        </small>
      </h4>
      {children}
    </div>
  );
}

function ColorChip({ color, active, onClick }: {
  color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Coloris ${color}`}
      aria-pressed={active}
      style={{
        width: 52, height: 52, borderRadius: '50%',
        border: active ? '3px solid #D4FF3E' : '3px solid #F4ECD8',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform .12s',
        background: color,
        boxShadow: active ? '0 0 0 3px #0A0A0A, 0 0 0 6px #D4FF3E' : undefined,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(-4deg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
    />
  );
}

function SizeChip({ children, active, onClick }: {
  children: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14,
        background: active ? '#D4FF3E' : 'transparent',
        border: '3px solid ' + (active ? '#D4FF3E' : '#F4ECD8'),
        color: active ? '#0A0A0A' : '#F4ECD8',
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'all .12s',
        transform: active ? 'rotate(-2deg)' : 'rotate(0deg)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#F4ECD8';
          e.currentTarget.style.color = '#0A0A0A';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#F4ECD8';
        }
      }}
    >
      {children}
    </button>
  );
}

function FeatureRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
      gap: 14, alignItems: 'center',
      padding: '14px 0',
      borderBottom: '2px dashed rgba(255,255,255,.15)',
      fontFamily: 'var(--font-special-elite),monospace', fontSize: 14,
      color: '#F4ECD8',
    }}>
      <b style={{
        background: '#D4FF3E', color: '#0A0A0A',
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '4px 10px', display: 'inline-block',
      }}>
        {k}
      </b>
      <span>{v}</span>
      <span style={{
        fontFamily: 'var(--font-permanent-marker),cursive',
        color: '#FF7A1A', fontSize: 22,
      }}>+</span>
    </div>
  );
}
