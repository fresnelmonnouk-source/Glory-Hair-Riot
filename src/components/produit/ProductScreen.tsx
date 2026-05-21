'use client';

import { useState } from 'react';
import { Orb } from '@/components/shared/Orb';
import { WIGS } from '@/lib/wigs-data';
import type { CartItem } from '@/types/app';

const SIZES = [
  { id: 'XS', cm: '52', stock: true },
  { id: 'S',  cm: '54', stock: true },
  { id: 'M',  cm: '56', stock: true },
  { id: 'L',  cm: '58', stock: true },
  { id: 'XL', cm: '60', stock: false },
];

const COLOR_NAMES: Record<string, string> = {
  'var(--hair-1)': 'Noir Onyx',
  'var(--hair-2)': 'Châtain Espresso',
  'var(--hair-3)': 'Miel Doré',
  'var(--hair-4)': 'Blond Sable',
  'var(--hair-5)': 'Prune Bordeaux',
};

interface ProductScreenProps {
  wig: typeof WIGS[0];
  onAddToCart: (item: CartItem) => void;
  onToggleWishlist: (id: string) => void;
  wishlisted: boolean;
}

export function ProductScreen({ wig, onAddToCart, onToggleWishlist, wishlisted }: ProductScreenProps) {
  const [color, setColor] = useState(wig.swatches[0] ?? 'var(--hair-1)');
  const [size, setSize] = useState('M');

  const handleAddToCart = () => {
    onAddToCart({
      id: wig.id,
      name: wig.name,
      cat: wig.cat,
      style: wig.style,
      price: wig.price,
      color,
      shape: wig.shape,
      qty: 1,
    });
  };

  return (
    <section className="product">
      <div style={{ marginBottom: 24, display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
        <span>Catalogue</span><span>·</span><span>{wig.cat}</span><span>·</span>
        <span style={{ color: 'var(--ink)' }}>{wig.name}</span>
      </div>
      <div className="product-grid">
        <div className="product-stage">
          <Orb color={color} shape={wig.shape} style={{ width: '60%', height: '60%' }} />
          <div className="glass" style={{ position: 'absolute', top: 20, right: 20, padding: '10px 14px', borderRadius: 14, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--gold-deep)', marginRight: 8 }}>●</span>Face
          </div>
          <div className="glass" style={{ position: 'absolute', bottom: 80, left: 20, padding: '8px 14px', borderRadius: 14, fontSize: 12 }}>
            <span style={{ color: '#5a8a4a' }}>● En stock</span> · Exp. 48h
          </div>
        </div>

        <div className="product-info">
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--ink)', color: 'var(--bg-warm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{wig.cat}</span>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--surface)', color: 'var(--ink-soft)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', border: '1px solid var(--line)' }}>Cheveux humains</span>
          </div>

          <h1>{wig.name}</h1>
          <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 10 }}>{wig.style} · Densité 150% · Bébé hairs naturels</div>

          <div className="product-rating">
            <span className="stars">★★★★★</span>
            <span>{wig.rating} ({wig.reviews} avis)</span>
            <span>·</span>
            <span>{Math.round(wig.reviews * 12)} essayages virtuels</span>
          </div>

          <div className="price">
            {wig.price} €
            {wig.was && <span className="price-was">{wig.was} €</span>}
          </div>

          <div className="opt-block">
            <div className="opt-label">
              <span>Coloris</span>
              <strong>{COLOR_NAMES[color] ?? 'Personnalisé'}</strong>
            </div>
            <div className="color-row">
              {wig.swatches.map((c) => (
                <div
                  key={c}
                  className={`color-chip ${color === c ? 'active' : ''}`}
                  style={{ background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${c} 100%, white 30%) 0%, ${c} 60%, color-mix(in srgb, ${c} 100%, black 30%) 100%)` }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="opt-block">
            <div className="opt-label">
              <span>Taille de bonnet</span>
              <strong>{size} · {SIZES.find((s) => s.id === size)?.cm} cm</strong>
            </div>
            <div className="size-row">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  className={`size-btn ${size === s.id ? 'active' : ''} ${!s.stock ? 'oos' : ''}`}
                  onClick={() => s.stock && setSize(s.id)}
                >
                  {s.id}
                </button>
              ))}
            </div>
          </div>

          <div className="product-actions">
            <button className="btn btn-dark" onClick={handleAddToCart}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
              </svg>
              Ajouter au panier · {wig.price}€
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '14px 20px' }}
              onClick={() => onToggleWishlist(wig.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24"
                fill={wishlisted ? 'var(--terracotta)' : 'none'}
                stroke={wishlisted ? 'var(--terracotta)' : 'currentColor'}
                strokeWidth="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
