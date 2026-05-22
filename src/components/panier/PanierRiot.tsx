'use client';

/**
 * Page Panier RIOT — port fidèle <section class="cart"> Riot.html (2497-2553)
 * + CSS lignes 1436-1496.
 *
 * Composant client (Zustand cart store, quantité, promo, total dynamiques).
 */

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart.store';
import { WIG_BY_ID } from '@/lib/wigs-data';

const TVA_RATE = 0.20; // 20% TVA française, incluse dans price_at_added

// Parse variant_id encodé "{wigId}-{colorIdx}-{size}-{density}"
function parseVariant(variantId: string | null): { color?: number; size?: number; density?: number } {
  if (!variantId) return {};
  const parts = variantId.split('-');
  if (parts.length < 4) return {};
  const color = parseInt(parts[parts.length - 3]!, 10);
  const size = parseInt(parts[parts.length - 2]!, 10);
  const density = parseInt(parts[parts.length - 1]!, 10);
  return {
    color: Number.isFinite(color) ? color : undefined,
    size: Number.isFinite(size) ? size : undefined,
    density: Number.isFinite(density) ? density : undefined,
  };
}

function metaLine(item: CartItem): string {
  const variant = parseVariant(item.variant_id);
  const wig = WIG_BY_ID[item.wig_id];
  const tone = wig?.tone ?? '—';
  const size = variant.size ?? wig?.length ?? '?';
  const density = variant.density ?? 180;
  return `${tone} · ${size}″ · ${density}%`;
}

