'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy).
   Cartes rounded-lg border-hairline bg-app, mêmes barres/listes que le
   reste du site. Session/points/tiers réels ; l'historique de points
   (PTS_LOG) et le catalogue de récompenses (REWARDS) étaient entièrement
   fictifs — fausses commandes/dates ne correspondant jamais au vrai solde
   affiché, boutons "Utiliser"/"Activer" sans aucun onClick (ne faisaient
   rien). Retirés à la demande de Fresnel (2026-09-13) : l'historique lit
   maintenant la vraie table glory_club_points_log (déjà alimentée par
   handle_new_user + awardLoyaltyPoints, jamais lue avant) ; les 3 façons de
   gagner des points non implémentées (avis/parrainage/anniversaire) sont
   retirées, seules les 2 réelles restent. */

import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

const TIERS = [
  { name: 'Bronze', min: 0, max: 500 },
  { name: 'Argent', min: 500, max: 1500 },
  { name: 'Or', min: 1500, max: 3000 },
  { name: 'VIP', min: 3000, max: 6000 },
] as const;

const EARN_WAYS = [
  { pts: '+10', label: 'Chaque euro dépensé', note: 'par 1€' },
  { pts: '+50', label: 'Création de compte', note: '+2 essais' },
];

export function FideliteRiot() {
  const { profile, loading } = useSession();
  const pointsLogQ = trpc.loyalty.pointsLog.useQuery(undefined, { enabled: !!profile });

  const USER = useMemo(() => {
    if (profile) {
      return {
        name: profile.full_name || profile.email.split('@')[0] || 'Vous',
        memberSince: new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()),
        points: profile.points,
      };
    }
    return { name: 'Vous', memberSince: "Aujourd'hui", points: 0 };
  }, [profile]);

  const currentTier = TIERS.find((t) => USER.points >= t.min && USER.points < t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.findIndex((t) => t === currentTier) + 1];
  const progress = nextTier ? Math.round(((USER.points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;
  const toNext = nextTier ? nextTier.min - USER.points : 0;

  if (loading) {
    return (
      <section className="mx-auto max-w-[1180px] px-6 py-16">
        <p className="text-sm text-faint">Chargement du Glory Club…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
        <div>
          <h1 className="display text-4xl text-ink md:text-5xl">Glory Club</h1>
          <p className="mt-2 text-sm text-faint">{USER.name} · membre depuis {USER.memberSince}</p>
        </div>
        <div className="rounded-lg border border-hairline bg-app px-6 py-4 text-right">
          <p className="eyebrow">Solde de points</p>
          <p className="display mt-1 text-3xl text-ink">{USER.points.toLocaleString('fr-FR')}</p>
          <p className="mt-1 text-xs text-faint">
            Tier {currentTier.name}{nextTier && ` · ${toNext.toLocaleString('fr-FR')} pts pour ${nextTier.name}`}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
        <div className="flex flex-col gap-6">
          <Card title="Votre parcours">
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-faint">
              <span>{currentTier.name} ({currentTier.min.toLocaleString('fr-FR')} pts)</span>
              <span className="text-ink">{USER.points.toLocaleString('fr-FR')} pts</span>
              {nextTier && <span>{nextTier.name} ({nextTier.min.toLocaleString('fr-FR')} pts)</span>}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {TIERS.map((t) => {
                const active = t.name === currentTier.name;
                return (
                  <div
                    key={t.name}
                    className="rounded-sm border px-2 py-3 text-center"
                    style={{ borderColor: active ? 'var(--accent)' : 'var(--border-hairline)', background: active ? 'var(--surface)' : 'transparent', opacity: t.min > USER.points && !active ? 0.5 : 1 }}
                  >
                    <p className="font-display text-sm text-ink">{t.name}</p>
                    <p className="mt-1 text-[10px] text-faint">{t.min.toLocaleString('fr-FR')} pts</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Comment gagner">
            <div className="mt-4 divide-y divide-hairline text-sm">
              {EARN_WAYS.map((w, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 shrink-0 text-accent tabular-nums">{w.pts}</span>
                  <span className="flex-1 text-ink">{w.label}</span>
                  <span className="text-xs text-faint">{w.note}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Historique de points">
            <div className="mt-4 divide-y divide-hairline">
              {pointsLogQ.isLoading ? (
                <p className="py-4 text-sm text-faint">Chargement…</p>
              ) : !pointsLogQ.data || pointsLogQ.data.length === 0 ? (
                <p className="py-4 text-sm text-faint">Aucun mouvement de points pour l&apos;instant.</p>
              ) : (
                pointsLogQ.data.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm text-ink">{p.label}</p>
                      <p className="mt-0.5 text-xs text-faint">
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-sm tabular-nums ${p.value < 0 ? 'text-danger' : 'text-success'}`}>
                      {p.value > 0 ? '+' : ''}{p.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-app p-6">
      <p className="eyebrow">{title}</p>
      {children}
    </div>
  );
}
