'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Check, Heart, Star } from 'lucide-react';
import { type Wig } from '@/lib/wigs-data';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';
import { ProductCard } from '@/components/product-card';
import { ProductGallery } from './ProductGallery';
import { AvisSection } from './AvisSection';
import type { Locale } from '@/i18n/config';
import { useMoneyFormatter } from '@/lib/currency-client';
import { getDictionaryClient } from '@/i18n/client';

/* Port structurel 1:1 de sandy-stylish/src/app/(site)/[lang]/produit/[slug]/page.tsx
   (retour catalogue, grid 2 col galerie+infos, lien avis, dl attributs, section
   "vous aimerez aussi") — adapté aux perruques : 3 sélecteurs (coloris/longueur/
   densité) au lieu d'un sélecteur de variante unique (Sandy n'a pas de coloris,
   les perruques oui). Avis = affichage résumé uniquement (dépôt/modération réels
   = Phase E, pas encore de table reviews). */

const SIZES_AVAILABLE = [16, 18, 20, 22, 24] as const;
const DENSITIES = [
  { value: 150, label: '150%' },
  { value: 180, label: '180%' },
  { value: 200, label: '200%' },
] as const;

export function ProduitRiot({ wig, similarPool, lang }: { wig: Wig; similarPool: Wig[]; lang: Locale }) {
  // Pack (migration 015) : pas de coloris/longueur/densité (ce n'est pas
  // une perruque individuelle), prix fixe, composition affichée à la place.
  // Branche séparée pour ne RIEN changer au rendu perruque existant.
  if (wig.isPack) return <PackView wig={wig} lang={lang} />;

  return <WigView wig={wig} similarPool={similarPool} lang={lang} />;
}

