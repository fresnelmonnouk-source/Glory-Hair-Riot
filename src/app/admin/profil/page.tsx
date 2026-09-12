'use client';

/* Page profil admin (mot de passe + e-mail) — n'existait nulle part dans le
   back-office avant (demande explicite Fresnel, 2026-09-12). Mot de passe :
   même pattern MVP que [lang]/(shop)/compte/mot-de-passe (updateUser direct
   sur la session active, pas de re-auth — même limitation documentée
   là-bas). E-mail : supabase.auth.updateUser({ email }) déclenche le flow
   de confirmation natif GoTrue (comportement "Secure email change" — un ou
   deux liens de confirmation selon la config Dashboard, hors de portée du
   code) ; public.users.email ne se met à jour qu'une fois confirmé, via le
   trigger posé en migration 017 (sync_user_email). */

import { useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/use-session';
import { AUTH_INPUT, AuthLabel, FormError, FormNotice } from '@/components/auth/ui';

export default function AdminProfilPage() {
  const { user, loading } = useSession();

  if (loading) {
    return <p className="text-sm text-faint">Chargement…</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="eyebrow">Mon profil</p>
        <h1 className="display mt-3 text-3xl text-ink">Compte admin</h1>
        <p className="mt-2 text-sm text-muted">Connecté en tant que {user?.email}</p>
      </div>

      <EmailSection currentEmail={user?.email ?? ''} />
      <PasswordSection />
    </div>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (email.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      setError('Cette adresse est déjà la vôtre.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updErr } = await supabase.auth.updateUser({ email: email.trim() });
      if (updErr) {
        setError(updErr.message);
        setSubmitting(false);
        return;
      }
      setSent(true);
      setSubmitting(false);
      setEmail('');
    } catch {
      setError('Service indisponible. Réessayez dans un instant.');
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
      <h2 className="text-lg font-medium text-ink">Adresse e-mail</h2>
      <p className="mt-2 text-sm text-muted">Adresse actuelle : {currentEmail}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 md:max-w-md">
        <div>
          <AuthLabel htmlFor="admin-new-email">Nouvelle adresse</AuthLabel>
          <input
            id="admin-new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nouvel-email@example.com"
            autoComplete="email"
            className={AUTH_INPUT}
          />
        </div>

        {error && <FormError>{error}</FormError>}
        {sent && (
          <FormNotice>
            Un e-mail de confirmation a été envoyé. Le changement ne prend effet qu&apos;une fois le
            lien cliqué.
          </FormNotice>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-sm bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {submitting ? '…' : 'Envoyer la confirmation'}
        </button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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
      setPassword('');
      setConfirm('');
    } catch {
      setError('Service indisponible. Réessayez dans un instant.');
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-hairline bg-surface p-6 md:p-8">
      <h2 className="text-lg font-medium text-ink">Mot de passe</h2>
      <p className="mt-2 text-sm text-muted">Minimum 8 caractères.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 md:max-w-md">
        <div>
          <AuthLabel htmlFor="admin-new-pwd">Nouveau mot de passe</AuthLabel>
          <input
            id="admin-new-pwd"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <AuthLabel htmlFor="admin-confirm-pwd">Confirmer</AuthLabel>
          <input
            id="admin-confirm-pwd"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={AUTH_INPUT}
          />
        </div>

        {error && <FormError>{error}</FormError>}
        {success && <FormNotice>Mot de passe mis à jour.</FormNotice>}

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-sm bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {submitting ? '…' : 'Mettre à jour'}
        </button>
      </form>
    </section>
  );
}
