'use client';

/* Port structurel 1:1 de sandy-stylish/.../auth/mot-de-passe-oublie
   (AuthCard centré + IconBadge mail pour l'état "envoyé"). Logique
   resetPasswordForEmail inchangée. */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AUTH_INPUT, AuthCard, AuthLabel, FormError, IconBadge } from '@/components/auth/ui';
import { useLang, getDictionaryClient } from '@/i18n/client';

export default function MotDePasseOubliePage() {
  const lang = useLang();
  const dict = getDictionaryClient(lang);
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
        // Hors /compte/* pour éviter la redirection middleware avant que la
        // session de recovery soit établie côté client.
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${lang}/nouveau-mot-de-passe`,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError('Service indisponible. Réessayez dans un instant.');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard align="center">
        <IconBadge icon="mail" />
        <h1 className="display mt-6 text-3xl text-ink">Email envoyé.</h1>
        <p className="mt-4 leading-relaxed text-muted">
          On vient d&apos;envoyer un lien de réinitialisation à <b className="text-ink">{email}</b>. Vérifiez
          votre boîte de réception (et les spams).
        </p>
        <Link href={`/${lang}/connexion`} className="mt-8 block w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          {dict.auth.backToSignIn}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard align="left">
      <p className="eyebrow">Mot de passe oublié</p>
      <h1 className="display mt-4 text-4xl text-ink">{dict.auth.resetTitle}</h1>
      <p className="mt-4 leading-relaxed text-muted">{dict.auth.resetLead}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <AuthLabel htmlFor="rp-email">{dict.auth.email}</AuthLabel>
          <input
            id="rp-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
            className={AUTH_INPUT}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {loading ? '…' : dict.auth.sendLink}
        </button>
      </form>

      <Link href={`/${lang}/connexion`} className="mt-6 block text-center text-sm text-muted transition-colors hover:text-accent">
        Vous vous souvenez finalement ? {dict.auth.signIn}
      </Link>
    </AuthCard>
  );
}
