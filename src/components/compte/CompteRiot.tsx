'use client';

/* Port structurel 1:1 de sandy-stylish/src/app/(site)/[lang]/compte/page.tsx
   (en-tête + tabs horizontaux soulignés + cartes rounded-lg bg-app) et de
   logout-button.tsx (bouton + modale de confirmation). Sandy n'a que 3
   onglets (commandes/favoris/profil) ; GloryHairRiot en a 8 — tous
   conservés, stylés avec le même vocabulaire de carte que "commandes". */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { WIG_BY_ID } from '@/lib/wigs-data';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';
import { ProductCard } from '@/components/product-card';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

const TIER_LABEL: Record<string, string> = { bronze: 'Bronze', argent: 'Argent', or: 'Or', vip: 'VIP' };

type TabId = 'commandes' | 'essayages' | 'souhaits' | 'fidelite' | 'adresses' | 'paiement' | 'preferences' | 'sav';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', paid: 'Payée', shipped: 'En route', delivered: 'Livrée', cancelled: 'Annulée',
};

const TAB_IDS: TabId[] = ['commandes', 'essayages', 'souhaits', 'fidelite', 'adresses', 'paiement', 'preferences', 'sav'];
function isTabId(v: string | null): v is TabId {
  return !!v && (TAB_IDS as string[]).includes(v);
}

