'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils/price';
import { cn } from '@/lib/utils/cn';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } =
    useCart();

  const subtotal = getSubtotal();
  const total = getTotal();
  const shipping = total - subtotal;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif font-normal mb-12">Votre panier</h1>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-line-soft rounded-lg p-6 bg-surface"
                >
                  <div className="flex gap-6">
                    {/* Image Placeholder */}
                    <div className="w-24 h-24 bg-bg-deep rounded border border-line-soft flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-mute text-xs">
                          Pas d'image
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow">
                      <h3 className="font-serif text-lg mb-2">{item.name}</h3>

                      <p className="text-sm text-ink-soft mb-4">
                        {formatPrice(item.price_at_added)} par unité
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 w-fit">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity === 1}
                          className={cn(
                            'px-2 py-1 text-sm border rounded',
                            item.quantity === 1
                              ? 'text-ink-mute cursor-not-allowed'
                              : 'hover:border-gold'
                          )}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-2 py-1 text-sm border rounded hover:border-gold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-semibold text-gold">
                        {formatPrice(item.price_at_added * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border border-line-soft rounded-lg p-6 bg-surface h-fit sticky top-8">
              <h2 className="font-serif text-xl mb-6">Résumé commande</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-line-soft">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Livraison</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Gratuite</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-semibold text-gold">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="block w-full px-4 py-3 rounded-full bg-gold text-white font-semibold text-center hover:shadow-lg transition-all"
              >
                Procéder au paiement
              </Link>

              <Link
                href="/catalogue"
                className="block w-full mt-3 px-4 py-3 rounded-full border-2 border-gold text-gold text-center hover:bg-gold hover:text-white transition-colors font-semibold"
              >
                Continuer mes achats
              </Link>

              {subtotal < 15000 && (
                <p className="text-xs text-ink-soft text-center mt-4">
                  Livraison gratuite à partir de {formatPrice(15000)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-ink-soft mb-6">Votre panier est vide</p>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold text-white font-semibold hover:shadow-lg transition-all"
            >
              Découvrir le catalogue
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14m-6-7 7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
