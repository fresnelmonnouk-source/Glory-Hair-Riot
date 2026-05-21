export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function EssayagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  const supabase = createServerSupabaseClient();

  const { data: results } = await supabase
    .from('tryon_results')
    .select('id, snapshot_url, shared, share_token, created_at, wigs:wig_id(name, slug)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 6 }}>
          Espace client
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.01em' }}>
          Mes <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>essayages</span>
        </h1>
      </div>

      {results && results.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {results.map((result) => {
            const wig = (result.wigs as unknown as { name: string; slug: string }[] | null)?.[0] ?? null;
            return (
              <div key={result.id} style={{
                background: 'var(--surface)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--line-soft)', overflow: 'hidden',
              }}>
                <div style={{ aspectRatio: '3/4', background: 'var(--bg-warm)', position: 'relative' }}>
                  {result.snapshot_url ? (
                    <Image
                      src={result.snapshot_url}
                      alt={wig?.name ?? 'Essayage virtuel'}
                      fill style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 8, color: 'var(--ink-mute)',
                    }}>
                      <span style={{ fontSize: 40 }}>✨</span>
                      <span style={{ fontSize: 12 }}>Aperçu Basic</span>
                    </div>
                  )}
                  {result.shared && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      padding: '4px 10px', borderRadius: 999,
                      background: 'rgba(0,0,0,.6)', color: 'white',
                      fontSize: 10, fontWeight: 500,
                    }}>
                      Partagé
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                    {wig?.name ?? 'Perruque inconnue'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 12 }}>
                    {new Date(result.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {wig?.slug && (
                      <Link href={`/produit/${wig.slug}`} style={{
                        flex: 1, padding: '8px', textAlign: 'center',
                        background: 'var(--ink)', color: 'var(--bg-warm)',
                        borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500,
                        textDecoration: 'none',
                      }}>
                        Voir le produit
                      </Link>
                    )}
                  </div>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 8 }}>
            Aucun essayage sauvegardé
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
            Essayez des perruques virtuellement et retrouvez vos résultats ici.
          </p>
          <Link href="/essayage" style={{
            display: 'inline-flex', padding: '12px 24px',
            background: 'var(--ink)', color: 'var(--bg-warm)',
            borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Lancer un essayage
          </Link>
        </div>
      )}
    </div>
  );
}
