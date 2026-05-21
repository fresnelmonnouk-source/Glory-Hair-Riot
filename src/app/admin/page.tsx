import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = createServerSupabaseClient(true);

  const [ordersRes, usersRes, wigsRes, revenueRes] = await Promise.all([
    supabase.from('orders').select('id, status, total_cents, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
    supabase.from('users').select('id, email, full_name, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
    supabase.from('wigs').select('id, name, stock_quantity, active', { count: 'exact' }),
    supabase.from('orders').select('total_cents, status').in('status', ['paid', 'shipped', 'delivered']),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce((sum, o) => sum + o.total_cents, 0);
  const totalOrders = ordersRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;
  const totalWigs = wigsRes.count ?? 0;
  const recentOrders = ordersRes.data ?? [];

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'En attente',  color: '#7a5a1a', bg: 'rgba(184,135,70,.1)' },
    paid:      { label: 'Payée',       color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
    shipped:   { label: 'Expédiée',    color: '#1a5a7a', bg: 'rgba(88,150,200,.1)' },
    delivered: { label: 'Livrée',      color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
    cancelled: { label: 'Annulée',     color: 'var(--terracotta)', bg: 'rgba(200,113,88,.08)' },
  };

  const kpis = [
    { label: 'CA total', value: `${(totalRevenue / 100).toFixed(2)} €`, icon: '💰', color: 'var(--gold-deep)' },
    { label: 'Commandes', value: String(totalOrders), icon: '📦', color: '#1a5a7a' },
    { label: 'Clients', value: String(totalUsers), icon: '👤', color: '#3a7a32' },
    { label: 'Produits', value: String(totalWigs), icon: '✨', color: 'var(--terracotta)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 8 }}>
          Tableau de bord
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 40, letterSpacing: '-.02em' }}>
          Bonjour, <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>Admin.</span>
        </h1>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 40 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{
            padding: '24px', background: 'var(--surface)',
            borderRadius: 'var(--r-lg)', border: '1px solid var(--line-soft)',
            boxShadow: 'var(--sh-1)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{kpi.icon}</div>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6 }}>
              {kpi.label}
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 32, color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Commandes récentes */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line-soft)', padding: 32,
        boxShadow: 'var(--sh-1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>Commandes récentes</h2>
          <a href="/admin/commandes" style={{ fontSize: 13, color: 'var(--gold-deep)', textDecoration: 'none' }}>
            Voir toutes →
          </a>
        </div>

        {recentOrders.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Date', 'Statut', 'Total'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
                    color: 'var(--ink-mute)', borderBottom: '1px solid var(--line)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => {
                const s = statusLabels[order.status] ?? { label: String(order.status), color: 'var(--ink-soft)', bg: 'var(--surface)' };
                return (
                  <tr key={order.id} style={{ background: i % 2 ? 'transparent' : 'rgba(0,0,0,.01)' }}>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: 'var(--ink-soft)' }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 999,
                        background: s.bg, color: s.color, fontWeight: 500,
                      }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--f-display)', fontSize: 18 }}>
                      {(order.total_cents / 100).toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
            Aucune commande pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
