import { createServerSupabaseClient } from '@/lib/supabase/server';

const STATUS_OPTIONS = ['tous', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: '#7a5a1a', bg: 'rgba(184,135,70,.1)' },
  paid:      { label: 'Payée',       color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
  shipped:   { label: 'Expédiée',    color: '#1a5a7a', bg: 'rgba(88,150,200,.1)' },
  delivered: { label: 'Livrée',      color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
  cancelled: { label: 'Annulée',     color: 'var(--terracotta)', bg: 'rgba(200,113,88,.08)' },
};

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const supabase = createServerSupabaseClient(true);
  const status = searchParams.status ?? 'tous';
  const page = Number(searchParams.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(`
      id, status, total_cents, subtotal_cents, shipping_cents,
      payment_method, created_at,
      delivery_name, delivery_city, delivery_country,
      users:user_id(email, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'tous') {
    query = query.eq('status', status);
  }

  const { data: orders, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.02em', marginBottom: 8 }}>
          Commandes
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {count ?? 0} commandes au total
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map((s) => {
          const isActive = status === s;
          return (
            <a key={s} href={`/admin/commandes?status=${s}`} style={{
              padding: '7px 16px', borderRadius: 999,
              background: isActive ? 'var(--ink)' : 'var(--surface)',
              color: isActive ? 'var(--bg-warm)' : 'var(--ink-soft)',
              border: `1px solid ${isActive ? 'var(--ink)' : 'var(--line)'}`,
              fontSize: 13, fontWeight: isActive ? 500 : 400, textDecoration: 'none',
            }}>
              {s === 'tous' ? 'Toutes' : STATUS_MAP[s]?.label ?? s}
            </a>
          );
        })}
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line-soft)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['ID', 'Client', 'Date', 'Statut', 'Paiement', 'Total'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left', padding: '12px 16px',
                  fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: 'var(--ink-mute)', borderBottom: '1px solid var(--line)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const s = STATUS_MAP[order.status] ?? { label: String(order.status), color: 'var(--ink-soft)', bg: 'var(--surface)' };
              const user = (order.users as unknown as { email: string; full_name: string | null }[] | null)?.[0] ?? null;
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{user?.full_name ?? 'Anonyme'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{user?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: s.bg, color: s.color, fontWeight: 500,
                    }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                    {order.payment_method === 'stripe' ? 'Carte' : order.payment_method === 'fedapay' ? 'Mobile Money' : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--f-display)', fontSize: 18 }}>
                    {(order.total_cents / 100).toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(orders ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>
            Aucune commande avec ce filtre.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`/admin/commandes?status=${status}&page=${p}`} style={{
              width: 36, height: 36, borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p === page ? 'var(--ink)' : 'var(--surface)',
              color: p === page ? 'var(--bg-warm)' : 'var(--ink)',
              border: `1px solid ${p === page ? 'var(--ink)' : 'var(--line)'}`,
              fontSize: 13, fontWeight: p === page ? 500 : 400, textDecoration: 'none',
            }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
