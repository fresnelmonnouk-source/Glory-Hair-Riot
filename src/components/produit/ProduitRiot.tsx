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

export function ProduitRiot({ wig, similarPool }: { wig: Wig; similarPool: Wig[] }) {
  // Pack (migration 015) : pas de coloris/longueur/densité (ce n'est pas
  // une perruque individuelle), prix fixe, composition affichée à la place.
  // Branche séparée pour ne RIEN changer au rendu perruque existant.
  if (wig.isPack) return <PackView wig={wig} />;

  return <WigView wig={wig} similarPool={similarPool} />;
}

function PackView({ wig }: { wig: Wig }) {
  const router = useRouter();
  const { user } = useSession();
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

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
      image_url: wig.img,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleAddFavorite() {
    if (!user) {
      router.push(`/connexion?redirect=/perruque/${wig.id}`);
      return;
    }
    addFavoriteM.mutate({ slug: wig.id });
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-12 md:px-11 md:py-16">
      <Link href="/catalogue" className="text-sm text-muted transition-colors hover:text-ink">
        ← Retour au catalogue
      </Link>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <ProductGallery images={[wig.img]} alt={wig.name} />

        <div>
          <p className="eyebrow">Pack</p>
          <h1 className="display mt-2 text-4xl text-ink md:text-5xl">{wig.name}</h1>
          <p className="mt-4 text-lg text-accent tabular-nums">{wig.price}€</p>

          {wig.packItems && wig.packItems.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">Contenu du pack</p>
              <ul className="mt-3 space-y-2">
                {wig.packItems.map((item) => (
                  <li key={item.slug} className="flex items-center justify-between gap-3 rounded-sm border border-hairline px-4 py-3 text-sm">
                    <Link href={`/perruque/${item.slug}`} className="text-ink transition-colors hover:text-accent">{item.name}</Link>
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
              className="rounded-[2px] bg-accent px-8 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
            >
              {added ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={16} /> Ajouté
                </span>
              ) : 'Ajouter au sac'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddFavorite}
            disabled={favorited || addFavoriteM.isPending}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-muted"
            aria-label="Ajouter aux favoris"
          >
            <Heart aria-hidden size={16} className={favorited ? 'fill-[color:var(--accent)] text-accent' : ''} /> {favorited ? 'Dans vos favoris' : 'Ajouter aux favoris'}
          </button>
        </div>
      </div>
    </section>
  );
}

function WigView({ wig, similarPool }: { wig: Wig; similarPool: Wig[] }) {
  const router = useRouter();
  const { user } = useSession();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number>(wig.length);
  const [selectedDensity, setSelectedDensity] = useState<number>(180);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const nameOnly = wig.name.replace(/\s*\d+"$/, '').trim();

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
      image_url: wig.img,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleAddFavorite() {
    if (!user) {
      router.push(`/connexion?redirect=/perruque/${wig.id}`);
      return;
    }
    addFavoriteM.mutate({ slug: wig.id });
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-12 md:px-11 md:py-16">
      <Link href="/catalogue" className="text-sm text-muted transition-colors hover:text-ink">
        ← Retour au catalogue
      </Link>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <ProductGallery images={[wig.img]} alt={wig.name} />

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
              <span className="tabular-nums">{wig.rating.toFixed(1)} · {wig.reviews} avis</span>
            </a>
          )}

          <p className="mt-4 text-lg text-accent tabular-nums">{wig.price}€</p>

          <p className="mt-6 max-w-prose leading-relaxed text-muted">
            {wig.style} {wig.length}″ teinte {wig.tone.toLowerCase()}. Lace front HD invisible,
            baby hair pré-épilé. Cheveux 100% humains Remy, calotte 13×4 respirante. Garantie
            12 mois, retour 30 jours.
          </p>

          <div className="mt-8">
            <p className="eyebrow">Coloris</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {wig.swatches.map((color, i) => {
                const active = selectedColor === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`Coloris ${i + 1}`}
                    onClick={() => setSelectedColor(i)}
                    className="h-9 w-9 rounded-full border-2 transition-colors"
                    style={{ background: color, borderColor: active ? 'var(--border-accent)' : 'var(--border-hairline)' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="eyebrow">Longueur</p>
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
            <p className="eyebrow">Densité</p>
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
              className="rounded-[2px] bg-accent px-8 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
            >
              {added ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check size={16} /> Ajouté
                </span>
              ) : 'Ajouter au sac'}
            </button>
            <Link href="/essayage" className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent">
              Essayer en direct
            </Link>
          </div>

          <button
            type="button"
            onClick={handleAddFavorite}
            disabled={favorited || addFavoriteM.isPending}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-muted"
            aria-label="Ajouter aux favoris"
          >
            <Heart aria-hidden size={16} className={favorited ? 'fill-[color:var(--accent)] text-accent' : ''} /> {favorited ? 'Dans vos favoris' : 'Ajouter aux favoris'}
          </button>

          <dl className="mt-12 space-y-2 border-t border-hairline pt-6 text-sm">
            <div className="flex gap-3">
              <dt className="w-32 text-faint">Composition</dt>
              <dd className="text-ink">Cheveux humains Remy 100%</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">Calotte</dt>
              <dd className="text-ink">Lace front HD · respirante</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">Entretien</dt>
              <dd className="text-ink">Lavage doux toutes les 6 semaines</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-32 text-faint">Livraison</dt>
              <dd className="text-ink">France 48h · International 4-6j</dd>
            </div>
          </dl>
        </div>
      </div>

      <AvisSection slug={wig.id} />

      {similar.length > 0 && (
        <div className="mt-16 border-t border-hairline pt-12">
          <h2 className="display text-3xl text-ink">Vous aimerez aussi</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {similar.map((w) => (
              <ProductCard key={w.id} wig={w} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
