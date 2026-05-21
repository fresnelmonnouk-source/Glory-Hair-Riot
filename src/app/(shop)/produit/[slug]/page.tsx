'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useCartStore } from '@/stores/cart.store';
import { formatPrice } from '@/lib/utils/price';

interface Props {
  params: { slug: string };
}

export default function ProductPage({ params }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({
    slug: params.slug,
  });

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      wig_id: product.id,
      variant_id: selectedVariantId,
      quantity,
      price_at_added: product.base_price,
      name: product.name,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ink-soft">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-ink-soft">Produit non trouvé</p>
        <Link href="/catalogue" className="text-gold hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const mainImage = product.images?.[0];

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-ink-soft">
          <Link href="/catalogue" className="hover:text-gold">
            Catalogue
          </Link>
          {' / '}
          <span>{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {mainImage && (
              <div className="bg-surface rounded-lg overflow-hidden border border-line-soft h-96">
                <img
                  src={mainImage.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: any) => (
                  <div
                    key={img.id}
                    className="bg-surface rounded border border-line-soft h-24 cursor-pointer hover:border-gold transition-colors"
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-start">
            <h1 className="text-4xl font-serif font-normal mb-2 tracking-tight">
              {product.name}
            </h1>

            <p className="text-ink-soft mb-6">{product.category}</p>

            <div className="mb-8">
              <p className="text-sm text-ink-mute mb-2">Prix</p>
              <p className="text-3xl font-semibold text-gold">
                {formatPrice(product.base_price)}
              </p>
            </div>

            {product.description && (
              <div className="mb-8 pb-8 border-b border-line-soft">
                <p className="text-ink-soft">{product.description}</p>
              </div>
            )}

            {product.long_description && (
              <div className="mb-8 pb-8 border-b border-line-soft">
                <h3 className="font-serif text-lg mb-3">Détails</h3>
                <p className="text-ink-soft text-sm leading-relaxed">
                  {product.long_description}
                </p>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-ink mb-3">Variante</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedVariantId === variant.id
                          ? 'bg-gold text-white border-gold'
                          : 'border-line-soft hover:border-gold'
                      }`}
                    >
                      {variant.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-ink mb-3">Quantité</p>
              <div className="flex items-center gap-4 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 rounded border border-line-soft hover:border-gold transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock_quantity || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-line-soft rounded px-2 py-2"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 rounded border border-line-soft hover:border-gold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full px-8 py-4 rounded-full bg-gold text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                disabled={product.stock_quantity === 0}
              >
                {added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
              </button>

              <Link
                href="/essayage"
                className="block text-center px-8 py-4 rounded-full border-2 border-gold text-gold hover:bg-gold hover:text-white transition-colors font-semibold"
              >
                Essayer virtuellement
              </Link>
            </div>

            {product.stock_quantity === 0 && (
              <p className="text-red-600 text-sm mt-4">Rupture de stock</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
