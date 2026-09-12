'use client';

/* Port structurel 1:1 du header de sandy-stylish/src/app/(admin)/admin/(protected)/layout.tsx
   (logo + badge "Admin" + déconnexion + lien "voir le site"). L'ancienne
   barre de recherche/notifications/CTA n'avait aucune fonctionnalité réelle
   (recherche qui ne cherchait rien, notifications qui n'affichaient rien) —
   retirée, rien n'est perdu. Bouton déconnexion ajouté : absent avant
   (aucun moyen de se déconnecter de l'admin), aligné sur le pattern
   useSession().signOut() déjà utilisé dans l'espace compte. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

export function AdminTopbar() {
  const router = useRouter();
  const { signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  // Nom de marque admin-éditable (rebrand, Phase 2) — repli "Glory Hair"
  // tant que /admin/reglages n'a rien configuré ou pendant le chargement.
  const brandQ = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const brandName = brandQ.data?.brand.name ?? 'Glory Hair';

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-deepest/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-6">
        <Link href="/admin" className="font-logo text-[26px] leading-none text-ink">
          {brandName}
        </Link>
        <span className="rounded-full border border-hairline px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
          Admin
        </span>
        <div className="ml-auto flex items-center gap-6">
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
          >
            {signingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
          <Link href="/" target="_blank" className="text-sm text-muted transition-colors hover:text-ink">
            Voir le site ↗
          </Link>
        </div>
      </div>
    </header>
  );
}
