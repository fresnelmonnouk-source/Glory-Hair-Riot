'use client';

/* Port structurel 1:1 de sandy-stylish/.../commande/confirmation
   (IconBadge check + eyebrow/display + bandeau infos + récap bordé).
   Sandy relit la vraie commande en base (service_role) ; GloryHairRiot
   n'a qu'une référence passée en query param (paiement mocké, pas de
   lookup réel possible) — logique de vidage panier + contenu inchangés. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { IconBadge } from '@/components/auth/ui';
import { useLang } from '@/i18n/client';

export default function MerciPage() {
  return (
    <Suspense fallback={null}>
      <MerciContent />
    </Suspense>
  );
}

function MerciContent() {
  const params = useSearchParams();
  const lang = useLang();
  const ref = params?.get('ref') ?? 'GH-XXXX';
  const clear = useCartStore((s) => s.clear);

  // Vider le panier après confirmation (stub — Phase 5 : confirmer via webhook avant)
  useEffect(() => { clear(); }, [clear]);

  return (
    <section className="mx-auto max-w-[820px] px-6 py-16 text-center md:px-11 md:py-24">
      <IconBadge icon="check" size="lg" />
      <p className="eyebrow mt-6">Commande confirmée</p>
      <h1 className="display mt-4 text-4xl text-ink md:text-5xl">Merci beauté.</h1>
      <p className="mx-auto mt-4 max-w-prose leading-relaxed text-muted">
        Votre commande <b className="text-ink">#{ref}</b> est partie en atelier. Vous allez recevoir un mail
        de confirmation dans quelques minutes. Livraison sous 48h en France métropolitaine.
      </p>

      <div className="mt-10 rounded-lg border border-hairline bg-app p-6 text-left">
        <p className="eyebrow">Bonus Glory Club</p>
        <p className="mt-3 leading-relaxed text-muted">
          Vous venez de débloquer <b className="text-accent">+50 points</b> et vos{' '}
          <b className="text-accent">2 essais Premium</b> dès la création de votre compte.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href={`/${lang}/connexion`} className="rounded-[2px] bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          Activer mon compte
        </Link>
        <Link href={`/${lang}/catalogue`} className="rounded-[2px] border border-line px-7 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] hover:text-accent">
          Continuer mes achats
        </Link>
      </div>
    </section>
  );
}