export function CompteRiot({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') ?? null;
  const [activeTab, setActiveTab] = useState<TabId>(isTabId(initialTab) ? initialTab : 'commandes');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { user, profile, loading, signOut } = useSession();

  const TABS: { id: TabId; label: string }[] = [
    { id: 'commandes', label: dict.account.tabOrders },
    { id: 'essayages', label: dict.account.tabTryOns },
    { id: 'souhaits', label: dict.account.tabWishlist },
    { id: 'fidelite', label: dict.account.tabLoyalty },
    { id: 'adresses', label: dict.account.tabAddresses },
    { id: 'paiement', label: dict.account.tabPayment },
    { id: 'preferences', label: dict.account.tabProfile },
    { id: 'sav', label: dict.account.tabSupport },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace(`/${lang}`);
    router.refresh();
  }

  useEffect(() => {
    if (!user) return;
    fetch('/api/email/welcome', { method: 'POST' }).catch(() => {});
  }, [user]);

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  if (loading) {
    return (
      <section className="mx-auto max-w-[1040px] px-6 py-16">
        <p className="text-sm text-faint">Chargement de votre compte…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1040px] px-6 py-12 md:px-11 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <h1 className="display text-4xl text-ink md:text-5xl">{dict.account.title}</h1>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">
            {displayName ? `${displayName} · ` : ''}{profile?.email ?? user?.email}
          </span>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] hover:text-accent"
          >
            {dict.account.signOut}
          </button>
        </div>
      </div>

      <nav aria-label="Onglets compte" className="mt-8 flex flex-wrap gap-7 border-b border-hairline text-sm">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className="-mb-px border-b-2 pb-3 transition-colors"
              style={{ borderColor: active ? 'var(--accent)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8">
        {activeTab === 'commandes' && <OrdersPanel lang={lang} dict={dict} />}
        {activeTab === 'essayages' && <EssaisPanel lang={lang} dict={dict} />}
        {activeTab === 'souhaits' && <WishlistPanel lang={lang} dict={dict} />}
        {activeTab === 'fidelite' && <FidelitePanel points={profile?.points ?? 0} />}
        {activeTab === 'adresses' && <ComingSoon title="Adresses" body="La gestion des adresses de livraison arrive bientôt." />}
        {activeTab === 'paiement' && <ComingSoon title="Moyens de paiement" body="La gestion des moyens de paiement arrive bientôt." />}
        {activeTab === 'preferences' && <ProfilePanel lang={lang} dict={dict} email={user?.email} fullName={profile?.full_name} newsletter={profile?.newsletter} tier={profile?.tier} />}
        {activeTab === 'sav' && <ComingSoon title="SAV" body="Besoin d'aide sur une commande ou une perruque ?" linkHref={`/${lang}/sav`} linkLabel="Aller au centre SAV" />}
      </div>

      {confirmOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-[420px] rounded-lg border border-hairline bg-surface p-7 md:p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="display mt-1 text-2xl text-ink">{dict.account.signOutConfirmTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{dict.account.signOutConfirmBody}</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-sm border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
                {dict.account.cancel}
              </button>
              <button type="button" disabled={signingOut} onClick={() => void handleSignOut()} className="rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60">
                {signingOut ? '…' : dict.account.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyCard({ title, body, linkHref, linkLabel }: { title: string; body: string; linkHref: string; linkLabel: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-app p-10 text-center md:p-14">
      <p className="display text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">{body}</p>
      <Link href={linkHref} className="mt-7 inline-flex rounded-full bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
        {linkLabel}
      </Link>
    </div>
  );
}

function ComingSoon({ title, body, linkHref, linkLabel }: { title: string; body: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-app p-10 text-center md:p-14">
      <p className="display text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">{body}</p>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="mt-7 inline-flex rounded-full bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function OrdersPanel({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const { data, isLoading, error } = trpc.orders.list.useQuery({ page: 1, limit: 20 });

  if (isLoading) return <p className="py-10 text-center text-sm text-faint">{dict.common.loading}</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;
  if (!data || data.orders.length === 0) {
    return <EmptyCard title={dict.account.noOrders} body={dict.account.noOrdersBody} linkHref={`/${lang}/catalogue`} linkLabel={dict.cart.seeCatalogue} />;
  }

  return (
    <ul className="space-y-5">
      {data.orders.map((o) => {
        const ref = o.id.slice(0, 8).toUpperCase();
        const d = new Date(o.created_at);
        return (
          <li key={o.id} className="rounded-lg border border-hairline bg-app p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-sm" style={{ background: 'linear-gradient(160deg, var(--accent-hi), var(--accent-deep))' }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-ink">#{ref}</p>
                <p className="mt-1 truncate text-sm text-faint">{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">{STATUS_LABEL[o.status] ?? o.status}</span>
              <span className="text-accent tabular-nums">{(o.total_cents / 100).toFixed(0)}€</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EssaisPanel({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const { data, isLoading, error } = trpc.tryon.history.list.useQuery({ limit: 20 });

  if (isLoading) return <p className="py-10 text-center text-sm text-faint">{dict.common.loading}</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;
  if (!data || data.length === 0) {
    return <EmptyCard title={dict.account.noTryOns} body={dict.account.noTryOnsBody} linkHref={`/${lang}/essayage`} linkLabel="Essayer une perruque" />;
  }

  return (
    <ul className="space-y-4">
      {data.map((e) => {
        const wigData = Array.isArray(e.wigs) ? e.wigs[0] : e.wigs;
        const slug = wigData?.slug ?? '';
        const wig = slug ? WIG_BY_ID[slug] : undefined;
        const wigName = wigData?.name ?? wig?.name ?? 'Essai';
        const d = new Date(e.created_at);
        return (
          <li key={e.id}>
            <Link href={slug ? `/${lang}/perruque/${slug}` : `/${lang}/essayage`} className="flex items-center gap-4 rounded-lg border border-hairline bg-app p-5 transition-colors hover:border-[color:var(--border-accent)]">
              {(e.snapshot_url || wig?.img) && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={e.snapshot_url ?? wig?.img ?? ''} alt={wigName} className="h-14 w-14 shrink-0 rounded-full object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-ink">{wigName}</p>
                <p className="mt-1 text-sm text-faint">{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-muted">{e.shared ? 'Partagé' : 'Privé'}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function WishlistPanel({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const { data, isLoading, error } = trpc.wishlist.list.useQuery();

  if (isLoading) return <p className="py-10 text-center text-sm text-faint">{dict.common.loading}</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;
  if (!data || data.length === 0) {
    return <EmptyCard title={dict.account.noWishlist} body={dict.account.noWishlistBody} linkHref={`/${lang}/catalogue`} linkLabel={dict.cart.seeCatalogue} />;
  }

  const wigs = data
    .map((item) => {
      const wigData = Array.isArray(item.wigs) ? item.wigs[0] : item.wigs;
      const slug = wigData?.slug ?? '';
      return slug ? WIG_BY_ID[slug] : undefined;
    })
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
      {wigs.map((w) => <ProductCard key={w.id} wig={w} lang={lang} />)}
    </div>
  );
}

function FidelitePanel({ points }: { points: number }) {
  const PALIERS = [
    { name: 'Bronze', min: 0, max: 500, reward: '−5% sur 1ère commande' },
    { name: 'Argent', min: 500, max: 1500, reward: '+1 essai Premium par mois' },
    { name: 'Or', min: 1500, max: 3000, reward: 'Livraison express offerte' },
    { name: 'VIP', min: 3000, max: 6000, reward: 'Atelier Paris 9 · pose VIP' },
  ];
  const current = PALIERS.find((p) => points >= p.min && points < p.max) ?? PALIERS[0]!;
  const next = PALIERS[PALIERS.indexOf(current) + 1];
  const progress = Math.min(100, Math.round(((points - current.min) / (current.max - current.min)) * 100));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-app p-6">
        <p className="eyebrow">Glory Club</p>
        <p className="display mt-3 text-4xl text-ink">{points.toLocaleString('fr-FR')} <span className="text-lg text-faint">pts</span></p>
        <p className="mt-2 text-sm text-muted">Niveau <span className="text-ink">{current.name}</span> · {current.reward}</p>

        <div className="mt-6">
          <p className="text-xs text-faint">{next ? `Plus que ${(next.min - points).toLocaleString('fr-FR')} pts pour ${next.name}` : 'Niveau maximum atteint'}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-app p-6">
        <p className="eyebrow">Gagner des points</p>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            { pts: '+10', label: 'Par euro dépensé' },
            { pts: '+200', label: 'Avis vérifié photo' },
            { pts: '+500', label: 'Parrainage validé' },
            { pts: '+100', label: 'Anniversaire Glory' },
          ].map((g) => (
            <li key={g.label} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-accent tabular-nums">{g.pts}</span>
              <span className="text-muted">{g.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProfilePanel({ lang, dict, email, fullName, newsletter, tier }: { lang: Locale; dict: Dictionary; email?: string | null; fullName?: string | null; newsletter?: boolean; tier?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-app p-6">
        <p className="eyebrow">Informations</p>
        <dl className="mt-5 space-y-5">
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">Nom</dt>
            <dd className="mt-1 text-ink">{fullName || 'n/a'}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">Email</dt>
            <dd className="mt-1 text-ink">{email ?? 'n/a'}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">Niveau Glory Club</dt>
            <dd className="mt-1 text-ink">{tier ? TIER_LABEL[tier] ?? tier : 'Bronze'}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">Newsletter</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-ink">
              {newsletter ? (<><CheckCircle size={14} className="text-success" /> Inscrit·e</>) : <>Non inscrit·e</>}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-hairline bg-app p-6">
        <p className="eyebrow">Sécurité</p>
        <p className="mt-4 leading-relaxed text-muted">Modifiez votre mot de passe à tout moment. Vous resterez connecté·e après le changement.</p>
        <Link href={`/${lang}/compte/mot-de-passe`} className="mt-5 inline-flex rounded-sm border border-input px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
          {dict.account.changePassword}
        </Link>
      </div>
    </div>
  );
}
