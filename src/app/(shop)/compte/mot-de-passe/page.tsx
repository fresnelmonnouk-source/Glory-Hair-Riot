'use client';

/**
 * Page changement de mot de passe (user déjà connecté).
 *
 * Différent de /nouveau-mot-de-passe (qui gère le flow recovery via email).
 * Ici l'user est authentifié et peut directement mettre à jour son pwd.
 *
 * Route protégée par le middleware (PROTECTED_ROUTES = ['/compte']).
 *
 * Sécurité MVP : updateUser direct sur la session active. Pour Phase 6,
 * ajouter une re-auth (saisie du mot de passe actuel + check via signIn)
 * avant de permettre le changement.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/use-session';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updErr } = await supabase.auth.updateUser({ password });

      if (updErr) {
        setError(updErr.message);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.replace('/compte'), 2500);
    } catch {
      setError('Service indisponible. Réessaie dans un instant.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section style={{ padding: '120px 32px', textAlign: 'center', minHeight: '60vh' }}>
        <p style={{
          fontFamily: 'var(--font-vt323),monospace',
          fontSize: 22, color: '#F4ECD8', opacity: 0.6,
        }}>
          ★ Vérification…
        </p>
      </section>
    );
  }

  return (
    <section className="auth-section" style={{
      // override min-height pour s'intégrer dans le layout shop (qui a déjà
      // Topbar + Nav + Footer en haut)
      paddingTop: 48,
      maxWidth: 1140,
    }}>
      <div className="auth-head">
        <h2>
          Mot de <em>passe.</em>
        </h2>
        <div className="auth-scrawl">
          → choisis-en un nouveau ✨
          <br />8 caractères minimum
        </div>
      </div>

      <div className="auth-card">
        <span aria-hidden className="tape" />
        <h3>
          Changer
        </h3>
        <div className="sub">
          // Compte {user?.email}
        </div>

        {success ? (
          <div className="auth-success">
            <b style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, fontWeight: 400, display: 'block', marginBottom: 4 }}>
              ★ Mot de passe mis à jour !
            </b>
            Redirection vers ton compte…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="cp-pwd">Nouveau mot de passe</label>
            <input
              id="cp-pwd"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 caractères"
              autoComplete="new-password"
            />

            <label htmlFor="cp-confirm">Confirme le mot de passe</label>
            <input
              id="cp-confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {error && <div className="auth-error">★ {error}</div>}

            <button type="submit" className="submit" disabled={submitting}>
              {submitting ? '⏳ Mise à jour…' : '→ Mettre à jour'}
            </button>
          </form>
        )}
      </div>

      <div className="auth-switch">
        <Link href="/compte">← Retour au compte</Link>
      </div>
    </section>
  );
}
