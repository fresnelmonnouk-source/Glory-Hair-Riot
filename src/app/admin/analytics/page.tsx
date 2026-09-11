'use client';

/* Page Analytics admin — remplace le stub catch-all pour /admin/analytics
   (routage Next.js : segment littéral prioritaire sur [...slug]). Port du
   pattern statistiques de Sandy Stylish (période + KPIs + meilleures ventes
   + répartition catégorie + statut), adapté au schéma wigs/orders. Même
   vocabulaire visuel que le reste de l'admin. Barres 100% CSS, aucune lib
   de graphiques. */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const PERIODS = [
  { days: 30 as const, label: '30 jours' },
  { days: 90 as const, label: '90 jours' },
  { days: 365 as const, label: '12 mois' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<30 | 90 | 365>(30);
  const statsQ = trpc.admin.getStatistics.useQuery({ days }, { staleTime: 10_000 });
  const stats = statsQ.data;
  const maxQty = Math.max(1, ...(stats?.topProducts.map((t) => t.quantity) ?? []));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader title="Analytics" sub="CA, meilleures ventes, répartition" />
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={`rounded-full border px-4 py-2 text-xs transition-colors ${days === p.days ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-muted hover:text-ink'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {statsQ.isLoading || !stats ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
              <p className="eyebrow">CA sur la période</p>
              <p className="mt-4 font-display text-[2.5rem] leading-none text-accent">{euros(stats.revenue)}</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
              <p className="eyebrow">Articles vendus</p>
              <p className="mt-4 font-display text-[2.5rem] leading-none text-ink">{stats.itemsSold}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-hairline bg-surface p-6">
              <p className="eyebrow">Commandes</p>
              <p className="mt-3 font-display text-[2rem] leading-none text-ink">{stats.ordersCount}</p>
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-6">
              <p className="eyebrow">Panier moyen</p>
              <p className="mt-3 font-display text-[2rem] leading-none text-ink">{euros(stats.averageBasket)}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
              <p className="eyebrow">Meilleures ventes</p>
              {stats.topProducts.length === 0 ? (
                <p className="mt-6 text-muted">Aucune vente confirmée sur cette période.</p>
              ) : (
                <ul className="mt-6 flex flex-col gap-5">
                  {stats.topProducts.map((t) => (
                    <li key={t.name} className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-display text-lg text-ink">{t.name}</span>
                          <span className="shrink-0 text-xs text-faint">{t.quantity} vendu{t.quantity > 1 ? 's' : ''} · {euros(t.revenue)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(6, Math.round((t.quantity / maxQty) * 100))}%` }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
              <p className="eyebrow">Par catégorie</p>
              {stats.categories.length === 0 ? (
                <p className="mt-6 text-muted">Aucune donnée.</p>
              ) : (
                <ul className="mt-6 flex flex-col gap-5">
                  {stats.categories.map((c) => (
                    <li key={c.code}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-ink">{c.label}</span>
                        <span className="text-sm text-muted">{c.pct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, c.pct)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {stats.statusSplit.length > 0 && (
                <div className="mt-8 border-t border-hairline pt-6">
                  <p className="eyebrow">Par statut</p>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {stats.statusSplit.map((s) => (
                      <li key={s.status} className="flex items-center justify-between">
                        <span className="text-muted">{STATUS_LABEL[s.status] ?? s.status}</span>
                        <span className="text-ink">{s.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
