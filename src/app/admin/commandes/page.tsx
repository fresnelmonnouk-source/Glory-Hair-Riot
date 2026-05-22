'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const STATUSES = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
type Status = typeof STATUSES[number];

const STATUS_LABEL: Record<string, string> = {
  pending: 'EN ATT.',
  paid: 'PAYÉE',
  shipped: 'EXPÉDIÉE',
  delivered: 'LIVRÉE',
  cancelled: 'ANNULÉE',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#F5E55E',
  paid: '#D4FF3E',
  shipped: '#FF7A1A',
  delivered: '#F5E55E',
  cancelled: '#FF4D8D',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <AdminPageHeader
        title="Commandes"
        accent="commandes"
        sub={`// ${total} commande${total > 1 ? 's' : ''} au total`}
      />

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setPage(0); }}
              style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 11, letterSpacing: '0.08em',
                padding: '6px 12px',
                background: active ? '#0A0A0A' : '#F4ECD8',
                color: active ? '#D4FF3E' : '#0A0A0A',
                border: '2px solid #0A0A0A',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {s === 'all' ? 'Toutes' : STATUS_LABEL[s] ?? s}
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        border: '3px solid #0A0A0A', padding: 18,
        boxShadow: '4px 4px 0 #D4FF3E',
      }}>
        {listQ.isLoading ? (
          <Empty text="Chargement…" />
        ) : items.length === 0 ? (
          <Empty text="Aucune commande pour ce filtre." />
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-special-elite),monospace', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px dashed #0A0A0A' }}>
                <Th>Réf</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th align="right">Total</Th>
                <Th>Statut</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const rawUsers = (o as unknown as { users?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }).users;
                const u = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers;
                const next = STATUS_FLOW[o.status as string];
                return (
                  <tr key={o.id} style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)' }}>
                    <Td label="Réf">
                      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace' }}>
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Td>
                    <Td label="Client">
                      <div style={{ fontWeight: 600 }}>{u?.full_name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#5E6A64' }}>{u?.email ?? ''}</div>
                    </Td>
                    <Td label="Date">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}</Td>
                    <Td align="right" label="Total">
                      <span style={{
                        fontFamily: 'var(--font-rubik-mono-one),monospace',
                        background: '#0A0A0A', color: '#D4FF3E',
                        padding: '2px 8px', display: 'inline-block',
                      }}>
                        {Math.round((o.total_amount ?? 0) / 100).toLocaleString('fr-FR')}€
                      </span>
                    </Td>
                    <Td label="Statut">
                      <span style={{
                        fontFamily: 'var(--font-rubik-mono-one),monospace',
                        fontSize: 10, letterSpacing: '0.08em',
                        padding: '3px 8px',
                        background: STATUS_COLOR[o.status as string] ?? '#F4ECD8',
                        color: '#0A0A0A',
                        border: '1px solid #0A0A0A',
                      }}>
                        {STATUS_LABEL[o.status as string] ?? o.status}
                      </span>
                    </Td>
                    <Td align="right" label="Actions">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {next && (
                          <button
                            type="button"
                            disabled={setStatusM.isPending}
                            onClick={() => setStatusM.mutate({ orderId: o.id, status: next })}
                            style={miniBtn}
                          >
                            → {STATUS_LABEL[next] ?? next}
                          </button>
                        )}
                        {o.status !== 'cancelled' && o.status !== 'delivered' && (
                          <button
                            type="button"
                            disabled={setStatusM.isPending}
                            onClick={() => {
                              if (confirm('Annuler cette commande ?')) {
                                setStatusM.mutate({ orderId: o.id, status: 'cancelled' });
                              }
                            }}
                            style={{ ...miniBtn, background: '#FF4D8D' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center' }}>
          <button
            type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={pageBtn}
          >← Préc.</button>
          <span style={{
            fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12, color: '#D4FF3E',
          }}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}
            style={pageBtn}
          >Suiv. →</button>
        </div>
      )}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      textAlign: align ?? 'left',
      padding: '10px 8px',
      fontFamily: 'var(--font-rubik-mono-one),monospace',
      fontSize: 10, letterSpacing: '0.1em',
      color: '#5E6A64', textTransform: 'uppercase',
    }}>{children}</th>
  );
}
function Td({ children, align, label }: { children: React.ReactNode; align?: 'left' | 'right'; label?: string }) {
  return <td data-label={label} style={{ textAlign: align ?? 'left', padding: '10px 8px', verticalAlign: 'middle' }}>{children}</td>;
}
function Empty({ text }: { text: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 0',
      fontFamily: 'var(--font-special-elite),monospace', color: '#5E6A64',
    }}>{text}</div>
  );
}
const miniBtn: React.CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 10, letterSpacing: '0.06em',
  padding: '4px 8px',
  background: '#D4FF3E', color: '#0A0A0A',
  border: '2px solid #0A0A0A', cursor: 'pointer',
};
const pageBtn: React.CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 11, letterSpacing: '0.06em',
  padding: '6px 12px',
  background: 'transparent', color: '#F4ECD8',
  border: '2px solid #D4FF3E', cursor: 'pointer',
};
