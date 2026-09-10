'use client';

/* Port structurel 1:1 de sandy-stylish/.../auth/connexion (AuthShell +
   AuthTabs + LoginForm) — logique inchangée : signInWithPassword, redirect
   param, checkbox "se souvenir" (décoratif chez Sandy aussi, cf.
   defaultChecked non branché), boutons sociaux désactivés ("bientôt
   disponible", réel côté GHR). */

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AUTH_INPUT, AuthLabel, AuthShell, FormError } from '@/components/auth/ui';

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
      setError('Service indisponible. Réessayez dans un instant.');
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Espace membre"
      title="Content de vous revoir."
      lead="Retrouvez votre historique de commandes, vos favoris et votre styliste IA Élodie."
      bullets={['Suivi de commandes', 'Favoris sauvegardés', 'Conseil Élodie personnalisé']}
    >
      <div className="mb-7 flex gap-1 rounded-sm border border-hairline p-1">
        <span className="flex-1 rounded-[3px] bg-accent py-2.5 text-center text-sm font-medium text-on-accent">
          Connexion
        </span>
        <Link href="/inscription" className="flex-1 rounded-[3px] py-2.5 text-center text-sm text-muted transition-colors hover:text-ink">
          Inscription
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <AuthLabel htmlFor="lg-email">E-mail</AuthLabel>
          <input
            id="lg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <AuthLabel htmlFor="lg-pwd">Mot de passe</AuthLabel>
          <input
            id="lg-pwd"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={AUTH_INPUT}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded-[3px] accent-[color:var(--accent)]"
            />
            Se souvenir
          </label>
          <Link href="/mot-de-passe-oublie" className="text-sm text-muted transition-colors hover:text-accent">
            Mot de passe oublié ?
          </Link>
        </div>

        {error && <FormError>{error}</FormError>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {loading ? '…' : 'Connexion'}
        </button>

        <div className="flex items-center gap-3 text-xs text-faint">
          <span className="h-px flex-1 bg-[color:var(--border-hairline)]" />
          ou
          <span className="h-px flex-1 bg-[color:var(--border-hairline)]" />
        </div>

        <div className="flex gap-2">
          <button type="button" disabled title="Bientôt disponible" className="w-full rounded-sm border border-line px-4 py-2.5 text-sm text-faint disabled:cursor-not-allowed">
            Google
          </button>
        </div>

        <Link href="/inscription" className="w-full rounded-sm border border-line px-6 py-3 text-center text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] hover:text-accent">
          Pas encore de compte ?
        </Link>
      </form>
    </AuthShell>
  );
}
