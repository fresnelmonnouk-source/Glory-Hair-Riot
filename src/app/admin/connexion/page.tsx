'use client';

/* Espace de connexion ADMIN à part (demande explicite Fresnel, 2026-09-12)
   — avant, /admin non connecté redirigeait vers le /connexion client
   (tabs inscription/social, vocabulaire "espace membre"), source de
   confusion pour un admin. Reste hors [lang] comme tout /admin (français
   uniquement, outil interne) — voir src/app/admin/layout.tsx.
   Primitives réutilisées de src/components/auth/ui.tsx (pas de dépendance
   i18n, contrairement à AuthShell côté [lang]/(auth)/connexion). */

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AUTH_INPUT, AuthCard, AuthLabel, FormError } from '@/components/auth/ui';

export default function AdminConnexionPage() {
  return (
    <Suspense fallback={null}>
      <AdminConnexionContent />
    </Suspense>
  );
}

function AdminConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError(
          authError?.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect.'
            : (authError?.message ?? 'Connexion impossible.')
        );
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setError("Ce compte n'a pas les droits administrateur.");
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
    <AuthCard align="left">
      <p className="eyebrow">Back-office</p>
      <h1 className="display mt-4 text-4xl text-ink">Connexion admin.</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Réservé à l&apos;équipe. Vous êtes cliente ou client ?{' '}
        <Link href="/fr/connexion" className="text-accent transition-colors hover:underline">
          Espace membre
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <AuthLabel htmlFor="admin-email">E-mail</AuthLabel>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <AuthLabel htmlFor="admin-pwd">Mot de passe</AuthLabel>
          <input
            id="admin-pwd"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={AUTH_INPUT}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {loading ? '…' : 'Se connecter'}
        </button>

        <Link href="/fr/mot-de-passe-oublie" className="text-center text-sm text-muted transition-colors hover:text-accent">
          Mot de passe oublié ?
        </Link>
      </form>
    </AuthCard>
  );
}
