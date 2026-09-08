'use client';

/* Port structurel 1:1 de sandy-stylish/src/components/checkout/checkout-view.tsx
   (formulaire simple page — plus de stepper 3 étapes — grid 1fr/360px, aside
   sticky avec récap+CTA). Livraison (standard/express/atelier, spécifique
   GloryHairRiot) ajoutée comme un groupe de plus, stylée avec les mêmes cartes
   radio que le choix de paiement de Sandy. Paiement Stripe/FedaPay = choix
   existant GloryHairRiot ; le MVP disclaimer (paiement pas encore branché) est
   conservé, mais seulement pour ces deux options — "Paiement à la livraison"
   (demande Fresnel) n'a rien à mocker, c'est son comportement réel. Checkout
   invité supporté (comme Sandy Stylish) : pas de garde de connexion ici, le
   formulaire prérempli email/nom si une session existe, reste éditable sinon. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { WIG_BY_ID } from '@/lib/wigs-data';

const TVA_RATE = 0.20;

type ShippingMode = 'standard' | 'express' | 'atelier';
type PaymentMode = 'stripe' | 'fedapay' | 'cod';

interface Address {
  email: string;
  prenom: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  telephone: string;
}

const SHIPPING_OPTIONS: { id: ShippingMode; label: string; eta: string; price: number; note: string }[] = [
  { id: 'standard', label: 'Standard', eta: '48h', price: 0, note: 'France métropolitaine' },
  { id: 'express', label: 'Express', eta: '24h', price: 9.99, note: 'Avant 13h, livré le lendemain' },
  { id: 'atelier', label: 'Atelier Paris 9', eta: 'sur RDV', price: 0, note: 'Retrait + pose offerte (Glory Club Gold)' },
];

const PAYMENT_OPTIONS: { id: PaymentMode; title: string; desc: string }[] = [
  { id: 'stripe', title: 'Carte bancaire', desc: 'Visa · Mastercard · CB · Amex' },
  { id: 'fedapay', title: 'Mobile Money', desc: "MTN · Moov · Wave (Afrique de l'Ouest)" },
  { id: 'cod', title: 'Paiement à la livraison', desc: 'Espèces ou mobile money remis au livreur' },
];

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', "Côte d'Ivoire", 'Sénégal', 'Bénin', 'Togo', 'Maroc'];

const INPUT_CLASS =
  'w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-[color:var(--accent)] focus:outline-none';

export function CheckoutRiot() {
  const router = useRouter();
  const { user, profile } = useSession();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());

  const [address, setAddress] = useState<Address>({
    email: '', prenom: '', nom: '', adresse: '', ville: '', codePostal: '', pays: 'France', telephone: '',
  });
  const [shipping, setShipping] = useState<ShippingMode>('standard');
  const [payment, setPayment] = useState<PaymentMode>('stripe');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) router.replace('/panier');
  }, [items.length, router]);

  // Checkout invité : formulaire vide par défaut. Si une session existe,
  // préremplit email/nom pour éviter de retaper une info déjà connue —
  // reste entièrement éditable, pas une contrainte.
  useEffect(() => {
    if (!user) return;
    setAddress((a) => {
      if (a.email) return a; // déjà saisi par l'utilisateur, ne pas écraser
      const [prenom = '', ...rest] = (profile?.full_name ?? '').split(' ');
      return { ...a, email: user.email ?? '', prenom, nom: rest.join(' ') };
    });
  }, [user, profile]);

  const shippingPrice = SHIPPING_OPTIONS.find((s) => s.id === shipping)?.price ?? 0;
  const total = subtotal + shippingPrice;
  const tva = Math.round(((total * TVA_RATE) / (1 + TVA_RATE)) * 100) / 100;

  const addressValid = useMemo(() => {
    return Boolean(
      address.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) &&
      address.prenom.trim() && address.nom.trim() &&
      address.adresse.trim() && address.ville.trim() &&
      address.codePostal.trim() && address.pays.trim(),
    );
  }, [address]);

  function set<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !addressValid) return;
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            wig_slug: i.wig_id,
            variant_id: null,
            quantity: i.quantity,
            price_at_added: i.price_at_added,
          })),
          address,
          shipping,
          payment_method: payment,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
        if (r.status === 401) {
          router.push('/connexion?redirect=/checkout');
          return;
        }
        setError(json.userMessage ?? 'Erreur. Réessaie.');
        setSubmitting(false);
        return;
      }
      router.push(`/merci?ref=${json.ref}`);
    } catch {
      setError('Connexion impossible. Vérifie ton réseau.');
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[900px] px-6 py-16">
        <h1 className="display text-4xl text-ink md:text-5xl">Checkout</h1>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[900px] px-6 py-12 md:py-16">
      <h1 className="display text-4xl text-ink md:text-5xl">Checkout</h1>

      <form onSubmit={onSubmit} className="mt-10 grid gap-10 md:grid-cols-[1fr_360px] md:gap-14">
        <div>
          <p className="eyebrow">Contact</p>
          <div className="mt-4">
            <input
              type="email" required value={address.email} onChange={(e) => set('email', e.target.value)}
              aria-label="Email" placeholder="ton@adresse.email" className={INPUT_CLASS} autoComplete="email"
            />
          </div>

          <p className="eyebrow mt-10">Adresse de livraison</p>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required value={address.prenom} onChange={(e) => set('prenom', e.target.value)} aria-label="Prénom" placeholder="Prénom" className={INPUT_CLASS} autoComplete="given-name" />
              <input required value={address.nom} onChange={(e) => set('nom', e.target.value)} aria-label="Nom" placeholder="Nom" className={INPUT_CLASS} autoComplete="family-name" />
            </div>
            <input required value={address.adresse} onChange={(e) => set('adresse', e.target.value)} aria-label="Adresse" placeholder="N° et rue" className={INPUT_CLASS} autoComplete="street-address" />
            <div className="grid grid-cols-2 gap-3">
              <input required value={address.codePostal} onChange={(e) => set('codePostal', e.target.value)} aria-label="Code postal" placeholder="Code postal" className={INPUT_CLASS} autoComplete="postal-code" />
              <input required value={address.ville} onChange={(e) => set('ville', e.target.value)} aria-label="Ville" placeholder="Ville" className={INPUT_CLASS} autoComplete="address-level2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={address.pays} onChange={(e) => set('pays', e.target.value)} aria-label="Pays" className={INPUT_CLASS}>
                {COUNTRIES.map((c) => <option key={c} value={c} className="bg-app text-ink">{c}</option>)}
              </select>
              <input type="tel" value={address.telephone} onChange={(e) => set('telephone', e.target.value)} aria-label="Téléphone" placeholder="+33 6 12 34 56 78" className={INPUT_CLASS} autoComplete="tel" />
            </div>
          </div>

          <p className="eyebrow mt-10">Livraison</p>
          <div className="mt-4 space-y-3">
            {SHIPPING_OPTIONS.map((opt) => {
              const selected = shipping === opt.id;
              return (
                <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3.5 transition-colors" style={{ borderColor: selected ? 'var(--border-accent)' : 'var(--border-card)', background: selected ? 'var(--surface)' : 'transparent' }}>
                  <input type="radio" name="shipping" value={opt.id} checked={selected} onChange={() => setShipping(opt.id)} className="sr-only" />
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: selected ? 'var(--accent)' : 'var(--border-input)' }}>
                    {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-ink">{opt.label} · {opt.eta}</span>
                      <span className="shrink-0 text-sm text-accent tabular-nums">{opt.price === 0 ? 'Gratuite' : `+${opt.price.toFixed(2)}€`}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-faint">{opt.note}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <p className="eyebrow mt-10">Paiement</p>
          <div className="mt-4 space-y-3">
            {PAYMENT_OPTIONS.map((opt) => {
              const selected = payment === opt.id;
              return (
                <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3.5 transition-colors" style={{ borderColor: selected ? 'var(--border-accent)' : 'var(--border-card)', background: selected ? 'var(--surface)' : 'transparent' }}>
                  <input type="radio" name="payment_method" value={opt.id} checked={selected} onChange={() => setPayment(opt.id)} className="sr-only" />
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: selected ? 'var(--accent)' : 'var(--border-input)' }}>
                    {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{opt.title}</span>
                    <span className="mt-0.5 block text-xs text-faint">{opt.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {payment !== 'cod' && (
            <div className="mt-4 rounded-sm border border-hairline bg-surface px-4 py-3.5 text-xs leading-relaxed text-muted">
              Mode démo : le paiement en ligne n&apos;est pas encore branché. La commande est
              créée sans transaction réelle.
            </div>
          )}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-lg border border-hairline bg-app p-6">
            <ul className="space-y-3 border-b border-hairline pb-4">
              {items.map((item) => {
                const wig = WIG_BY_ID[item.wig_id];
                return (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted">{item.quantity} × {wig?.name ?? item.name ?? 'Perruque'}</span>
                    <span className="shrink-0 text-ink tabular-nums">{(item.price_at_added * item.quantity).toFixed(2)}€</span>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Sous-total</dt>
                <dd className="text-ink tabular-nums">{subtotal.toFixed(2)}€</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Livraison</dt>
                <dd className="text-ink tabular-nums">{shippingPrice === 0 ? 'Gratuite' : `${shippingPrice.toFixed(2)}€`}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">dont TVA</dt>
                <dd className="text-ink tabular-nums">{tva.toFixed(2)}€</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
              <span className="text-lg text-ink">Total</span>
              <span className="text-lg text-accent tabular-nums">{total.toFixed(2)}€</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !addressValid}
              className="mt-4 flex w-full items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
            >
              {submitting ? 'Traitement…' : `Confirmer · ${total.toFixed(2)}€`}
            </button>

            {error && <p className="mt-3 text-center text-xs text-danger">{error}</p>}

            <Link href="/panier" className="mt-4 block text-center text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
              Modifier mon sac
            </Link>
          </div>
        </aside>
      </form>
    </section>
  );
}
