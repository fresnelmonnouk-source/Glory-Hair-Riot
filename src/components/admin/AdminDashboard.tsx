'use client';

/* Port structurel 1:1 de sandy-stylish/src/app/(admin)/admin/(protected)/page.tsx
   (h1 + grille de StatCard rounded-lg + section "commandes récentes" divide-y).
   4 KPIs conservés (Sandy en a 3 ; "Essais virtuels" est une vraie métrique
   GloryHairRiot, pas du remplissage). Le graphique CA et la liste de tâches
   de l'ancien dashboard étaient des données codées en dur (mock, pas de table
   dédiée) — retirés, rien de réel n'est perdu. "Top produits" gardé (données
   réelles trpc.admin.listProducts), habillé avec le même vocabulaire de carte
   que "commandes récentes" bien que Sandy n'ait pas ce widget précis. */

import Link from 'next/link';
import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { OrderStatusPill } from './ui';

function StatCard({ label, value, suffix, delta, tone = 'muted' }: {
  label: string; value: string; suffix?: string; delta: string; tone?: 'up' | 'down' | 'muted';
}) {
  const deltaColor = tone === 'up' ? 'text-success' : tone === 'down' ? 'text-danger' : 'text-muted';
  return (
    <div className="rounded-lg border border-hairline bg-surface p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-4 font-display text-[2.5rem] leading-none text-ink">
        {value}{suffix && <span className="text-2xl">{suffix}</span>}
      </p>
      <p className={`mt-3 text-sm ${deltaColor}`}>{delta}</p>
    </div>
  );
}

function formatDelta(value: number, suffix: '%' | '€' | '' = ''): { delta: string; tone: 'up' | 'down' | 'muted' } {
  if (value === 0) return { delta: '= vs hier', tone: 'muted' };
  if (value > 0) return { delta: `▲ ${value}${suffix} vs hier`, tone: 'up' };
  return { delta: `▼ ${Math.abs(value)}${suffix} vs hier`, tone: 'down' };
}

export function AdminDashboard() {
  const kpisQ = trpc.admin.kpis.useQuery(undefined, { staleTime: 60_000 });
  const productsQ = trpc.admin.listProducts.useQuery({ limit: 20 }, { staleTime: 120_000 });
  const ordersQ = trpc.admin.listOrders.useQuery({ status: 'all', limit: 5, offset: 0 }, { staleTime: 30_000 });

  const k = kpisQ.data;

  const topProducts = useMemo(() => {
    const items = productsQ.data ?? [];
    return [...items].sort((a, b) => b.sales.units - a.sales.units).slice(0, 5);
  }, [productsQ.data]);

  const recentOrders = ordersQ.data?.items ?? [];

  return (
    <div>
      <h1 className="display text-4xl text-ink md:text-5xl">Tableau de bord</h1>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Chiffre d'affaires · 24h" value={k ? k.ca.value.toLocaleString('fr-FR') : 'n/a'} suffix="€" {...formatDelta(k?.ca.delta ?? 0, '%')} />
        <StatCard label="Commandes · 24h" value={k ? String(k.orders.value) : 'n/a'} {...formatDelta(k?.orders.delta ?? 0)} />
        <StatCard label="Essais virtuels · 24h" value={k ? String(k.tryon.value) : 'n/a'} {...formatDelta(k?.tryon.delta ?? 0)} />
        <StatCard label="Panier moyen" value={k ? k.avgBasket.value.toLocaleString('fr-FR') : 'n/a'} suffix="€" {...formatDelta(k?.avgBasket.delta ?? 0, '€')} />
      </div>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-6 md:p-8">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Commandes récentes</p>
          <Link href="/admin/commandes" className="text-sm text-muted transition-colors hover:text-ink">Tout →</Link>
        </div>
        {ordersQ.isLoading ? (
          <p className="mt-6 text-muted">Chargement…</p>
        ) : recentOrders.length === 0 ? (
          <p className="mt-6 text-muted">Aucune commande pour l&apos;instant.</p>
        ) : (
          <ul className="mt-6 divide-y divide-hairline">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes`} className="group flex items-center gap-4 py-4 transition-colors">
                  <span className="font-display text-lg text-ink group-hover:text-accent">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span className="ml-auto text-sm text-faint">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <OrderStatusPill status={o.status} />
                  <span className="w-20 text-right text-sm text-accent">{Math.round((o.total_cents ?? 0) / 100).toLocaleString('fr-FR')}€</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-6 md:p-8">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Top produits · 30 jours</p>
          <Link href="/admin/produits" className="text-sm text-muted transition-colors hover:text-ink">Tout →</Link>
        </div>
        {productsQ.isLoading ? (
          <p className="mt-6 text-muted">Chargement…</p>
        ) : topProducts.length === 0 ? (
          <p className="mt-6 text-muted">Aucune vente sur la période.</p>
        ) : (
          <ul className="mt-6 divide-y divide-hairline">
            {topProducts.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/fr/perruque/${p.slug}`} target="_blank" className="group flex items-center gap-4 py-4 transition-colors">
                  <span className="w-6 shrink-0 text-sm text-faint tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-lg text-ink group-hover:text-accent">{p.name}</span>
                  <span className="ml-auto text-sm text-faint">{p.sales.units} ventes</span>
                  <span className="w-20 text-right text-sm text-accent">{Math.round(p.sales.revenue / 100).toLocaleString('fr-FR')}€</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
