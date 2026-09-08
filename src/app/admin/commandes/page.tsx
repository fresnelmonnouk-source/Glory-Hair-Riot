'use client';

/* Port structurel 1:1 de sandy-stylish/.../admin/commandes/page.tsx (h1 display +
   table rounded-lg border-hairline bg-surface). Sandy a un select de statut +
   page détail par commande (server-rendered) ; GloryHairRiot n'a pas de page
   détail — le bouton "avancer au statut suivant" (client, réel) est conservé,
   stylé en bouton discret plutôt qu'un select, avec OrderStatusPill (ui.tsx,
   déjà porté) pour l'affichage du statut. Filtres + pagination = fonctionnalité
   GloryHairRiot réelle sans équivalent Sandy, stylés avec le vocabulaire pills
   déjà utilisé sur /admin/produits côté Sandy. */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { OrderStatusPill } from '@/components/admin/ui';

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
type Status = typeof STATUSES[number];

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};
const STATUS_FLOW: Record<string, Exclude<Status, 'all'> | null> = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

const PAGE_SIZE = 20;

export default function AdminCommandesPage() {
  const [status, setStatus] = useState<Status>('all');
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const utils = trpc.useUtils();
  const listQ = trpc.admin.listOrders.useQuery(
    { status, limit: PAGE_SIZE, offset },
    { staleTime: 15_000 },
  );
  const setStatusM = trpc.admin.setOrderStatus.useMutation({
    onSuccess: () => {
      void utils.admin.listOrders.invalidate();
      void utils.admin.kpis.invalidate();
    },
  });

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader title="Commandes" sub={`${total} commande${total > 1 ? 's' : ''} au total`} />

      <div className="mt-8 flex flex-wrap gap-3">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setPage(0); }}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors ${active ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-muted hover:text-ink'}`}
            >
              {s === 'all' ? 'Toutes' : STATUS_LABEL[s] ?? s}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-6 py-4 font-normal">Commande</th>
                <th className="px-4 py-4 font-normal">Client</th>
                <th className="px-4 py-4 font-normal">Date</th>
                <th className="px-4 py-4 font-normal">Statut</th>
                <th className="px-4 py-4 text-right font-normal">Total</th>
                <th className="px-6 py-4 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Aucune commande pour ce filtre.</td></tr>
              ) : (
                items.map((o) => {
                  const rawUsers = (o as unknown as { users?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }).users;
                  const u = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers;
                  const next = STATUS_FLOW[o.status as string];
                  return (
                    <tr key={o.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-5 font-display text-lg text-ink">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-5">
                        <div className="text-sm text-ink">{u?.full_name ?? '—'}</div>
                        <div className="mt-0.5 text-xs text-faint">{u?.email ?? ''}</div>
                      </td>
                      <td className="px-4 py-5 text-sm text-faint">
                        {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-5"><OrderStatusPill status={o.status as string} /></td>
                      <td className="px-4 py-5 text-right text-sm text-accent tabular-nums">
                        {Math.round((o.total_cents ?? 0) / 100).toLocaleString('fr-FR')}€
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-4">
                          {o.status !== 'cancelled' && o.status !== 'delivered' && (
                            <button
                              type="button"
                              disabled={setStatusM.isPending}
                              onClick={() => { if (confirm('Annuler cette commande ?')) setStatusM.mutate({ orderId: o.id, status: 'cancelled' }); }}
                              className="text-sm text-faint transition-colors hover:text-[color:var(--danger)] disabled:opacity-40"
                            >
                              Annuler
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              disabled={setStatusM.isPending}
                              onClick={() => setStatusM.mutate({ orderId: o.id, status: next })}
                              className="text-sm text-muted transition-colors hover:text-accent disabled:opacity-40"
                            >
                              → {STATUS_LABEL[next] ?? next}
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-sm border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-40">
            ← Précédent
          </button>
          <span className="text-sm text-faint tabular-nums">{page + 1} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages} className="rounded-sm border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-40">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
