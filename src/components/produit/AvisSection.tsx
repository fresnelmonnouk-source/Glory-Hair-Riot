'use client';

/* Section avis clients — sous les infos produit sur la fiche perruque
   (id="avis", cible du lien résumé "4.9 · 218 avis" plus haut sur la page,
   qui ne menait nulle part avant cette section). Vocabulaire visuel 1:1
   avec le reste de ProduitRiot (rounded-lg border-hairline bg-app, eyebrow,
   accent). Dépôt/liste réels via le router tRPC `reviews` (migration 010) —
   wigs.rating/review_count restent le résumé affiché ailleurs (catalogue,
   accueil), tenus à jour par le trigger SQL, pas par ce composant. */

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Star } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

const PAGE_SIZE = 10;

const STATUS_MESSAGE: Record<string, string> = {
  pending: 'Votre avis est en attente de modération : il sera visible ici une fois validé.',
  published: 'Votre avis est publié, merci !',
  rejected: "Votre avis n'a pas été retenu par notre équipe.",
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(rating) ? 'fill-[color:var(--accent)] text-accent' : 'text-faint'} />
      ))}
    </span>
  );
}

export function AvisSection({ slug }: { slug: string }) {
  const { user } = useSession();
  const [offset, setOffset] = useState(0);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const utils = trpc.useUtils();
  const listQ = trpc.reviews.listForWig.useQuery({ slug, limit: PAGE_SIZE, offset });
  const myReviewQ = trpc.reviews.myReviewForWig.useQuery({ slug }, { enabled: !!user });

  const createM = trpc.reviews.create.useMutation({
    onSuccess: () => {
      void utils.reviews.myReviewForWig.invalidate({ slug });
      setTitle('');
      setBody('');
      setRating(5);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (createM.isPending || !body.trim()) return;
    createM.mutate({ slug, rating, title: title.trim() || undefined, body: body.trim() });
  }

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const hasMore = offset + items.length < total;

  return (
    <div id="avis" className="mt-16 scroll-mt-24 border-t border-hairline pt-12">
      <h2 className="display text-3xl text-ink">Avis clients {total > 0 && <span className="text-lg text-faint">({total})</span>}</h2>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_360px]">
        {/* ─── Liste des avis publiés ─── */}
        <div>
          {listQ.isLoading ? (
            <p className="text-sm text-faint">Chargement des avis…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">Aucun avis publié pour l&apos;instant. Soyez le premier·ère à donner votre avis.</p>
          ) : (
            <ul className="space-y-6">
              {items.map((r) => {
                const d = new Date(r.created_at);
                return (
                  <li key={r.id} className="rounded-lg border border-hairline bg-app p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={r.rating} />
                      {r.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle size={12} /> Achat vérifié
                        </span>
                      )}
                      <span className="ml-auto text-xs text-faint">
                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {r.title && <p className="mt-3 font-display text-lg text-ink">{r.title}</p>}
                    <p className="mt-2 leading-relaxed text-muted">{r.body}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={listQ.isFetching}
              className="mt-6 text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent disabled:opacity-60"
            >
              {listQ.isFetching ? 'Chargement…' : 'Voir plus d\'avis'}
            </button>
          )}
        </div>

        {/* ─── Dépôt d'avis ─── */}
        <div className="rounded-lg border border-hairline bg-app p-6">
          <p className="eyebrow">Donner mon avis</p>

          {!user ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-muted">Connectez-vous pour laisser un avis sur ce produit.</p>
              <Link
                href={`/connexion?redirect=/perruque/${slug}%23avis`}
                className="mt-5 inline-flex rounded-sm border border-input px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]"
              >
                Se connecter
              </Link>
            </>
          ) : myReviewQ.isLoading ? (
            <p className="mt-3 text-sm text-faint">Vérification…</p>
          ) : myReviewQ.data ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{STATUS_MESSAGE[myReviewQ.data.status] ?? 'Avis déjà déposé.'}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Note</p>
                <div className="flex gap-1" role="radiogroup" aria-label="Note sur 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                      onClick={() => setRating(n)}
                      className="p-0.5"
                    >
                      <Star size={22} className={n <= rating ? 'fill-[color:var(--accent)] text-accent' : 'text-faint'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="avis-title" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Titre (optionnel)
                </label>
                <input
                  id="avis-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  disabled={createM.isPending}
                  className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="avis-body" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Votre avis
                </label>
                <textarea
                  id="avis-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  required
                  minLength={10}
                  disabled={createM.isPending}
                  placeholder="Qualité, confort, tenue dans le temps…"
                  className="w-full resize-none rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
                />
              </div>

              {createM.error && <p className="text-sm text-[color:var(--danger)]">{createM.error.message}</p>}
              {createM.isSuccess && <p className="text-sm text-success">Merci ! Votre avis est en attente de modération.</p>}

              <button
                type="submit"
                disabled={createM.isPending || body.trim().length < 10}
                className="inline-flex w-fit items-center gap-2 rounded-sm bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createM.isPending ? 'Envoi…' : 'Publier mon avis'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
