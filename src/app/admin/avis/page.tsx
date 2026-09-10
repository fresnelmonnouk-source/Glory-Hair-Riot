'use client';

/* Page Avis admin — remplace le stub catch-all pour /admin/avis (routage
   Next.js : segment littéral prioritaire sur [...slug], voir
   src/app/admin/[...slug]/page.tsx). Vocabulaire visuel identique au reste
   de l'admin (cf. contenu/page.tsx, commandes/page.tsx) : cartes rounded-lg
   border-hairline bg-surface, pills de statut, boutons texte accent/danger.

   File de modération (pending) en cartes pleines (texte complet visible,
   décision en un coup d'œil) ; historique publié/rejeté en tableau compact
   en dessous — même distinction que demandé (priorité à la modération).

   Table `reviews` créée par la migration 010 (à exécuter manuellement par
   Fresnel dans le Dashboard Supabase avant que cette page puisse charger
   des données réelles — listAll renvoie une erreur tRPC propre en son
   absence, affichée telle quelle plutôt qu'un crash). */

import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  published: 'Publié',
  rejected: 'Rejeté',
};

type WigRef = { name: string; slug: string } | { name: string; slug: string }[] | null;
type UserRef = { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;

function one<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export default function AdminAvisPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.reviews.listAll.useQuery({ status: 'all', limit: 100 }, { staleTime: 10_000 });

  const moderateM = trpc.reviews.moderate.useMutation({
    onSuccess: () => { void utils.reviews.listAll.invalidate(); },
  });

  if (listQ.error) {
    return (
      <div>
        <AdminPageHeader title="Avis" sub="Modération des avis clients" />
        <div className="mt-8 rounded-lg border border-hairline bg-app p-8 text-center">
          <p className="text-sm text-muted">
            Impossible de charger les avis — la migration <code className="text-ink">010_reviews.sql</code> n&apos;a probablement pas encore été appliquée.
          </p>
          <p className="mt-2 text-xs text-faint">{listQ.error.message}</p>
        </div>
      </div>
    );
  }

  const items = listQ.data?.items ?? [];
  const pending = items.filter((r) => r.status === 'pending');
  const history = items.filter((r) => r.status !== 'pending');

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader title="Avis" sub={`${pending.length} en attente de modération · ${items.length} au total`} />

      <section>
        <p className="eyebrow">File de modération ({pending.length})</p>

        {listQ.isLoading ? (
          <p className="mt-4 text-sm text-muted">Chargement…</p>
        ) : pending.length === 0 ? (
          <div className="mt-4 rounded-lg border border-hairline bg-app p-8 text-center text-sm text-muted">
            Aucun avis en attente.
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((r) => {
              const wig = one<{ name: string; slug: string }>(r.wigs as WigRef);
              const u = one<{ full_name: string | null; email: string }>(r.users as UserRef);
              return (
                <li key={r.id} className="rounded-lg border border-hairline bg-surface p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        {r.verified_purchase && (
                          <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-success">Achat vérifié</span>
                        )}
                      </div>
                      {r.title && <p className="mt-2 font-display text-lg text-ink">{r.title}</p>}
                      <p className="mt-2 max-w-2xl leading-relaxed text-muted">{r.body}</p>
                      <p className="mt-3 text-xs text-faint">
                        {wig?.name ?? 'Produit supprimé'} · {u?.full_name ?? u?.email ?? 'Client'} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        disabled={moderateM.isPending}
                        onClick={() => moderateM.mutate({ reviewId: r.id, status: 'rejected' })}
                        className="rounded-sm border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-[color:var(--danger)] hover:text-[color:var(--danger)] disabled:opacity-40"
                      >
                        Rejeter
                      </button>
                      <button
                        type="button"
                        disabled={moderateM.isPending}
                        onClick={() => moderateM.mutate({ reviewId: r.id, status: 'published' })}
                        className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-40"
                      >
                        Publier
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <p className="eyebrow">Historique ({history.length})</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-6 py-4 font-normal">Avis</th>
                  <th className="px-4 py-4 font-normal">Produit</th>
                  <th className="px-4 py-4 font-normal">Client</th>
                  <th className="px-4 py-4 font-normal">Statut</th>
                  <th className="px-4 py-4 font-normal">Date</th>
                  <th className="px-6 py-4 text-right font-normal" />
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Aucun avis modéré pour l&apos;instant.</td></tr>
                ) : (
                  history.map((r) => {
                    const wig = one<{ name: string; slug: string }>(r.wigs as WigRef);
                    const u = one<{ full_name: string | null; email: string }>(r.users as UserRef);
                    return (
                      <tr key={r.id} className="border-b border-hairline last:border-0">
                        <td className="px-6 py-4">
                          <div className="tabular-nums text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                          <div className="mt-1 line-clamp-1 max-w-[280px] text-sm text-muted">{r.title || r.body}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">{wig?.name ?? 'n/a'}</td>
                        <td className="px-4 py-4 text-sm text-muted">{u?.full_name ?? u?.email ?? 'n/a'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${r.status === 'published' ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint'}`}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">
                          {new Date(r.moderated_at ?? r.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-3">
                            {r.status === 'published' ? (
                              <button
                                type="button"
                                disabled={moderateM.isPending}
                                onClick={() => moderateM.mutate({ reviewId: r.id, status: 'rejected' })}
                                className="text-sm text-faint transition-colors hover:text-[color:var(--danger)] disabled:opacity-40"
                              >
                                Rejeter
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={moderateM.isPending}
                                onClick={() => moderateM.mutate({ reviewId: r.id, status: 'published' })}
                                className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)] disabled:opacity-40"
                              >
                                Publier
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
