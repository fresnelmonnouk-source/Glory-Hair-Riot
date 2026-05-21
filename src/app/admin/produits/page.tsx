import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminProduitsPage() {
  const supabase = createServerSupabaseClient(true);

  const { data: wigs, count } = await supabase
    .from('wigs')
    .select('id, name, slug, category, base_price, stock_quantity, active, featured, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.02em', marginBottom: 4 }}>
            Produits
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{count ?? 0} perruques au catalogue</p>
        </div>
        <button style={{
          padding: '12px 24px',
          background: 'var(--ink)', color: 'var(--bg-warm)',
          border: 'none', borderRadius: 'var(--r-md)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter un produit
        </button>
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line-soft)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['Nom', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions'].map((h) => (
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
            {(wigs ?? []).map((wig) => (
              <tr key={wig.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{wig.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{wig.slug}</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>
                  {wig.category}
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--f-display)', fontSize: 18 }}>
                  {(wig.base_price / 100).toFixed(2)} €
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: wig.stock_quantity === 0 ? 'var(--terracotta)' : wig.stock_quantity < 5 ? '#7a5a1a' : '#3a7a32',
                  }}>
                    {wig.stock_quantity === 0 ? 'Épuisé' : `${wig.stock_quantity} unités`}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 999,
                      background: wig.active ? 'rgba(92,200,92,.08)' : 'rgba(200,113,88,.08)',
                      color: wig.active ? '#3a7a32' : 'var(--terracotta)',
                      fontWeight: 500,
                    }}>
                      {wig.active ? 'Actif' : 'Inactif'}
                    </span>
                    {wig.featured && (
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 999,
                        background: 'rgba(184,135,70,.1)', color: 'var(--gold-deep)', fontWeight: 500,
                      }}>
                        ★ Mis en avant
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/produit/${wig.slug}`} style={{
                      padding: '6px 12px', borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--line)', fontSize: 12,
                      color: 'var(--ink-soft)', textDecoration: 'none',
                    }}>
                      Voir
                    </Link>
                    <button style={{
                      padding: '6px 12px', borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--line)', fontSize: 12,
                      color: 'var(--gold-deep)', background: 'none', cursor: 'pointer',
                    }}>
                      Modifier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(wigs ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>
            Aucun produit dans le catalogue.
          </div>
        )}
      </div>
    </div>
  );
}
