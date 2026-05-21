'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils/price';

export default function CheckoutPage() {
  const { items, getSubtotal, getTotal } = useCart();
  const [step, setStep] = useState<'address' | 'shipping' | 'payment'>(
    'address'
  );
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Delivery
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',

    // Shipping
    shippingMethod: 'standard',

    // Payment
    paymentMethod: 'stripe',
  });

  const subtotal = getSubtotal();
  const total = getTotal();
  const shipping = total - subtotal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createOrderMutation = trpc.payments.createOrder.useMutation();
  const createStripeMutation = trpc.payments.createStripeIntent.useMutation();
  const createFedaPayMutation = trpc.payments.createFedaPay.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'address') {
      setStep('shipping');
    } else if (step === 'shipping') {
      setStep('payment');
    } else if (step === 'payment') {
      setLoading(true);
      try {
        // Step 1: Create order
        const order = await createOrderMutation.mutateAsync({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          shippingMethod: formData.shippingMethod as 'standard' | 'express',
        });

        // Step 2: Create payment based on method
        if (formData.paymentMethod === 'stripe') {
          const paymentData = await createStripeMutation.mutateAsync({
            orderId: order.orderId,
            amount: order.total,
          });

          // Redirect to Stripe checkout
          window.location.href = `${process.env.NEXT_PUBLIC_APP_URL}/paiement/stripe?clientSecret=${paymentData.clientSecret}`;
        } else if (formData.paymentMethod === 'fedapay') {
          const paymentData = await createFedaPayMutation.mutateAsync({
            orderId: order.orderId,
            phone: formData.phone,
            amount: order.total,
          });

          // Redirect to FedaPay
          window.location.href = paymentData.redirectUrl;
        }
      } catch (error) {
        console.error('Erreur lors du paiement:', error);
        alert(
          error instanceof Error
            ? error.message
            : 'Erreur lors du paiement. Veuillez réessayer.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-ink-soft">Votre panier est vide</p>
        <Link href="/catalogue" className="text-gold hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-normal mb-4">
            Finaliser votre commande
          </h1>

          {/* Step Indicator */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setStep('address')}
              className={`px-4 py-2 rounded-full transition-colors ${
                step === 'address'
                  ? 'bg-gold text-white'
                  : 'bg-surface text-ink-soft hover:bg-bg-deep'
              }`}
            >
              Adresse
            </button>
            <button
              onClick={() => setStep('shipping')}
              className={`px-4 py-2 rounded-full transition-colors ${
                step === 'shipping'
                  ? 'bg-gold text-white'
                  : 'bg-surface text-ink-soft hover:bg-bg-deep'
              }`}
            >
              Livraison
            </button>
            <button
              onClick={() => setStep('payment')}
              className={`px-4 py-2 rounded-full transition-colors ${
                step === 'payment'
                  ? 'bg-gold text-white'
                  : 'bg-surface text-ink-soft hover:bg-bg-deep'
              }`}
            >
              Paiement
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            {/* Address Step */}
            {step === 'address' && (
              <div className="bg-surface border border-line-soft rounded-lg p-8 space-y-6">
                <h2 className="font-serif text-2xl">Adresse de livraison</h2>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Numéro de téléphone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                />

                <input
                  type="text"
                  name="street"
                  placeholder="Rue"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="Ville"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Code postal"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded border border-line-soft focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">Sélectionner un pays</option>
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="SN">Sénégal</option>
                  <option value="CD">République Démocratique du Congo</option>
                  <option value="CI">Côte d'Ivoire</option>
                </select>
              </div>
            )}

            {/* Shipping Step */}
            {step === 'shipping' && (
              <div className="bg-surface border border-line-soft rounded-lg p-8 space-y-6">
                <h2 className="font-serif text-2xl">Mode de livraison</h2>

                <div className="space-y-3">
                  {[
                    {
                      id: 'standard',
                      name: 'Standard (5-7 jours)',
                      price: 990,
                    },
                    {
                      id: 'express',
                      name: 'Express (2-3 jours)',
                      price: 2990,
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-4 border rounded cursor-pointer hover:bg-bg-warm transition-colors"
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={formData.shippingMethod === method.id}
                        onChange={handleInputChange}
                      />
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-ink-soft">
                          {formatPrice(method.price)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <div className="bg-surface border border-line-soft rounded-lg p-8 space-y-6">
                <h2 className="font-serif text-2xl">Moyen de paiement</h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border rounded cursor-pointer hover:bg-bg-warm transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={handleInputChange}
                    />
                    <div>
                      <p className="font-semibold">Stripe (Carte bancaire)</p>
                      <p className="text-sm text-ink-soft">
                        Paiement international sécurisé
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border rounded cursor-pointer hover:bg-bg-warm transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="fedapay"
                      checked={formData.paymentMethod === 'fedapay'}
                      onChange={handleInputChange}
                    />
                    <div>
                      <p className="font-semibold">FedaPay (Afrique de l'Ouest)</p>
                      <p className="text-sm text-ink-soft">
                        Paiement mobile et portefeuille
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {step !== 'address' && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'shipping') setStep('address');
                    if (step === 'payment') setStep('shipping');
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border-2 border-gold text-gold hover:bg-gold hover:text-white transition-colors font-semibold"
                >
                  Précédent
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-gold text-white hover:shadow-lg transition-all font-semibold disabled:opacity-50"
              >
                {loading
                  ? 'Traitement...'
                  : step === 'payment'
                    ? `Payer ${formatPrice(total)}`
                    : 'Continuer'}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="bg-surface border border-line-soft rounded-lg p-6 h-fit sticky top-8">
            <h2 className="font-serif text-xl mb-6">Résumé commande</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-line-soft max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price_at_added * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-line-soft">
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

            <div className="flex justify-between mb-6">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-semibold text-gold">
                {formatPrice(total)}
              </span>
            </div>

            <div className="text-xs text-ink-mute space-y-2">
              <p>✓ Paiement sécurisé</p>
              <p>✓ RGPD-compliant</p>
              <p>✓ Livraison garantie</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
