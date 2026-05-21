'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    router.push('/compte');
    router.refresh();
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--gold-deep)', marginBottom: 8,
        }}>
          Espace client
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '-.01em', marginBottom: 6 }}>
          Bon retour,{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>Reine.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          Connectez-vous pour accéder à vos commandes et essayages.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--ink-soft)' }}>
            Adresse email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            required
            autoComplete="email"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              background: 'var(--bg-warm)',
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)' }}>
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" style={{ fontSize: 12, color: 'var(--gold-deep)', textDecoration: 'none' }}>
              Oublié ?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              background: 'var(--bg-warm)',
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(200,113,88,.08)',
            border: '1px solid rgba(200,113,88,.25)',
            borderRadius: 'var(--r-md)',
            fontSize: 13,
            color: 'var(--terracotta)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            padding: '14px',
            background: loading ? 'var(--ink-mute)' : 'var(--ink)',
            color: 'var(--bg-warm)',
            border: 'none',
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--f-body)',
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity .2s',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              Connexion…
            </>
          ) : 'Se connecter'}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
        Pas encore de compte ?{' '}
        <Link href="/inscription" style={{ color: 'var(--gold-deep)', fontWeight: 500, textDecoration: 'none' }}>
          Créer un compte
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
