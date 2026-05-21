export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ComptePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, created_at')
    .eq('id', user!.id)
    .single();

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, status, total_cents, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Cliente';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'En attente',  color: '#7a5a1a', bg: 'rgba(184,135,70,.1)' },
    paid:      { label: 'Payée',       color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
    shipped:   { label: 'Expédiée',    color: '#1a5a7a', bg: 'rgba(88,150,200,.1)' },
    delivered: { label: 'Livrée',      color: '#3a7a32', bg: 'rgba(92,200,92,.08)' },
    cancelled: { label: 'Annulée',     color: 'var(--terracotta)', bg: 'rgba(200,113,88,.08)' },
  };

  return (
    <div>
      {/* Header profil */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, marginBottom: 48,
        padding: 32, background: 'var(--surface)',
        borderRadius: 'var(--r-xl)', border: '1px solid var(--line-soft)',
        boxShadow: 'var(--sh-1)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold-light), var(--gold-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: 'var(--f-display)', fontSize: 28, flexShrink: 0,
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '-.01em', marginBottom: 4 }}>
            Bonjour,{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>{displayName}.</span>
          </h1>
          {memberSince && (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {user?.email} · Membre depuis {memberSince}
            </p>
          )}
        </div>
        <Link href="/compte/profil" style={{
          padding: '10px 18px', borderRadius: 'var(--r-md)',
          border: '1px solid var(--line)', fontSize: 13,
          color: 'var(--ink-soft)', textDecoration: 'none',
        }}>
          Modifier le profil
        </Link>
      </div>

      {/* Raccourcis rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { href: '/compte/commandes', icon: '📦', label: 'Mes commandes', desc: 'Suivre et gérer vos achats' },
          { href: '/compte/essayages', icon: '✨', label: 'Mes essayages', desc: 'Résultats sauvegardés' },
          { href: '/compte/profil',    icon: '👤', label: 'Mon profil',    desc: 'Informations personnelles' },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{
            padding: '24px', background: 'var(--surface)',
            borderRadius: 'var(--r-lg)', border: '1px solid var(--line-soft)',
            textDecoration: 'none', color: 'var(--ink)',
            display: 'flex', flexDirection: 'column', gap: 8,
            transition: 'box-shadow .2s',
          }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{ fontWeight: 500, fontSize: 15 }}>{item.label}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{item.desc}</span>
          </Link>
        ))}
      </div>

      {/* Commandes récentes */}
      {recentOrders && recentOrders.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24 }}>Commandes récentes</h2>
            <Link href="/compte/commandes" style={{ fontSize: 13, color: 'var(--gold-deep)', textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentOrders.map((order) => {
              const s = statusLabels[order.status] ?? { label: String(order.status), color: 'var(--ink-soft)', bg: 'var(--surface)' };
              return (
                <div key={order.id} style={{
                  padding: '20px 24px', background: 'var(--surface)',
                  borderRadius: 'var(--r-lg)', border: '1px solid var(--line-soft)',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: s.bg, color: s.color, fontWeight: 500,
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 20 }}>
                    {(order.total_cents / 100).toFixed(2)} €
                  </span>
                  <Link href={`/compte/commandes/${order.id}`} style={{
                    padding: '8px 14px', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--line)', fontSize: 12,
                    color: 'var(--ink-soft)', textDecoration: 'none',
                  }}>
                    Détails
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!recentOrders || recentOrders.length === 0) && (
        <div style={{
          textAlign: 'center', padding: '48px 32px',
          background: 'var(--surface)', borderRadius: 'var(--r-xl)',
          border: '1px solid var(--line-soft)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 8 }}>
            Aucune commande pour l'instant
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            Explorez notre catalogue et trouvez votre prochaine couronne.
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
