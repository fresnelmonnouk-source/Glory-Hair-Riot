'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/compte/nouveau-mot-de-passe`,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError('Service indisponible. Réessaie dans un instant.');
      setLoading(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-head">
        <h2>
          Oups, <em>oublié&nbsp;?</em>
        </h2>
        <div className="auth-scrawl">
          → on t&apos;envoie un lien
          <br />pour réinitialiser ✨
        </div>
      </div>

      <div className="auth-card">
        <span aria-hidden className="tape" />
        <h3>
          Réinitialiser
        </h3>
        <div className="sub">// On t&apos;envoie un lien par mail.</div>

        {sent ? (
          <>
            <div className="auth-success">
              <b style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, fontWeight: 400, display: 'block', marginBottom: 4 }}>
                ★ Email envoyé.
              </b>
              On vient d&apos;envoyer un lien de réinitialisation à <b style={{ fontWeight: 400 }}>{email}</b>. Vérifie ta boîte de réception (et les spams).
            </div>
            <div style={{ marginTop: 14 }}>
              <Link
                href="/connexion"
                className="submit"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                ← Retour à la connexion
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="rp-email">E-mail du compte</label>
            <input
              id="rp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoComplete="email"
            />

            {error && <div className="auth-error">★ {error}</div>}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? '⏳ Envoi…' : '→ Envoyer le lien'}
            </button>

            <div className="legal" style={{ textAlign: 'center', marginTop: 18 }}>
              Tu te souviens finalement ?{' '}
              <Link href="/connexion" style={{ color: '#0A0A0A', textDecoration: 'underline', textDecorationColor: '#FF7A1A', textDecorationThickness: 2 }}>
                Connexion
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="auth-switch">
        Pas encore de compte ?{' '}
        <Link href="/inscription">Créer un compte</Link>
      </div>
    </section>
  );
}