function PackView({ wig, lang }: { wig: Wig; lang: Locale }) {
  const router = useRouter();
  const { user } = useSession();
  const dict = getDictionaryClient(lang);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { money } = useMoneyFormatter();
  const outOfStock = wig.stockQuantity === 0;

  const addFavoriteM = trpc.wishlist.addBySlug.useMutation({
    onSuccess: () => setFavorited(true),
  });

  function handleAddToCart() {
    addItem({
      wig_id: wig.id,
      variant_id: null,
      quantity: 1,
      price_at_added: wig.price,
      name: wig.name,
      image_url: wig.img ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleAddFavorite() {
    if (!user) {
      router.push(`/${lang}/connexion?redirect=/${lang}/perruque/${wig.id}`);
      return;
    }
    addFavoriteM.mutate({ slug: wig.id });
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-12 md:px-11 md:py-16">
      <Link href={`/${lang}/catalogue`} className="text-sm text-muted transition-colors hover:text-ink">
        {dict.produit.backToCatalogue}
      </Link>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <ProductGallery images={wig.img ? [wig.img] : []} alt={wig.name} />

        <div>
          <p className="eyebrow">{dict.produit.pack}</p>
          <h1 className="display mt-2 text-4xl text-ink md:text-5xl">{wig.name}</h1>
          <p className="mt-4 text-lg text-accent tabular-nums">{money(wig.price * 100)}</p>

          {outOfStock && (
            <p className="mt-3 inline-flex items-center rounded-full border border-hairline px-3 py-1 text-xs uppercase tracking-[0.08em] text-muted">
              {dict.produit.outOfStock}
            </p>
          )}

          {wig.packItems && wig.packItems.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">{dict.produit.packContents}</p>
              <ul className="mt-3 space-y-2">
                {wig.packItems.map((item) => (
                  <li key={item.slug} className="flex items-center justify-between gap-3 rounded-sm border border-hairline px-4 py-3 text-sm">
                    <Link href={`/${lang}/perruque/${item.slug}`} className="text-ink transition-colors hover:text-accent">{item.name}</Link>
                    <span className="text-faint">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              aria-disabled={outOfStock}
              className="rounded-[2px] bg-accent px-8 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-[color:var(--border-hairline)] disabled:text-muted disabled:hover:bg-[color:var(--border-hairline)]"
            >
              {outOfStock ? dict.produit.outOfStock : added ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={16} /> {dict.produit.added}
                </span>
              ) : dict.produit.addToCart}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddFavorite}
            disabled={favorited || addFavoriteM.isPending}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-muted"
            aria-label={dict.produit.addToWishlist}
          >
            <Heart aria-hidden size={16} className={favorited ? 'fill-[color:var(--accent)] text-accent' : ''} /> {favorited ? dict.produit.inWishlist : dict.produit.addToWishlist}
          </button>
        </div>
      </div>
    </section>
  );
}

function WigView({ wig, similarPool, lang }: { wig: Wig; similarPool: Wig[]; lang: Locale }) {
  const router = useRouter();
  const { user } = useSession();
  const dict = getDictionaryClient(lang);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number>(wig.length);
  const [selectedDensity, setSelectedDensity] = useState<number>(180);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { money } = useMoneyFormatter();
  const nameOnly = wig.name.replace(/\s*\d+"$/, '').trim();
  // Rupture de stock jamais affichée avant tout (audit UX 2026-09-13) : le
  // seul blocage arrivait au tout dernier clic du checkout, après que la
  // cliente ait rempli toute son adresse.
  const outOfStock = wig.stockQuantity === 0;

  const similar = useMemo(() => similarPool.filter((w) => w.id !== wig.id).slice(0, 4), [similarPool, wig.id]);

  const addFavoriteM = trpc.wishlist.addBySlug.useMutation({
    onSuccess: () => setFavorited(true),
  });

  function handleAddToCart() {
    addItem({
      wig_id: wig.id,
      variant_id: `${wig.id}-${selectedColor}-${selectedSize}-${selectedDensity}`,
      quantity: 1,
      price_at_added: wig.price,
      name: `${nameOnly} ${selectedSize}″`,
      image_url: wig.img ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleAddFavorite() {
    if (!user) {
      router.push(`/${lang}/connexion?redirect=/${lang}/perruque/${wig.id}`);
      return;
    }
    addFavoriteM.mutate({ slug: wig.id });
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-12 md:px-11 md:py-16">
      <Link href={`/${lang}/catalogue`} className="text-sm text-muted transition-colors hover:text-ink">
        {dict.produit.backToCatalogue}
      </Link>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <ProductGallery images={wig.img ? [wig.img] : []} alt={wig.name} />

        <div>
          <h1 className="display text-4xl text-ink md:text-5xl">
            {nameOnly} {selectedSize}″
          </h1>

          {wig.rating != null && wig.reviews != null && (
            <a href="#avis" className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
              <span className="inline-flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(wig.rating!) ? 'fill-[color:var(--accent)] text-accent' : 'text-faint'}
                  />
                ))}
              </span>
              <span className="tabular-nums">
                {dict.produit.ratingSummary.replace('{rating}', wig.rating.toFixed(1)).replace('{reviewCount}', String(wig.reviews))}
              </span>
            </a>
          )}

          <p className="mt-4 text-lg text-accent tabular-nums">{money(wig.price * 100)}</p>

          {outOfStock && (
            <p className="mt-3 inline-flex items-center rounded-full border border-hairline px-3 py-1 text-xs uppercase tracking-[0.08em] text-muted">
              {dict.produit.outOfStock}
            </p>
          )}

          <p className="mt-6 max-w-prose leading-relaxed text-muted">
            {dict.produit.descriptionTemplate
              .replace('{style}', wig.style)
              .replace('{length}', String(wig.length))
              .replace('{tone}', lang === 'fr' ? wig.tone.toLowerCase() : wig.tone)}
          </p>

          <div className="mt-8">
            <p className="eyebrow">{dict.produit.colourEyebrow}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {wig.swatches.map((color, i) => {
                const active = selectedColor === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={dict.produit.colourAriaLabel.replace('{number}', String(i + 1))}
                    onClick={() => setSelectedColor(i)}
                    className="h-9 w-9 rounded-full border-2 transition-colors"
                    style={{ background: color, borderColor: active ? 'var(--border-accent)' : 'var(--border-hairline)' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="eyebrow">{dict.produit.lengthEyebrow}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {SIZES_AVAILABLE.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedSize(size)}
                    className="rounded-[2px] border px-4 py-2 text-sm transition-colors"
                    style={{
                      borderColor: active ? 'var(--border-accent)' : 'var(--border-input)',
                      background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {size}″
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="eyebrow">{dict.produit.densityEyebrow}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {DENSITIES.map((d) => {
                const active = selectedDensity === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedDensity(d.value)}
                    className="rounded-[2px] border px-4 py-2 text-sm transition-colors"
                    style={{
                      borderColor: active ? 'var(--border-accent)' : 'var(--border-input)',
                      background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              aria-disabled={outOfStock}
              className="rounded-[2px] bg-accent px-8 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-[color:var(--border-hairline)] disabled:text-muted disabled:hover:bg-[color:var(--border-hairline)]"
            >
              {outOfStock ? dict.produit.outOfStock : added ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={16} /> {dict.produit.added}
                </span>
              ) : dict.produit.addToCart}
            </button>
            <Link href={`/${lang}/essayage`} className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent">
              {dict.produit.tryItLive}
            </Link>
          </div>

          {/* Le widget de chat flottant (ElodieWidget.tsx) existe en code
              mais n'a jamais été monté nulle part ni vérifié visuellement —
              lien contextuel plus sûr (audit commercial 2026-09-13) : le
              moment de doute maximal (longueur/coloris) avait accès à
              l'essai virtuel mais pas au conseil IA. */}
          <Link href={`/${lang}/elodie`} className="mt-3 block text-sm text-muted transition-colors hover:text-ink">
            {dict.produit.askElodie}
          </Link>

          <button
            type="button"
            onClick={handleAddFavorite}
            disabled={favorited || addFavoriteM.isPending}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-muted"
            aria-label={dict.produit.addToWishlist}
          >
            <Heart aria-hidden size={16} className={favorited ? 'fill-[color:var(--accent)] text-accent' : ''} /> {favorited ? dict.produit.inWishlist : dict.produit.addToWishlist}
          </button>

          <dl className="mt-12 space-y-2 border-t border-hairline pt-6 text-sm">
            <div className="flex gap-3">
              <dt className="w-32 text-faint">{dict.produit.attrComposition}</dt>
              <dd className="text-ink">{dict.produit.attrCompositionValue}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">{dict.produit.attrCap}</dt>
              <dd className="text-ink">{dict.produit.attrCapValue}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">{dict.produit.attrCare}</dt>
              <dd className="text-ink">{dict.produit.attrCareValue}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">{dict.produit.attrShipping}</dt>
              <dd className="text-ink">{dict.produit.attrShippingValue}</dd>
            </div>
          </dl>
        </div>
      </div>

      <AvisSection slug={wig.id} lang={lang} />

      {similar.length > 0 && (
        <div className="mt-16 border-t border-hairline pt-12">
          <h2 className="display text-3xl text-ink">{dict.produit.alsoLike}</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {similar.map((w) => (
              <ProductCard key={w.id} wig={w} lang={lang} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
