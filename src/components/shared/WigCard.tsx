'use client';

import { useState } from 'react';
import { Orb } from './Orb';
import type { Wig } from '@/lib/wigs-data';

interface WigCardProps {
  wig: Wig;
  onClick: () => void;
  wishlisted?: boolean;
  onToggleWishlist?: (wigId: string) => void;
}

export function WigCard({ wig, onClick, wishlisted = false, onToggleWishlist }: WigCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="wig-card"
      style={{ '--orb-color': wig.color } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {wig.tag && (
        <div className={`wig-tag ${wig.tag === 'new' ? 'new' : wig.tag === 'sale' ? 'sale' : ''}`}>
          {wig.tag === 'new' ? 'Nouveau' : wig.tag === 'sale' ? 'Promo' : 'Best'}
        </div>
      )}

      {onToggleWishlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(wig.id);
          }}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 6,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--line-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--sh-1)',
            transition: 'transform .2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title={wishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={wishlisted ? 'var(--terracotta)' : 'none'}
            stroke={wishlisted ? 'var(--terracotta)' : 'var(--ink-mute)'}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}

      <div className="wig-card-stage">
        <Orb color={wig.color} shape={wig.shape} rotation={hover ? -4 : 0} />
      </div>
      <div className="wig-name">{wig.name}</div>
      <div className="wig-meta">
        <span>
          {wig.cat} · {wig.style}
        </span>
        <span className="wig-price">
          {wig.was && (
            <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 6, fontSize: 12 }}>
              {wig.was}€
            </span>
          )}
          {wig.price}€
        </span>
      </div>
      <div className="wig-swatches">
        {wig.swatches.map((c, i) => (
          <div key={i} className="swatch" style={{ background: c }}></div>
        ))}
      </div>
    </div>
  );
}
