'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionContent />
    </Suspense>
  );
}

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') ?? '/compte';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect.'
            : authError.message
        );
        setLoading(false);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError('Service indisponible. Réessaie dans un instant.');
      setLoading(false);
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-head">
        <h2>
          Hey, <em>salut !</em>
        </h2>
        <div className="auth-scrawl">
          → pas encore membre ?
          <br />L&apos;inscription prend 30 sec ✨
        </div>
      </div>

      <div className="auth-card">
        <span aria-hidden className="tape" />
        <h3>
          Se <em>connecter</em>
        </h3>
        <div className="sub">// Déjà membre Glory ? Bienvenue.</div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="lg-email">E-mail</label>
          <input
            id="lg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            autoComplete="email"
          />

          <label htmlFor="lg-pwd">Mot de passe</label>
          <input
            id="lg-pwd"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="row-h">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{' '}
              Se souvenir
            </label>
            <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </div>

          {error && <div className="auth-error">★ {error}</div>}

          <button type="submit" className="submit" disabled={loading}>
            {loading ? '⏳ Connexion…' : '→ Connexion'}
          </button>
        </form>

        <div className="or">ou</div>
        <div className="social-row">
          <button type="button" disabled title="Bientôt disponible">G · Google</button>
          <button type="button" disabled title="Bientôt disponible">A · Apple</button>
        </div>
      </div>

      <div className="auth-switch">
        Pas encore de compte ?{' '}
        <Link href="/inscription">Créer un compte</Link>
      </div>
    </section>
  );
}
