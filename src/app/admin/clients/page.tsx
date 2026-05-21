import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AdminClientsPage() {
  const supabase = createServerSupabaseClient(true);

  const { data: users, count } = await supabase
    .from('users')
    .select('id, email, full_name, city, country, created_at, accepts_marketing', { count: 'exact' })
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.02em', marginBottom: 4 }}>
          Clients
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{count ?? 0} clients enregistrés</p>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line-soft)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['Client', 'Localisation', 'Inscription', 'Marketing'].map((h) => (
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
            {(users ?? []).map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--gold-light), var(--gold-deep))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontFamily: 'var(--f-display)', fontSize: 14,
                    }}>
                      {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        {user.full_name ?? 'Anonyme'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                  {user.city && user.country ? `${user.city}, ${user.country}` : user.country ?? '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 999,
                    background: user.accepts_marketing ? 'rgba(92,200,92,.08)' : 'rgba(0,0,0,.04)',
                    color: user.accepts_marketing ? '#3a7a32' : 'var(--ink-mute)',
                    fontWeight: 500,
                  }}>
                    {user.accepts_marketing ? '✓ Oui' : 'Non'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(users ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>
            Aucun client enregistré.
          </div>
        )}
      </div>
    </div>
  );
}