export function PanierRiot() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const [promo, setPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);

  const tva = Math.round((subtotal * TVA_RATE / (1 + TVA_RATE)) * 100) / 100; // TVA déduite du TTC
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  function applyPromo() {
    if (!promo.trim()) return;
    // Stub : aucun code promo valide pour l'instant
    setPromoFeedback('Code invalide — campagne pas encore active.');
    setTimeout(() => setPromoFeedback(null), 3000);
  }

  // ─── Empty state ────────────────────────────────────
  if (items.length === 0) {
    return (
      <section style={{
        padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
        borderBottom: '3px solid #D4FF3E',
        minHeight: '60vh',
      }}>
        <Head totalQty={0} subtotal={0} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 24, marginTop: 60,
        }}>
          <div style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 56, color: '#D4FF3E',
            transform: 'rotate(-2deg)',
          }}>
            Ton sac est <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', color: '#FF7A1A',
            }}>vide.</em>
          </div>
          <p style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 16, color: '#F4ECD8', maxWidth: 420, lineHeight: 1.5,
          }}>
            Pas encore de pièce choisie. 6 perruques tirées brin par brin t&apos;attendent dans Issue N°01.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/catalogue" className="btn-bold">
              → Voir le catalogue
            </Link>
            <Link href="/essayage" className="btn-bold orange">
              ▶ Essayer une perruque
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ─── Filled cart ────────────────────────────────────
  return (
    <section className="container-pad" style={{
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
      borderBottom: '3px solid #D4FF3E',
    }}>
      <Head totalQty={totalQty} subtotal={subtotal} />

      <div
        className="row-grid row-15-1"
        style={{ gap: 'clamp(24px, 3vw, 40px)', alignItems: 'start' }}
      >
        {/* ═══ Liste des items ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((item, i) => (
            <CartRow
              key={item.id}
              item={item}
              index={i}
              onInc={() => updateQuantity(item.id, item.quantity + 1)}
              onDec={() => {
                if (item.quantity <= 1) removeItem(item.id);
                else updateQuantity(item.id, item.quantity - 1);
              }}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        {/* ═══ Summary sticky ═══ */}
        <div style={{
          background: '#F4ECD8', color: '#0A0A0A',
          border: '3px solid #0A0A0A', padding: 24,
          transform: 'rotate(1deg)',
          boxShadow: '6px 6px 0 #FF7A1A',
          position: 'sticky', top: 120,
        }}>
          <h3 style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 28, color: '#0A0A0A', marginBottom: 14,
            position: 'relative',
          }}>
            Récap.
            <span aria-hidden style={{
              display: 'block', width: '60%', height: 4,
              background: '#0A0A0A', marginTop: 6, transform: 'rotate(-1deg)',
            }} />
          </h3>

          <SummaryRow label="Sous-total" value={`${subtotal.toFixed(2).replace('.', ',')} €`} />
          <SummaryRow label="Livraison 48h" valueComponent={
            <span style={{
              background: '#D4FF3E', color: '#0A0A0A',
              padding: '2px 8px',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 11,
            }}>★ GRATUITE</span>
          } />
          <SummaryRow label="TVA incluse" value={`${tva.toFixed(2).replace('.', ',')} €`} />

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '3px dashed #0A0A0A',
            marginTop: 8, paddingTop: 14,
            fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 24,
          }}>
            <span>TOTAL</span>
            <span style={{
              background: '#FF7A1A', color: '#0A0A0A',
              padding: '4px 10px', transform: 'rotate(-2deg)',
              display: 'inline-block',
            }}>
              {Math.round(subtotal)}€
            </span>
          </div>

          <Link
            href="/checkout"
            className="btn-bold orange full"
            style={{ marginTop: 18 }}
          >
            → COMMANDER
          </Link>

          {/* Promo */}
          <div style={{ marginTop: 14 }}>
            <form
              onSubmit={(e) => { e.preventDefault(); applyPromo(); }}
              style={{ display: 'flex', gap: 6 }}
            >
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="CODE PROMO"
                aria-label="Code promo"
                style={{
                  flex: 1, border: '2px solid #0A0A0A',
                  padding: 10, fontFamily: 'var(--font-special-elite),monospace',
                  fontSize: 13, outline: 'none',
                  background: '#F4ECD8', color: '#0A0A0A',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#0A0A0A', color: '#D4FF3E',
                  padding: '10px 14px', border: 0, cursor: 'pointer',
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 11, letterSpacing: '0.1em',
                }}
              >
                OK
              </button>
            </form>
            {promoFeedback && (
              <div style={{
                marginTop: 8,
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#FF3D00',
              }}>
                {promoFeedback}
              </div>
            )}
          </div>

          {/* Stamps */}
          <div style={{
            marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {['★ Retour 30j', '3× sans frais', 'Garantie 12 mois'].map((s) => (
              <span key={s} style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 8px', border: '2px dashed #0A0A0A',
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══ Sub-components ═══════════════════════════════

function Head({ totalQty, subtotal }: { totalQty: number; subtotal: number }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      borderBottom: '3px dashed #D4FF3E',
      paddingBottom: 28, marginBottom: 32, flexWrap: 'wrap', gap: 18,
    }}>
      <h2 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 'clamp(72px,9vw,140px)',
        lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
      }}>
        VOTRE{' '}
        <span style={{
          background: '#FF7A1A', color: '#0A0A0A',
          padding: '0 0.08em', display: 'inline-block',
          transform: 'rotate(-1deg)',
        }}>
          SAC.
        </span>
      </h2>
      {totalQty > 0 && (
        <div style={{
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 14, letterSpacing: '0.1em',
          border: '3px solid #D4FF3E', color: '#D4FF3E',
          padding: '8px 14px', transform: 'rotate(-4deg)',
        }}>
          {totalQty} PIÈCE{totalQty > 1 ? 'S' : ''} · {Math.round(subtotal)}€
        </div>
      )}
    </div>
  );
}

