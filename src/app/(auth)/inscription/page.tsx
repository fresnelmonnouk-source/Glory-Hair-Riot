'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function InscriptionPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/compte`,
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Cet email est déjà utilisé. Connectez-vous à la place.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold-light), var(--gold-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: 'white', fontSize: 28,
        }}>
          ✓
        </div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 10 }}>
          Vérifiez votre{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>email</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 24 }}>
          Un lien de confirmation a été envoyé à <strong>{email}</strong>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <Link href="/connexion" style={{
          display: 'inline-flex', padding: '12px 24px',
          background: 'var(--ink)', color: 'var(--bg-warm)',
          borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
          textDecoration: 'none',
        }}>
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--gold-deep)', marginBottom: 8,
        }}>
          Rejoindre Glory Hair
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 32, letterSpacing: '-.01em', marginBottom: 6 }}>
          Créer votre{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>compte.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          Accédez à l'essayage virtuel, vos commandes et conseils personnalisés.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--ink-soft)' }}>
            Prénom et nom
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Yasmine Diallo"
            required
            autoComplete="name"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              background: 'var(--bg-warm)', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

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
              background: 'var(--bg-warm)', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--ink-soft)' }}>
            Mot de passe <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(8 caractères min.)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--f-body)', fontSize: 14,
              background: 'var(--bg-warm)', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {password.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
              {[4, 7, 10].map((threshold, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: password.length > threshold
                    ? i === 0 ? 'var(--terracotta)' : i === 1 ? 'var(--gold)' : '#5a9e4a'
                    : 'var(--line)',
                  transition: 'background .3s',
                }} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(200,113,88,.08)',
            border: '1px solid rgba(200,113,88,.25)',
            borderRadius: 'var(--r-md)',
            fontSize: 13, color: 'var(--terracotta)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4, padding: '14px',
            background: loading ? 'var(--ink-mute)' : 'var(--ink)',
            color: 'var(--bg-warm)', border: 'none',
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              Création…
            </>
          ) : 'Créer mon compte'}
        </button>

        <p style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'center', lineHeight: 1.5 }}>
          En créant un compte, vous acceptez nos{' '}
          <a href="#" style={{ color: 'var(--gold-deep)', textDecoration: 'none' }}>CGV</a>{' '}
          et notre{' '}
          <a href="#" style={{ color: 'var(--gold-deep)', textDecoration: 'none' }}>Politique de confidentialité</a>.
        </p>
      </form>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
        Déjà un compte ?{' '}
        <Link href="/connexion" style={{ color: 'var(--gold-deep)', fontWeight: 500, textDecoration: 'none' }}>
          Se connecter
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
