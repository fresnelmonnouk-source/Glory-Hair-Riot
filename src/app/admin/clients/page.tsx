'use client';

/* Port structurel 1:1 de sandy-stylish/.../admin/clients/page.tsx (h1 display +
   table rounded-lg border-hairline bg-surface). Sandy n'a ni tier de fidélité
   ni gestion de rôle depuis cette table (juste un lien détail) ; GloryHairRiot
   a le Glory Club (tier/points, réel) et la gestion de rôle (customer/support/
   admin, réel) — conservés, stylés avec pills + select alignés sur le
   vocabulaire de la table. */

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/hooks/use-session';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const TIERS = ['all', 'bronze', 'argent', 'or', 'vip'] as const;
type Tier = typeof TIERS[number];

const PAGE_SIZE = 20;

export default function AdminClientsPage() {
  const { user } = useSession();
  const [tier, setTier] = useState<Tier>('all');
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const utils = trpc.useUtils();
  const listQ = trpc.admin.listCustomers.useQuery(
    { tier, limit: PAGE_SIZE, offset },
    { staleTime: 30_000 },
  );
  const setRoleM = trpc.admin.setUserRole.useMutation({
    onSuccess: () => { void utils.admin.listCustomers.invalidate(); },
    onError: (err) => alert(err.message),
  });

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader title="Clients" sub={`${total} client${total > 1 ? 's' : ''} au total`} />

      <div className="mt-8 flex flex-wrap gap-3">
        {TIERS.map((t) => {
          const active = t === tier;
          return (
            <button
              key={t}
              type="button"
              onClick={() => { setTier(t); setPage(0); }}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm capitalize transition-colors ${active ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-muted hover:text-ink'}`}
            >
              {t === 'all' ? 'Tous' : t}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-6 py-4 font-normal">Client</th>
                <th className="px-4 py-4 font-normal">Inscrit</th>
                <th className="px-4 py-4 text-right font-normal">Points</th>
                <th className="px-4 py-4 font-normal">Tier</th>
                <th className="px-4 py-4 font-normal">News.</th>
                <th className="px-6 py-4 text-right font-normal">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Aucun client.</td></tr>
              ) : (
                items.map((c) => {
                  const isSelf = user?.id === c.id;
                  return (
                    <tr key={c.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-5">
                        <div className="font-display text-lg text-ink">{c.full_name ?? 'n/a'}</div>
                        <div className="mt-0.5 text-xs text-faint">{c.email}</div>
                      </td>
                      <td className="px-4 py-5 text-sm text-faint">
                        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-5 text-right text-sm text-ink tabular-nums">{c.points.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-5">
                        <span className="inline-flex items-center rounded-full border border-hairline px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-sm text-faint">
                        {c.newsletter ? <Check size={14} className="text-success" aria-label="Inscrit" /> : <X size={14} className="text-faint" aria-label="Non inscrit" />}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <select
                          value={c.role}
                          disabled={isSelf || setRoleM.isPending}
                          onChange={(e) => {
                            const newRole = e.target.value as 'customer' | 'admin' | 'support';
                            if (newRole !== c.role) {
                              if (confirm(`Changer le rôle de ${c.email} vers "${newRole}" ?`)) {
                                setRoleM.mutate({ userId: c.id, role: newRole });
                              }
                            }
                          }}
                          className="rounded-sm border border-input bg-transparent px-2 py-1.5 text-sm text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="customer">customer</option>
                          <option value="support">support</option>
                          <option value="admin">admin</option>
                        </select>
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
