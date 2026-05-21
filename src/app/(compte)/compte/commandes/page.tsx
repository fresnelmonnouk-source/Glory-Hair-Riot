export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: '#7a5a1a', bg: 'rgba(184,135,70,.1)' },
  paid:      { label: 'Payée',       color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
  shipped:   { label: 'Expédiée',    color: '#1a5a7a', bg: 'rgba(88,150,200,.1)' },
  delivered: { label: 'Livrée',      color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
  cancelled: { label: 'Annulée',     color: 'var(--terracotta)', bg: 'rgba(200,113,88,.08)' },
};

export default async function CommandesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  const supabase = createServerSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, total_cents, subtotal_cents, shipping_cents,
      payment_method, created_at, delivery_city, delivery_country,
      shipping_method, tracking_number
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 6 }}>
          Espace client
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.01em' }}>
          Mes <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>commandes</span>
        </h1>
      </div>

      {orders && orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => {
            const s = STATUS_MAP[order.status] ?? { label: String(order.status), color: 'var(--ink-soft)', bg: 'var(--surface)' };
            return (
              <div key={order.id} style={{
                padding: '24px 28px', background: 'var(--surface)',
                borderRadius: 'var(--r-lg)', border: '1px solid var(--line-soft)',
                boxShadow: 'var(--sh-1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 999,
                        background: s.bg, color: s.color, fontWeight: 500,
                      }}>
                        {s.label}
                      </span>
                      {order.tracking_number && (
                        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                          Suivi : {order.tracking_number}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {order.delivery_city && ` · Livraison vers ${order.delivery_city}`}
                      {order.payment_method && ` · ${order.payment_method === 'stripe' ? 'Carte bancaire' : 'Mobile Money'}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>
                      {(order.total_cents / 100).toFixed(2)} €
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                      Livraison : {order.shipping_cents === 0 ? 'Gratuite' : `${(order.shipping_cents / 100).toFixed(2)} €`}
                    </div>
                  </div>
                  <Link href={`/compte/commandes/${order.id}`} style={{
                    padding: '10px 18px', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--line)', fontSize: 13,
                    color: 'var(--ink-soft)', textDecoration: 'none', flexShrink: 0,
                  }}>
                    Détails
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '64px 32px',
          background: 'var(--surface)', borderRadius: 'var(--r-xl)',
          border: '1px solid var(--line-soft)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 8 }}>
            Aucune commande
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            Votre historique de commandes apparaîtra ici.
          </p>
          <Link href="/catalogue" style={{
            display: 'inline-flex', padding: '12px 24px',
            background: 'var(--ink)', color: 'var(--bg-warm)',
            borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Explorer le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
