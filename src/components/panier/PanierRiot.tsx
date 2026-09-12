'use client';

/* Port structurel 1:1 de sandy-stylish/src/components/cart/cart-view.tsx
   (état vide centré, grid 1fr/340px, lignes avec stepper ±, aside sticky
   récap) — code promo ajouté dans le récap (fonctionnalité GloryHairRiot
   existante, Sandy n'en a pas), même vocabulaire visuel discret. */

import Link from 'next/link';
import { useState } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart.store';
import { WIG_BY_ID } from '@/lib/wigs-data';
import { trpc } from '@/lib/trpc/client';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { useMoneyFormatter } from '@/lib/currency-client';

const TVA_RATE = 0.20;

function parseVariant(variantId: string | null): { size?: number; density?: number } {
  if (!variantId) return {};
  const parts = variantId.split('-');
  if (parts.length < 4) return {};
  const size = parseInt(parts[parts.length - 2]!, 10);
  const density = parseInt(parts[parts.length - 1]!, 10);
  return {
    size: Number.isFinite(size) ? size : undefined,
    density: Number.isFinite(density) ? density : undefined,
  };
}

function metaLine(item: CartItem): string {
  const variant = parseVariant(item.variant_id);
  const wig = WIG_BY_ID[item.wig_id];
  const tone = wig?.tone ?? 'n/a';
  const size = variant.size ?? wig?.length ?? '?';
  const density = variant.density ?? 180;
  return `${tone} · ${size}″ · ${density}%`;
}

export function PanierRiot({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discountCode = useCartStore((s) => s.discountCode);
  const discountCents = useCartStore((s) => s.discountCents);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const clearDiscount = useCartStore((s) => s.clearDiscount);
  const [promo, setPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const validateM = trpc.discounts.validate.useMutation();
  const { money } = useMoneyFormatter();

  const tva = Math.round(((subtotal * TVA_RATE) / (1 + TVA_RATE)) * 100) / 100;
  const discountEuros = discountCents / 100;
  const total = Math.max(0, subtotal - discountEuros);

  function applyPromo() {
    const code = promo.trim();
    if (!code || validateM.isPending) return;
    setPromoFeedback(null);
    validateM.mutate(
      { code, subtotalCents: Math.round(subtotal * 100) },
      {
        onSuccess: (res) => {
          setDiscount(res.code, res.discountCents);
          setPromo('');
          setPromoFeedback({ ok: true, text: `Code ${res.code} appliqué : −${money(res.discountCents)}` });
        },
        onError: (err) => {
          clearDiscount();
          setPromoFeedback({ ok: false, text: err.message || 'Code promo invalide.' });
        },
      },
    );
  }

  function removePromo() {
    clearDiscount();
    setPromoFeedback(null);
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[960px] px-6 py-20 md:py-28">
        <h1 className="display text-4xl text-ink md:text-5xl">{dict.cart.title}</h1>
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="display text-2xl text-ink">{dict.cart.emptyTitle}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {dict.cart.emptyBody}
          </p>
          <Link
            href={`/${lang}/catalogue`}
            className="mt-8 inline-flex items-center gap-2 rounded-[2px] bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            {dict.cart.seeCatalogue}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[960px] px-6 py-12 md:py-16">
      <h1 className="display text-4xl text-ink md:text-5xl">{dict.cart.title}</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_340px] md:gap-14">
        <ul>
          {items.map((item, i) => {
            const wig = WIG_BY_ID[item.wig_id];
            const name = wig?.name.replace(/\s*\d+"$/, '').trim() ?? item.name ?? 'Perruque';
            const size = parseVariant(item.variant_id).size ?? wig?.length ?? '';
            return (
              <li key={item.id} className={`flex items-center gap-5 py-6 ${i > 0 ? 'border-t border-hairline' : ''}`}>
                <Link href={wig ? `/${lang}/perruque/${wig.id}` : '#'} className="shrink-0" aria-label={name}>
                  <div className="h-[84px] w-[84px] overflow-hidden rounded-sm bg-surface">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image_url} alt={name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={wig ? `/${lang}/perruque/${wig.id}` : '#'} className="font-display text-xl text-ink transition-colors hover:text-accent">
                    {name} {size}″
                  </Link>
                  <p className="mt-1 text-[13px] text-faint">{metaLine(item)}</p>
                </div>

                <div className="flex items-center rounded-sm border border-line">
                  <button
                    type="button"
                    onClick={() => (item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1))}
                    aria-label={`${dict.cart.decreaseQty}, ${name}`}
                    className="px-3 py-2 text-muted transition-colors hover:text-accent"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] px-2 text-center text-sm text-ink tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`${dict.cart.increaseQty}, ${name}`}
                    className="px-3 py-2 text-muted transition-colors hover:text-accent"
                  >
                    +
                  </button>
                </div>

                <p className="w-24 shrink-0 text-right text-sm text-accent tabular-nums">
                  {money(item.price_at_added * item.quantity * 100)}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Retirer, ${name}`}
                  className="shrink-0 text-lg leading-none text-faint transition-colors hover:text-danger"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-lg border border-hairline bg-app p-6">
            <dl className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{dict.cart.subtotal}</dt>
                <dd className="text-ink tabular-nums">{money(Math.round(subtotal * 100))}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{dict.cart.shipping}</dt>
                <dd className="text-ink">{dict.cart.free}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{dict.cart.vatIncluded}</dt>
                <dd className="text-ink tabular-nums">{money(Math.round(tva * 100))}</dd>
              </div>
              {discountCode && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">{dict.cart.discount} ({discountCode})</dt>
                  <dd className="text-[color:var(--success)] tabular-nums">−{money(Math.round(discountEuros * 100))}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-hairline pt-5">
              <span className="text-lg text-ink">{dict.cart.total}</span>
              <span className="text-lg text-accent tabular-nums">{money(Math.round(total * 100))}</span>
            </div>

            <Link
              href={`/${lang}/checkout`}
              className="mt-6 flex w-full items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
            >
              {dict.cart.checkout}
            </Link>

            <Link href={`/${lang}/catalogue`} className="mt-4 block text-center text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
              {dict.cart.continueShopping}
            </Link>

            {discountCode ? (
              <div className="mt-6 flex items-center justify-between gap-2 border-t border-hairline pt-5 text-sm">
                <span className="text-ink">
                  {dict.cart.promoCode} <b className="text-accent">{discountCode}</b> {dict.cart.promoApplied}
                </span>
                <button
                  type="button"
                  onClick={removePromo}
                  className="text-xs text-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {dict.cart.remove}
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); applyPromo(); }} className="mt-6 flex gap-2 border-t border-hairline pt-5">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder={dict.cart.promoCode}
                  aria-label={dict.cart.promoCode}
                  disabled={validateM.isPending}
                  className="flex-1 rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-faint disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={validateM.isPending || !promo.trim()}
                  className="rounded-sm border border-input px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {validateM.isPending ? '…' : 'OK'}
                </button>
              </form>
            )}
            {promoFeedback && (
              <p className={`mt-2 text-xs ${promoFeedback.ok ? 'text-[color:var(--success)]' : 'text-danger'}`}>
                {promoFeedback.text}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
