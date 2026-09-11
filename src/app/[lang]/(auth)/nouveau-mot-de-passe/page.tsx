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
 *
 * Réhabillage : port structurel de sandy-stylish/.../auth/reinitialisation
 * (AuthCard + IconBadge check pour l'état "terminé"). États checking/invalid
 * inchangés (pas d'équivalent Sandy exact — stylés avec le même vocabulaire).
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AUTH_INPUT, AuthCard, AuthLabel, FormError, IconBadge } from '@/components/auth/ui';
import { useLang, getDictionaryClient } from '@/i18n/client';

type Status = 'checking' | 'ready' | 'invalid' | 'submitting' | 'success';

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const lang = useLang();
  const dict = getDictionaryClient(lang);
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
      setTimeout(() => router.replace(`/${lang}/connexion`), 2500);
    } catch {
      setError('Service indisponible. Réessayez dans un instant.');
      setStatus('ready');
    }
  }

  if (status === 'checking') {
    return (
      <AuthCard align="center">
        <p className="text-sm text-faint">Vérification du lien…</p>
      </AuthCard>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthCard align="center">
        <p className="eyebrow">Lien invalide</p>
        <h1 className="display mt-4 text-3xl text-ink">Ce lien a expiré.</h1>
        <p className="mt-4 leading-relaxed text-muted">Demandez un nouveau lien de réinitialisation.</p>
        <Link href={`/${lang}/mot-de-passe-oublie`} className="mt-8 block w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          Demander un nouveau lien
        </Link>
      </AuthCard>
    );
  }

  if (status === 'success') {
    return (
      <AuthCard align="center">
        <IconBadge icon="check" />
        <h1 className="display mt-6 text-3xl text-ink">Mot de passe mis à jour !</h1>
        <p className="mt-4 leading-relaxed text-muted">Vous allez être redirigé vers la connexion…</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard align="left">
      <p className="eyebrow">Réinitialisation</p>
      <h1 className="display mt-4 text-4xl text-ink">{dict.auth.newPassword}.</h1>
      <p className="mt-4 leading-relaxed text-muted">Une fois validé, vous serez déconnecté pour vous reconnecter avec le nouveau mot de passe.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <AuthLabel htmlFor="np-pwd">{dict.auth.newPassword}</AuthLabel>
          <input
            id="np-pwd"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min. 8 caractères"
            autoComplete="new-password"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <AuthLabel htmlFor="np-confirm">{dict.auth.confirmPassword}</AuthLabel>
          <input
            id="np-confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={AUTH_INPUT}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {status === 'submitting' ? '…' : dict.auth.update}
        </button>
      </form>
    </AuthCard>
  );
}
