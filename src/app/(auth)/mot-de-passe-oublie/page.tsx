'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/compte/nouveau-mot-de-passe`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold-light), var(--gold-deep))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28, color: 'white',
        }}>
          ✉
        </div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 10 }}>
          Email{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>envoyé</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 24 }}>
          Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
          Vérifiez votre boîte mail (et vos spams).
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
          Récupération de compte
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 30, letterSpacing: '-.01em', marginBottom: 6 }}>
          Mot de passe{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>oublié ?</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
              background: 'var(--bg-warm)', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
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
              Envoi…
            </>
          ) : 'Envoyer le lien'}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
        <Link href="/connexion" style={{ color: 'var(--gold-deep)', fontWeight: 500, textDecoration: 'none' }}>
          ← Retour à la connexion
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
