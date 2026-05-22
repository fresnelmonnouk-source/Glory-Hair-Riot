'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/hooks/use-session';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const TIERS = ['all', 'bronze', 'argent', 'or', 'vip'] as const;
type Tier = typeof TIERS[number];

const TIER_COLOR: Record<string, string> = {
  bronze: '#C18A4A',
  argent: '#B8B8B8',
  or: '#F5E55E',
  vip: '#FF4D8D',
};
const ROLE_COLOR: Record<string, string> = {
  customer: '#F4ECD8',
  admin: '#FF7A1A',
  support: '#D4FF3E',
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <AdminPageHeader
        title="Clients"
        accent="ients"
        sub={`// ${total} client${total > 1 ? 's' : ''} au total`}
      />

      {/* Filtres tier */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TIERS.map((t) => {
          const active = t === tier;
          return (
            <button
              key={t}
              type="button"
              onClick={() => { setTier(t); setPage(0); }}
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
              {t === 'all' ? 'Tous' : t}
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        border: '3px solid #0A0A0A', padding: 18,
        boxShadow: '4px 4px 0 #FF4D8D',
      }}>
        {listQ.isLoading ? (
          <div style={emptyStyle}>Chargement…</div>
        ) : items.length === 0 ? (
          <div style={emptyStyle}>Aucun client.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-special-elite),monospace', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px dashed #0A0A0A' }}>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Inscrit</Th>
                <Th align="right">Points</Th>
                <Th>Tier</Th>
                <Th>News</Th>
                <Th>Rôle</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const isSelf = user?.id === c.id;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)' }}>
                    <Td>{c.full_name ?? '—'}</Td>
                    <Td>
                      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11 }}>
                        {c.email}
                      </span>
                    </Td>
                    <Td>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}</Td>
                    <Td align="right">
                      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace' }}>{c.points}</span>
                    </Td>
                    <Td>
                      <span style={{
                        fontFamily: 'var(--font-rubik-mono-one),monospace',
                        fontSize: 10, letterSpacing: '0.08em',
                        padding: '3px 8px',
                        background: TIER_COLOR[c.tier] ?? '#F4ECD8',
                        color: '#0A0A0A',
                        border: '1px solid #0A0A0A',
                        textTransform: 'uppercase',
                      }}>
                        {c.tier}
                      </span>
                    </Td>
                    <Td>{c.newsletter ? '✓' : '—'}</Td>
                    <Td>
                      <span style={{
                        fontFamily: 'var(--font-rubik-mono-one),monospace',
                        fontSize: 10, letterSpacing: '0.08em',
                        padding: '3px 8px',
                        background: ROLE_COLOR[c.role] ?? '#F4ECD8',
                        color: '#0A0A0A',
                        border: '1px solid #0A0A0A',
                        textTransform: 'uppercase',
                      }}>
                        {c.role}
                      </span>
                    </Td>
                    <Td align="right">
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
                        style={{
                          fontFamily: 'var(--font-rubik-mono-one),monospace',
                          fontSize: 11,
                          padding: '4px 6px',
                          background: '#FAF7F0',
                          border: '2px solid #0A0A0A',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          opacity: isSelf ? 0.5 : 1,
                        }}
                      >
                        <option value="customer">customer</option>
                        <option value="support">support</option>
                        <option value="admin">admin</option>
                      </select>
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
function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td style={{ textAlign: align ?? 'left', padding: '10px 8px', verticalAlign: 'middle' }}>{children}</td>;
}
const emptyStyle: React.CSSProperties = {
  textAlign: 'center', padding: '40px 0',
  fontFamily: 'var(--font-special-elite),monospace', color: '#5E6A64',
};
const pageBtn: React.CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 11, letterSpacing: '0.06em',
  padding: '6px 12px',
  background: 'transparent', color: '#F4ECD8',
  border: '2px solid #D4FF3E', cursor: 'pointer',
};
