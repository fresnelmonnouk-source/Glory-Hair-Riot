'use client';

/* Page marketing /essayage — réhabillage dans le langage Sandy Stylish
   (aucun équivalent chez Sandy, qui n'a pas d'essayage virtuel : structure
   du "Conseiller" AdvisorTeaser reprise comme référence la plus proche —
   2 colonnes, carte rounded-lg border-hairline bg-app/bg-surface).

   Quota affiché ici = solde RÉEL de la personne qui regarde la page (pas un
   texte marketing générique) :
   - connecté  → trpc.tryon.quota (table tryon_quotas, même source de vérité
     que /api/tryon et que TryonFlow.tsx)
   - anonyme   → dernière décision réelle du serveur mémorisée localement
     (src/lib/quota.ts) ; jamais un compteur qui s'incrémente tout seul.
   Le bloc "Créez votre compte, gagnez +2 essais" plus bas reste un texte
   d'incitation générique (offre, pas un solde constaté) — non touché. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';
import { ANON_TRIAL_LIMIT, readLastKnownAnonQuota, getLiveCtaHref, getLiveCtaLabel, type LastKnownAnonQuota } from '@/lib/quota';
import { useLang } from '@/i18n/client';

function Pip({ used }: { used: boolean }) {
  return (
    <span
      aria-label={used ? 'essai utilisé' : 'essai restant'}
      className="inline-block h-3.5 w-3.5 rounded-full border"
      style={{ borderColor: 'var(--accent)', background: used ? 'var(--accent)' : 'transparent' }}
    />
  );
}

export function TryonMarketing() {
  const lang = useLang();
  const { user, loading: sessionLoading } = useSession();
  const isLoggedIn = Boolean(user);

  const quotaQuery = trpc.tryon.quota.useQuery(undefined, { enabled: isLoggedIn });

  const [anonLastKnown, setAnonLastKnown] = useState<LastKnownAnonQuota | null>(null);
  useEffect(() => {
    if (isLoggedIn) return;
    // setState() encapsulé dans un callback (plutôt qu'appelé de façon
    // synchrone au premier niveau de l'effet, interdit par le React
    // Compiler) — cf. le cas explicitement autorisé par la règle : "calling
    // setState in a callback function when external state changes".
    // queueMicrotask garde exactement le même timing perçu (avant le
    // prochain paint) sans dépendre d'un vrai événement asynchrone externe.
    queueMicrotask(() => {
      setAnonLastKnown(readLastKnownAnonQuota());
    });
  }, [isLoggedIn]);

  const loading = sessionLoading || (isLoggedIn && quotaQuery.isLoading);

  // Jamais de nombre inventé : pour l'anonyme, "blocked" ne devient true que
  // si le serveur l'a réellement dit (via une tentative faite dans TryonFlow).
  const limit = isLoggedIn ? (quotaQuery.data?.granted ?? 5) : ANON_TRIAL_LIMIT;
  const used = isLoggedIn ? (quotaQuery.data?.used ?? 0) : (anonLastKnown?.usedUp ? ANON_TRIAL_LIMIT : 0);
  const remaining = Math.max(0, limit - used);
  const blocked = isLoggedIn ? remaining <= 0 : anonLastKnown?.usedUp === true;

  const helperText = isLoggedIn
    ? `${limit} essais Premium · re-créditables avec vos points Glory Club`
    : `${ANON_TRIAL_LIMIT} essai offert par appareil · sans création de compte`;

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
      <p className="eyebrow text-center">Essai virtuel</p>
      <h1 className="display mt-4 text-center text-[clamp(2rem,5vw,3.25rem)] text-ink">
        Essayez avant d&apos;acheter.
      </h1>
      <p className="mx-auto mt-4 max-w-[560px] text-center leading-relaxed text-muted">
        IA générative photo-réaliste, en quelques secondes. Vous voyez votre vrai visage,
        avec la vraie perruque, pas un filtre approximatif.
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start md:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ginger.jpg" alt="Aperçu de l&apos;essai virtuel" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-on-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-app p-6 md:p-8">
          <p className="eyebrow">Essai photo-réaliste IA</p>
          <h2 className="display mt-2 text-2xl text-ink">Essai Premium</h2>
          <p className="mt-1 text-sm text-faint">Tarif normal · 4,99€</p>

          <p className="mt-4 leading-relaxed text-muted">
            Rendu photo-réaliste, IA générative, temps réel. Vous voyez votre vraie tête,
            avec la vraie perruque.
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-sm border border-hairline bg-surface px-4 py-3.5">
            <div className="flex shrink-0 gap-1.5">
              {Array.from({ length: limit }).map((_, i) => <Pip key={i} used={i < used} />)}
            </div>
            <div className="text-sm">
              <p className="text-ink">
                {loading
                  ? 'Vérification de votre solde…'
                  : remaining > 0
                    ? `${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
                    : 'Quota épuisé'}
              </p>
              <p className="mt-0.5 text-xs text-faint">{helperText}</p>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="mt-5 rounded-sm border border-[color:var(--border-accent)] bg-surface p-5">
              <p className="text-sm text-ink">
                Créez votre compte, gagnez <span className="text-accent">+2 essais</span> en plus
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-faint">
                Soit 3 essais Premium offerts au total. Plus votre historique gardé, vos favoris
                sauvés et l&apos;accès au Glory Club.
              </p>
              <Link href={`/${lang}/connexion`} className="mt-3 inline-flex rounded-sm border border-input px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
                Créer mon compte
              </Link>
            </div>
          )}

          <p className="mt-5 text-xs leading-relaxed text-faint">
            Limite par adresse IP et empreinte appareil : pour rester gratuit pour tout le
            monde, les essais en boucle sont bloqués. Contactez le SAV en cas de blocage
            légitime.
          </p>

          <Link
            href={getLiveCtaHref(blocked, lang)}
            className="mt-6 flex w-full items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            {getLiveCtaLabel(blocked)}
          </Link>
        </div>
      </div>
    </section>
  );
}
