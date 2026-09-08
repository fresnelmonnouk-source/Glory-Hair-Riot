'use client';

/* Port structurel 1:1 de sandy-stylish/.../auth/inscription (AuthShell +
   AuthTabs + SignupForm). Champs conservés à l'identique (GHR n'a pas de
   confirmation de mot de passe, contrairement à Sandy — pas ajoutée pour
   rester visuel-only). Logique signUp inchangée. */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AUTH_INPUT, AuthLabel, AuthShell, FormError, IconBadge } from '@/components/auth/ui';

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
    <AuthShell
      eyebrow="Rejoindre Glory Hair"
      title="Créez votre compte."
      lead="+2 essais Premium offerts à la création, et l'accès au Glory Club dès votre première commande."
      bullets={['+2 essais virtuels Premium offerts', 'Glory Club : points fidélité', 'Historique de commandes']}
    >
      <div className="mb-7 flex gap-1 rounded-sm border border-hairline p-1">
        <Link href="/connexion" className="flex-1 rounded-[3px] py-2.5 text-center text-sm text-muted transition-colors hover:text-ink">
          Connexion
        </Link>
        <span className="flex-1 rounded-[3px] bg-accent py-2.5 text-center text-sm font-medium text-on-accent">
          Inscription
        </span>
      </div>

      {success ? (
        <div className="text-center">
          <IconBadge icon="mail" />
          <h2 className="display mt-6 text-2xl text-ink">Compte créé !</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Un email de confirmation vient de partir vers <b className="text-ink">{email}</b>. Cliquez sur le
            lien dedans pour activer votre compte.
          </p>
          <Link href="/connexion" className="mt-8 block w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
            Aller à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <AuthLabel htmlFor="sg-name">Prénom</AuthLabel>
            <input
              id="sg-name"
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Naomi"
              autoComplete="given-name"
              className={AUTH_INPUT}
            />
          </div>

          <div>
            <AuthLabel htmlFor="sg-email">E-mail</AuthLabel>
            <input
              id="sg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoComplete="email"
              className={AUTH_INPUT}
            />
          </div>

          <div>
            <AuthLabel htmlFor="sg-pwd">Mot de passe</AuthLabel>
            <input
              id="sg-pwd"
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

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="h-4 w-4 rounded-[3px] accent-[color:var(--accent)]"
            />
            Recevoir la newsletter (1×/mois)
          </label>

          {error && <FormError>{error}</FormError>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
          >
            {loading ? '…' : 'Créer mon compte'}
          </button>

          <p className="text-xs leading-relaxed text-faint">
            En créant un compte, vous acceptez nos{' '}
            <a href="/sav" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">CGV</a>{' '}
            et notre{' '}
            <a href="/sav" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted">politique de confidentialité</a>.
          </p>

          <Link href="/connexion" className="w-full rounded-sm border border-line px-6 py-3 text-center text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] hover:text-accent">
            Déjà membre ?
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
