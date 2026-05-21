'use client';

import { useState } from 'react';
import { WigCard } from '@/components/shared/WigCard';
import { WIGS } from '@/lib/wigs-data';
import type { Route } from '@/types/app';

const CATEGORIES = ['all', 'Lace Front', 'Full Lace', '360 Lace', 'Closure', 'Headband'];

interface CatalogScreenProps {
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onGoProduct: (wig: typeof WIGS[0]) => void;
  setRoute: (r: Route) => void;
}

export function CatalogScreen({ wishlistIds, onToggleWishlist, onGoProduct }: CatalogScreenProps) {
  const [activeCat, setActiveCat] = useState('all');
  const filtered = activeCat === 'all' ? WIGS : WIGS.filter((w) => w.cat === activeCat);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Catalogue · {filtered.length} pièces</div>
          <h2>Toute la <span className="italic" style={{ color: 'var(--gold-deep)' }}>collection</span></h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={activeCat === c ? 'btn btn-dark btn-sm' : 'btn btn-ghost btn-sm'}
            >
              {c === 'all' ? 'Tout' : c}
            </button>
          ))}
        </div>
      </div>
      <div className="wig-grid">
        {filtered.map((w) => (
          <WigCard
            key={w.id} wig={w}
            onClick={() => onGoProduct(w)}
            wishlisted={wishlistIds.includes(w.id)}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>
    </section>
  );
}
