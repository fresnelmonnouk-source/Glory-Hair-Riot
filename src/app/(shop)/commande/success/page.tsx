'use client';

import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-bg-warm to-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <p className="text-6xl mb-4">✓</p>
          <h1 className="text-4xl font-serif font-normal tracking-tight mb-4">
            Commande confirmée!
          </h1>
        </div>

        <p className="text-lg text-ink-soft mb-8">
          Merci pour votre achat! Vous recevrez bientôt un email avec les
          détails de votre commande et le suivi de la livraison.
        </p>

        <div className="space-y-3 mb-12">
          <p className="text-sm text-ink-mute">
            Un numéro de commande vous a été envoyé par email.
          </p>
          <p className="text-sm text-ink-mute">
            Vous pouvez suivre votre livraison depuis votre compte.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/catalogue"
            className="flex-1 px-6 py-3 rounded-full border-2 border-gold text-gold hover:bg-gold hover:text-white transition-colors font-semibold"
          >
            Continuer vos achats
          </Link>

          <Link
            href="/"
            className="flex-1 px-6 py-3 rounded-full bg-gold text-white hover:shadow-lg transition-all font-semibold"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