function CartRow({ item, index, onInc, onDec, onRemove }: {
  item: CartItem; index: number;
  onInc: () => void; onDec: () => void; onRemove: () => void;
}) {
  const wig = WIG_BY_ID[item.wig_id];
  const rotations = ['-0.5deg', '0.7deg', '-0.3deg', '0.5deg'];
  const shadows = ['#D4FF3E', '#FF7A1A', '#FF4D8D', '#F5E55E'];
  const tapeColors = [
    'repeating-linear-gradient(45deg,rgba(212,255,62,.7) 0 8px,rgba(212,255,62,.4) 8px 16px)',
    'rgba(255,122,26,.7)',
    'rgba(255,77,141,.6)',
    'rgba(245,229,94,.7)',
  ];
  const rotate = rotations[index % rotations.length];
  const shadow = shadows[index % shadows.length];
  const tape = tapeColors[index % tapeColors.length];

  return (
    <div className="cart-row" style={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr auto auto auto',
      gap: 18,
      alignItems: 'center',
      background: '#F4ECD8', color: '#0A0A0A',
      padding: 14, border: '3px solid #0A0A0A',
      transform: `rotate(${rotate})`,
      boxShadow: `4px 4px 0 ${shadow}`,
      position: 'relative',
    }}>
      {/* Tape */}
      <span aria-hidden style={{
        position: 'absolute', top: -12, left: 14,
        width: 90, height: 22, background: tape,
        borderLeft: '1px dashed rgba(0,0,0,.3)',
        borderRight: '1px dashed rgba(0,0,0,.3)',
        transform: 'rotate(-3deg)',
        display: 'block',
      }} />

      {/* Photo */}
      <div style={{
        width: 110, height: 130,
        background: '#0A0A0A', position: 'relative',
        overflow: 'hidden', border: '2px solid #0A0A0A',
      }}>
        {item.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image_url}
            alt={item.name ?? wig?.name ?? 'Perruque'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{
          position: 'absolute', top: 4, left: 6,
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 20, color: '#F4ECD8',
          textShadow: '2px 2px 0 #0A0A0A',
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 24, lineHeight: 1, color: '#0A0A0A',
        }}>
          {wig?.name.replace(/\s*\d+"$/, '').trim() ?? item.name ?? 'Perruque'}{' '}
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', color: '#FF7A1A',
          }}>
            {parseVariant(item.variant_id).size ?? wig?.length ?? ''}″
          </em>
        </div>
        <div style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 12, color: '#5E6A64', letterSpacing: '0.04em', marginTop: 6,
        }}>
          {metaLine(item)}
        </div>
      </div>

      {/* Qty */}
      <div style={{
        display: 'flex', border: '2px solid #0A0A0A',
        fontFamily: 'var(--font-rubik-mono-one),monospace',
      }}>
        <button
          type="button" onClick={onDec}
          aria-label="Diminuer la quantité"
          style={qtyBtn}
        >−</button>
        <span style={{
          padding: '8px 14px',
          borderLeft: '2px solid #0A0A0A',
          borderRight: '2px solid #0A0A0A',
          fontSize: 14,
        }}>{item.quantity}</span>
        <button
          type="button" onClick={onInc}
          aria-label="Augmenter la quantité"
          style={qtyBtn}
        >+</button>
      </div>

      {/* Price */}
      <div style={{
        background: '#D4FF3E', color: '#0A0A0A',
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 22, padding: '6px 12px',
        transform: 'rotate(-2deg)', display: 'inline-block',
      }}>
        {item.price_at_added * item.quantity}€
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer cet article"
        title="Retirer"
        style={{
          background: 'transparent', border: '2px solid #0A0A0A',
          width: 32, height: 32, cursor: 'pointer',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 14, color: '#0A0A0A',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}

const qtyBtn: CSSProperties = {
  padding: '8px 12px',
  fontSize: 14,
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  color: '#0A0A0A',
  fontFamily: 'inherit',
};

function SummaryRow({ label, value, valueComponent }: {
  label: string;
  value?: string;
  valueComponent?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', fontFamily: 'var(--font-special-elite),monospace',
      fontSize: 14,
    }}>
      <span>{label}</span>
      <span>{valueComponent ?? value}</span>
    </div>
  );
}
