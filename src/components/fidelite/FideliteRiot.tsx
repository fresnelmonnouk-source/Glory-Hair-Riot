'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy).
   Cartes rounded-lg border-hairline bg-app, mêmes barres/listes que le
   reste du site. Données et logique (session, points, tiers) inchangées —
   récompenses/historique restent mock (déjà le cas avant, pas de table
   dédiée). */

import Link from 'next/link';
import { useLang } from '@/i18n/client';
import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';

const TIERS = [
  { name: 'Bronze', min: 0, max: 500 },
  { name: 'Argent', min: 500, max: 1500 },
  { name: 'Or', min: 1500, max: 3000 },
  { name: 'VIP', min: 3000, max: 6000 },
] as const;

const REWARDS = [
  { nm: '10% sur votre prochaine commande', des: "Valable jusqu'au 30 juin 2026 · cumulable", locked: false, cta: 'Utiliser' },
  { nm: '+1 essai Premium par 100 pts', des: 'Solde actuel : 24 essais bonus disponibles', locked: false, cta: 'Activer' },
  { nm: 'Livraison express offerte', des: 'Sur votre prochaine commande dès 100€', locked: false, cta: 'Utiliser' },
  { nm: 'Accès aux drops VIP', des: 'Débloqué au tier VIP · 520 pts manquants', locked: true, cta: 'Verrouillé' },
  { nm: 'Atelier Paris 9 : pose VIP offerte', des: 'Débloqué au tier VIP', locked: true, cta: 'Verrouillé' },
];

const EARN_WAYS = [
  { pts: '+10', label: 'Chaque euro dépensé', note: 'par 1€' },
  { pts: '+50', label: 'Création de compte', note: '+2 essais' },
  { pts: '+200', label: 'Avis vérifié photo', note: 'par produit' },
  { pts: '+500', label: 'Parrainage validé', note: 'par filleul' },
  { pts: '+100', label: 'Anniversaire Glory', note: 'par an' },
];

const PTS_LOG = [
  { label: 'Commande #142 · Ginger 22″', date: '20 mai 2026', value: 349 },
  { label: 'Avis vérifié · Velours 14″', date: '15 mai 2026', value: 200 },
  { label: 'Essai Premium offert', date: '10 mai 2026', value: -250 },
  { label: 'Parrainage : Naomi A.', date: '2 mai 2026', value: 500 },
  { label: 'Commande #128 · Velours', date: '20 avril 2026', value: 259 },
  { label: 'Anniversaire Glory', date: '12 mars 2026', value: 100 },
];

export function FideliteRiot() {
  const lang = useLang();
  const { profile, loading } = useSession();

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

          <Card title="Récompenses débloquées">
            <div className="mt-4 flex flex-col gap-3">
              {REWARDS.map((r, i) => (
                <div key={i} className="flex items-center gap-4 rounded-sm border border-hairline p-3" style={{ opacity: r.locked ? 0.5 : 1 }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{r.nm}</p>
                    <p className="mt-0.5 text-xs text-faint">{r.des}</p>
                  </div>
                  <button
                    type="button"
                    disabled={r.locked}
                    className="shrink-0 rounded-sm border border-input px-3 py-1.5 text-xs text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {r.cta}
                  </button>
                </div>
              ))}
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
            <Link href={`/${lang}/compte`} className="mt-5 flex w-full items-center justify-center rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
              Parrainer une amie
            </Link>
          </Card>

          <Card title="Historique de points">
            <div className="mt-4 divide-y divide-hairline">
              {PTS_LOG.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm text-ink">{p.label}</p>
                    <p className="mt-0.5 text-xs text-faint">{p.date}</p>
                  </div>
                  <span className={`text-sm tabular-nums ${p.value < 0 ? 'text-danger' : 'text-success'}`}>
                    {p.value > 0 ? '+' : ''}{p.value}
                  </span>
                </div>
              ))}
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
