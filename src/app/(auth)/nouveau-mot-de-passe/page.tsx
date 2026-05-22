'use client';

/**
 * Page de réinitialisation du mot de passe.
 *
 * Flow Supabase :
 *   1. User clique sur le lien dans l'email de recovery
 *   2. Supabase redirige vers /nouveau-mot-de-passe avec #access_token=...&type=recovery
 *      dans le hash
 *   3. supabase-js détecte automatiquement le hash et établit une session
 *      temporaire (type 'recovery')
 *   4. On affiche un form pour saisir le nouveau mot de passe
 *   5. supabase.auth.updateUser({ password }) applique le changement
 *   6. Redirect vers /connexion (l'user doit se reconnecter avec le nouveau pwd)
 *
 * IMPORTANT : cette route n'est PAS dans le middleware matcher → pas de
 * redirect intempestif. La session recovery est gérée côté client uniquement.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Status = 'checking' | 'ready' | 'invalid' | 'submitting' | 'success';

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 1. Au mount : vérifie qu'une session recovery valide est présente
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Listener qui capte l'événement PASSWORD_RECOVERY déclenché par le hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    // Fallback : check immédiatement la session (cas où le hash a déjà été
    // consommé avant qu'on s'abonne au listener)
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        setStatus('ready');
      } else {
        // Pas de session → l'utilisateur a peut-être ouvert l'URL sans le hash
        // ou le lien a expiré.
        setTimeout(() => {
          setStatus((s) => (s === 'checking' ? 'invalid' : s));
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setStatus('submitting');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setStatus('ready');
        return;
      }

      // Déconnexion automatique pour forcer une reconnexion avec le nouveau pwd
      await supabase.auth.signOut();
      setStatus('success');
      setTimeout(() => router.replace('/connexion'), 2500);
    } catch {
      setError('Service indisponible. Réessaie dans un instant.');
      setStatus('ready');
    }
  }

  return (
    <section className="auth-section">
      <div className="auth-head">
        <h2>
          Nouveau <em>mot de passe.</em>
        </h2>
        <div className="auth-scrawl">
          → choisis-en un solide ✨
          <br />8 caractères minimum
        </div>
      </div>

      <div className="auth-card">
        <span aria-hidden className="tape" />
        <h3>
          Réinitialiser
        </h3>
        <div className="sub">// Une fois validé, tu seras déconnecté·e pour te reconnecter avec le nouveau pwd.</div>

        {status === 'checking' && (
          <div className="auth-success" style={{ background: '#F5E55E' }}>
            <b style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, fontWeight: 400, display: 'block' }}>
              ⏳ Vérification du lien…
            </b>
          </div>
        )}

        {status === 'invalid' && (
          <>
            <div className="auth-error">
              ★ Lien invalide ou expiré. Demande un nouveau lien de réinitialisation.
            </div>
            <Link
              href="/mot-de-passe-oublie"
              className="submit"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 14 }}
            >
              → Demander un nouveau lien
            </Link>
          </>
        )}

        {status === 'success' && (
          <div className="auth-success">
            <b style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, fontWeight: 400, display: 'block', marginBottom: 4 }}>
              ★ Mot de passe mis à jour !
            </b>
            Tu vas être redirigé·e vers la connexion…
          </div>
        )}

        {(status === 'ready' || status === 'submitting') && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="np-pwd">Nouveau mot de passe</label>
            <input
              id="np-pwd"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 caractères"
              autoComplete="new-password"
            />

            <label htmlFor="np-confirm">Confirme le mot de passe</label>
            <input
              id="np-confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {error && <div className="auth-error">★ {error}</div>}

            <button type="submit" className="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? '⏳ Mise à jour…' : '→ Mettre à jour'}
            </button>
          </form>
        )}
      </div>

      <div className="auth-switch">
        Tu te souviens finalement ?{' '}
        <Link href="/connexion">Se connecter</Link>
      </div>
    </section>
  );
}
