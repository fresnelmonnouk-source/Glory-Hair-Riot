'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function InscriptionPage() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: prenom, newsletter },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/compte`,
        },
      });

      if (authError) {
        setError(
          authError.message === 'User already registered'
            ? 'Cet email est déjà utilisé. Connecte-toi à la place.'
            : authError.message
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
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
          Bienvenue, <em>beauté !</em>
        </h2>
        <div className="auth-scrawl">
          → +5 essais Premium offerts
          <br />à la création ✨
        </div>
      </div>

      <div className="auth-card orange">
        <span aria-hidden className="tape" />
        <h3>
          <em>Créer</em> un compte
        </h3>
        <div className="sub">// 30 secondes — promis.</div>

        {success ? (
          <>
            <div className="auth-success">
              <b style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, fontWeight: 400, display: 'block', marginBottom: 4 }}>
                ★ Compte créé !
              </b>
              Un email de confirmation vient de partir vers <b style={{ fontWeight: 400 }}>{email}</b>. Clique sur le lien dedans pour activer ton compte.
            </div>
            <div style={{ marginTop: 14 }}>
              <Link href="/connexion" className="submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                → Aller à la connexion
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="sg-name">Prénom</label>
            <input
              id="sg-name"
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Naomi"
              autoComplete="given-name"
            />

            <label htmlFor="sg-email">E-mail</label>
            <input
              id="sg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoComplete="email"
            />

            <label htmlFor="sg-pwd">Mot de passe</label>
            <input
              id="sg-pwd"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 caractères"
              autoComplete="new-password"
            />

            <div className="row-h">
              <label>
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />{' '}
                Recevoir la newsletter (1×/mois)
              </label>
            </div>

            {error && <div className="auth-error">★ {error}</div>}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? '⏳ Création…' : '+ Créer mon compte'}
            </button>

            <div className="legal">
              En créant un compte, tu acceptes nos{' '}
              <a href="/sav" target="_blank" rel="noopener noreferrer">CGV</a>{' '}
              et notre{' '}
              <a href="/sav" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>.
            </div>
          </form>
        )}
      </div>

      <div className="auth-switch">
        Déjà membre ?{' '}
        <Link href="/connexion">Se connecter</Link>
      </div>
    </section>
  );
}
