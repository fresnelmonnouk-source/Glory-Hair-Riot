'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { formatPrice } from '@/lib/utils/price';
import { cn } from '@/lib/utils/cn';

export default function CataloguePage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const { data: productsData, isLoading: productsLoading } =
    trpc.products.list.useQuery({
      page,
      limit: 12,
      category,
      search: search || undefined,
    });

  const { data: categories } = trpc.products.getCategories.useQuery();

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ink-soft">Chargement du catalogue...</div>
      </div>
    );
  }

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-bg-warm to-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-serif font-normal mb-4 tracking-tight">
            Notre catalogue
          </h1>
          <p className="text-lg text-ink-soft">
            Découvrez notre collection premium de perruques
          </p>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Rechercher une perruque..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 rounded-lg border border-line-soft bg-surface placeholder-ink-mute text-ink focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category || ''}
              onChange={(e) => {
                setCategory(e.target.value || undefined);
                setPage(1);
              }}
              className="w-full px-4 py-3 rounded-lg border border-line-soft bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Toutes les catégories</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {products.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/produit/${product.slug}`}
                  className="group"
                >
                  <div className="relative bg-surface rounded-lg overflow-hidden border border-line-soft hover:border-gold transition-colors mb-4 h-64">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-bg-deep flex items-center justify-center text-ink-mute">
                        Pas d'image
                      </div>
                    )}
                    {product.featured && (
                      <div className="absolute top-4 right-4 bg-gold text-white px-3 py-1 rounded-full text-xs font-semibold">
                        En vedette
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-serif mb-2 group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink-soft">{product.category}</p>
                    <p className="text-lg font-semibold text-gold">
                      {formatPrice(product.base_price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={cn(
                    'px-4 py-2 rounded-lg border border-line-soft transition-colors',
                    page === 1
                      ? 'text-ink-mute cursor-not-allowed'
                      : 'hover:bg-gold hover:text-white hover:border-gold'
                  )}
                >
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'px-3 py-2 rounded-lg border transition-colors',
                        p === page
                          ? 'bg-gold text-white border-gold'
                          : 'border-line-soft hover:border-gold'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'px-4 py-2 rounded-lg border border-line-soft transition-colors',
                    page === totalPages
                      ? 'text-ink-mute cursor-not-allowed'
                      : 'hover:bg-gold hover:text-white hover:border-gold'
                  )}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-ink-soft">
              Aucun produit trouvé. Essayez d'ajuster vos filtres.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
