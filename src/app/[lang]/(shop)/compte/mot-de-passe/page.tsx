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
 *
 * Réhabillage : même vocabulaire AuthCard que le reste du flow auth.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/use-session';
import { AUTH_INPUT, AuthCard, AuthLabel, FormError, IconBadge } from '@/components/auth/ui';
import { useLang, getDictionaryClient } from '@/i18n/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const lang = useLang();
  const dict = getDictionaryClient(lang);
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

      // Email notification (best-effort, n'échoue pas si Resend absent)
      void fetch('/api/email/password-changed', { method: 'POST' }).catch(() => {});

      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.replace(`/${lang}/compte`), 2500);
    } catch {
      setError('Service indisponible. Réessayez dans un instant.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthCard align="center">
        <p className="text-sm text-faint">Vérification…</p>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard align="center">
        <IconBadge icon="check" />
        <h1 className="display mt-6 text-3xl text-ink">Mot de passe mis à jour !</h1>
        <p className="mt-4 leading-relaxed text-muted">Redirection vers votre compte…</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard align="left">
      <p className="eyebrow">Compte {user?.email}</p>
      <h1 className="display mt-4 text-4xl text-ink">{dict.auth.password}.</h1>
      <p className="mt-4 leading-relaxed text-muted">Choisissez-en un nouveau, 8 caractères minimum.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <AuthLabel htmlFor="cp-pwd">{dict.auth.newPassword}</AuthLabel>
          <input
            id="cp-pwd"
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
          <AuthLabel htmlFor="cp-confirm">{dict.auth.confirmPassword}</AuthLabel>
          <input
            id="cp-confirm"
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
          disabled={submitting}
          className="w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {submitting ? '…' : dict.auth.update}
        </button>
      </form>

      <Link href={`/${lang}/compte`} className="mt-6 block text-center text-sm text-muted transition-colors hover:text-accent">
        ← Retour au compte
      </Link>
    </AuthCard>
  );
}
