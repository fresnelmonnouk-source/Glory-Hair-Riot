'use client';

/* Port structurel 1:1 de sandy-stylish/.../commande/confirmation
   (IconBadge check + eyebrow/display + bandeau infos + récap bordé).
   Sandy relit la vraie commande en base (service_role) ; GloryHairRiot n'a
   qu'une référence passée en query param — logique de vidage panier +
   contenu inchangés (le commentaire "paiement mocké" ici était FAUX/périmé,
   le paiement est réel depuis la migration 012, retiré).

   Corrigé 2026-09-13 (audit "retirer les données mockées") : cette page
   affirmait "+50 points et vos 2 essais Premium" à TOUT acheteur, y compris
   un client déjà connecté (qui les a reçus une fois, à l'inscription, pas
   maintenant) et un invité qui ne créera jamais de compte — et affichait
   "Activer mon compte" même à quelqu'un déjà connecté. La mention "48h en
   France métropolitaine" ciblait aussi le mauvais marché (même défaut que
   ReassuranceBar). Le bandeau bonus/CTA compte est maintenant conditionné
   au vrai état de session. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
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
  const { user, loading } = useSession();
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
        de confirmation avec les détails de livraison dans quelques minutes.
      </p>

      {/* Bonus Glory Club : uniquement pertinent pour un invité qui n'a pas
          encore de compte — un client déjà connecté a déjà reçu ce bonus à
          son inscription, pas à cette commande. */}
      {!loading && !user && (
        <div className="mt-10 rounded-lg border border-hairline bg-app p-6 text-left">
          <p className="eyebrow">Bonus Glory Club</p>
          <p className="mt-3 leading-relaxed text-muted">
            Créez un compte pour débloquer <b className="text-accent">+50 points</b> et{' '}
            <b className="text-accent">2 essais Premium</b> offerts.
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {!loading && !user && (
          <Link href={`/${lang}/connexion?redirect=/${lang}/compte`} className="rounded-[2px] bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
            Créer mon compte
          </Link>
        )}
        <Link href={`/${lang}/catalogue`} className="rounded-[2px] border border-line px-7 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] hover:text-accent">
          Continuer mes achats
        </Link>
      </div>
    </section>
  );
}
