'use client';

import { useState } from 'react';

/* Port structurel 1:1 de sandy-stylish/src/components/product/product-gallery.tsx
   (image principale aspect-[4/5] + miniatures cliquables). GloryHairRiot n'a
   qu'une photo par perruque actuellement (source wigs-data.ts) — la rangée de
   miniatures reste inerte tant qu'un seul visuel existe, comme chez Sandy pour
   un produit à photo unique (images.length > 1). */

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, var(--accent-hi), var(--accent-deep))' }} />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={alt} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => {
            const isActive = i === active;
            return (
              <button
                key={url + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Voir la photo ${i + 1}`}
                aria-current={isActive}
                className="relative aspect-square w-16 flex-none overflow-hidden rounded-sm border transition-colors sm:w-[72px]"
                style={{ borderColor: isActive ? 'var(--border-accent)' : 'var(--border-hairline)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
