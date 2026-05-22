'use client';

/**
 * Page Compte RIOT — port fidèle <section class="account"> Riot.html (2556-2609)
 * + CSS 1498-1555.
 *
 * Composant client avec session Supabase réelle (Phase 5).
 * - User réel via useSession() (full_name, points, tier, email, member_since)
 * - Mocks restants : orders/essayages/wishlist (à brancher tRPC Phase 5 suite)
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  MapPin, CreditCard, Mail,
  CheckCircle,
} from 'lucide-react';
import { WIG_BY_ID } from '@/lib/wigs-data';
import { useSession } from '@/hooks/use-session';
import { trpc } from '@/lib/trpc/client';

// ─── Helpers user data ──────────────────────────────

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze',
  argent: 'Argent',
  or:     'OR ★',
  vip:    'VIP ★★',
};

function initialesFrom(fullName: string | null, email: string): string {
  const source = fullName?.trim() || email.split('@')[0] || '';
  return source
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('. ') + '.';
}

function memberSinceFrom(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase());
}

// ─── Tabs config ────────────────────────────────────

type TabId = 'commandes' | 'essayages' | 'souhaits' | 'fidelite' | 'adresses' | 'paiement' | 'preferences' | 'sav';

interface TabDef {
  id: TabId;
  label: string;
  count?: string;
  star?: boolean;
  variant?: 'default' | 'glory';
  external?: string;
}

// Onglets du compte utilisateur. Le back-office /admin est volontairement EXCLU
// de cette nav — l'admin est une zone séparée réservée aux comptes équipe
// (gated par adminProcedure tRPC + role check Supabase, Phase 5).

// ─── Component ──────────────────────────────────────

export function CompteRiot() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('commandes');
  const [signingOut, setSigningOut] = useState(false);
  const { user, profile, loading, signOut } = useSession();

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace('/');
    router.refresh();
  }

  // Tentative d'envoi welcome email (idempotent côté serveur via marker DB)
  useEffect(() => {
    if (!user) return;
    fetch('/api/email/welcome', { method: 'POST' }).catch(() => {/* silent */});
  }, [user]);

  // Données utilisateur dérivées (fallback sur des valeurs neutres si profile null)
  const userView = useMemo(() => {
    if (profile) {
      const prenom = profile.full_name?.split(' ')[0] || profile.email.split('@')[0] || 'Toi';
      return {
        prenom,
        initiales: initialesFrom(profile.full_name, profile.email),
        niveau: TIER_LABEL[profile.tier] ?? 'Bronze',
        email: profile.email,
        memberSince: memberSinceFrom(profile.created_at),
        points: profile.points,
      };
    }
    return {
      prenom: 'Toi',
      initiales: 'T.O.',
      niveau: 'Bronze',
      email: user?.email ?? '—',
      memberSince: 'Aujourd\'hui',
      points: 0,
    };
  }, [profile, user]);

  // Counts via tRPC (enabled seulement si user logged pour éviter 401)
  const ordersCount = trpc.orders.list.useQuery(
    { page: 1, limit: 1 },
    { enabled: !!user, staleTime: 60_000 },
  );
  const essaisCount = trpc.tryon.history.count.useQuery(undefined, {
    enabled: !!user, staleTime: 60_000,
  });
  const wishlistCount = trpc.wishlist.count.useQuery(undefined, {
    enabled: !!user, staleTime: 60_000,
  });

  const tabs: TabDef[] = useMemo(() => [
    { id: 'commandes',   label: 'Commandes', count: String(ordersCount.data?.total ?? 0), star: true },
    { id: 'essayages',   label: 'Essayages', count: String(essaisCount.data ?? 0) },
    { id: 'souhaits',    label: 'Souhaits',  count: String(wishlistCount.data ?? 0) },
    { id: 'fidelite',    label: 'Glory Club', count: `${userView.points.toLocaleString('fr-FR')} pts`, star: true, variant: 'glory' },
    { id: 'adresses',    label: 'Adresses' },
    { id: 'paiement',    label: 'Paiement' },
    { id: 'preferences', label: 'Préférences' },
    { id: 'sav',         label: 'SAV' },
  ], [userView.points, ordersCount.data, essaisCount.data, wishlistCount.data]);

  if (loading) {
    return (
      <section style={{ padding: '120px 32px', textAlign: 'center', minHeight: '60vh' }}>
        <p style={{
          fontFamily: 'var(--font-vt323),monospace',
          fontSize: 22, color: '#F4ECD8', opacity: 0.6,
        }}>
          ★ Chargement de ton compte…
        </p>
      </section>
    );
  }

  return (
    <section style={{
      padding: '80px 32px',
      borderBottom: '3px solid #FF7A1A',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto',
        alignItems: 'flex-end', gap: 24,
        borderBottom: '3px dashed #D4FF3E',
        paddingBottom: 28, marginBottom: 28,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(56px,7vw,110px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          SALUT,
          <br />
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', textTransform: 'none', color: '#D4FF3E',
          }}>
            {userView.prenom}
          </em>
          !
        </h2>
        <div style={{
          background: '#F4ECD8', color: '#0A0A0A',
          padding: '14px 18px',
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 13, lineHeight: 1.5,
          transform: 'rotate(2deg)',
          boxShadow: '4px 4px 0 #D4FF3E',
          textAlign: 'right',
        }}>
          Membre depuis {userView.memberSince}
          <br />
          <b style={{
            display: 'block', fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 22, color: '#0A0A0A', fontWeight: 400,
          }}>
            {userView.initiales} — niveau {userView.niveau}
          </b>
          {userView.email}
        </div>
        {/* Logout */}
        <button
          type="button"
          onClick={() => { void handleSignOut(); }}
          disabled={signingOut}
          className="btn-bold outline"
          style={{ alignSelf: 'flex-end', opacity: signingOut ? 0.5 : 1 }}
        >
          {signingOut ? '↩ Déconnexion…' : '↩ Déconnexion'}
        </button>
      </div>

      {/* Grid sidebar + content */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 2.2fr',
        gap: 32, alignItems: 'start',
      }}>
        {/* Sidebar tabs */}
        <nav aria-label="Onglets compte" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabs.map((t, i) => (
            <TabLink
              key={t.id}
              tab={t}
              active={activeTab === t.id}
              odd={i % 2 === 1}
              onClick={() => {
                if (t.external) return; // Link follow-through
                setActiveTab(t.id);
              }}
            />
          ))}
        </nav>

        {/* Content */}
        <div>
          {activeTab === 'commandes' && <OrdersList />}
          {activeTab === 'essayages' && <EssaisList />}
          {activeTab === 'souhaits' && <WishlistList />}
          {activeTab === 'fidelite' && <FideliteCard />}
          {activeTab === 'adresses' && <Placeholder title="Adresses" IconCmp={MapPin} />}
          {activeTab === 'paiement' && <Placeholder title="Moyens de paiement" IconCmp={CreditCard} />}
          {activeTab === 'preferences' && <PreferencesCard />}
          {activeTab === 'sav' && <Placeholder title="Service après-vente" IconCmp={Mail} linkHref="/sav" linkLabel="Aller au centre SAV" />}
        </div>
      </div>
    </section>
  );
}

// ─── Tab link ───────────────────────────────────────

function TabLink({ tab, active, odd, onClick }: {
  tab: TabDef; active: boolean; odd: boolean; onClick: () => void;
}) {
  const rotate = odd ? '0.5deg' : '-0.5deg';

  const baseStyle: CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#F4ECD8', color: '#0A0A0A',
    padding: '12px 16px',
    border: '3px solid #0A0A0A',
    fontFamily: 'var(--font-special-elite),monospace',
    fontSize: 14, letterSpacing: '0.04em',
    cursor: 'pointer',
    transform: `rotate(${rotate})`,
    transition: 'transform .12s, background .12s',
    textDecoration: 'none',
  };

  const variantStyle: CSSProperties =
    tab.variant === 'glory' ? { background: '#F5E55E', boxShadow: '4px 4px 0 #0A0A0A' } :
    {};

  const activeStyle: CSSProperties = active && tab.variant !== 'glory'
    ? { background: '#D4FF3E', boxShadow: '4px 4px 0 #0A0A0A' }
    : {};

  const countStyle: CSSProperties = {
    fontFamily: 'var(--font-rubik-mono-one),monospace',
    background: tab.variant === 'glory' ? '#0A0A0A' : '#0A0A0A',
    color: tab.variant === 'glory' ? '#F5E55E' : '#D4FF3E',
    padding: '2px 8px',
    fontSize: 11,
  };

  const content = (
    <>
      <span>
        {tab.star && '★ '}{tab.label}
      </span>
      {tab.count && <span style={countStyle}>{tab.count}</span>}
    </>
  );

  if (tab.external) {
    return (
      <Link href={tab.external} style={{ ...baseStyle, ...variantStyle, ...activeStyle }}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{ ...baseStyle, ...variantStyle, ...activeStyle, textAlign: 'left', width: '100%' }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.transform = 'rotate(0deg) translateX(4px)';
          if (tab.variant !== 'glory') e.currentTarget.style.background = '#D4FF3E';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotate})`;
        if (!active && tab.variant !== 'glory') {
          e.currentTarget.style.background = '#F4ECD8';
        }
      }}
    >
      {content}
    </button>
  );
}

// ─── Tab content : Commandes ────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: '#F5E55E' },
  paid:      { label: '✓ Payée',    color: '#D4FF3E' },
  shipped:   { label: 'En route',   color: '#FF7A1A' },
  delivered: { label: '✓ Livrée',   color: '#D4FF3E' },
  cancelled: { label: 'Annulée',    color: '#FF4D8D' },
};

function OrdersList() {
  const shadows = ['#D4FF3E', '#FF7A1A', '#F5E55E', '#FF4D8D'];
  const rotations = ['-0.5deg', '0.5deg', '-0.7deg', '0.4deg'];

  const { data, isLoading, error } = trpc.orders.list.useQuery({ page: 1, limit: 20 });

  if (isLoading) {
    return <p style={{ fontFamily: 'var(--font-vt323),monospace', color: '#F4ECD8', opacity: 0.6, textAlign: 'center', padding: 40 }}>★ Chargement des commandes…</p>;
  }
  if (error) {
    return <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: '#FF4D8D', textAlign: 'center', padding: 20 }}>★ {error.message}</p>;
  }
  if (!data || data.orders.length === 0) {
    return <EmptyState icon="▤" title="Aucune commande" sub="Tes commandes apparaîtront ici. Découvre le catalogue ↘" linkHref="/catalogue" linkLabel="→ Voir le catalogue" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.orders.map((o, i) => {
        const status = STATUS_LABEL[o.status] ?? { label: o.status.toUpperCase(), color: '#5E6A64' };
        const ref = o.id.slice(0, 8).toUpperCase();
        const d = new Date(o.created_at);
        const month = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }).replace('.', '');
        return (
          <div key={o.id} style={{
            background: '#F4ECD8', color: '#0A0A0A',
            padding: 18, border: '3px solid #0A0A0A',
            display: 'grid', gridTemplateColumns: '80px 1fr auto',
            gap: 24, alignItems: 'center',
            transform: `rotate(${rotations[i % rotations.length]})`,
            boxShadow: `4px 4px 0 ${shadows[i % shadows.length]}`,
            position: 'relative',
          }}>
            {/* Num + month */}
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 28, color: '#0A0A0A', lineHeight: 1,
            }}>
              {ref}
              <small style={{
                display: 'block', fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 10, color: '#5E6A64', letterSpacing: '0.1em', marginTop: 4,
              }}>
                {month}
              </small>
            </div>
            {/* Info */}
            <div>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 22, color: '#0A0A0A', lineHeight: 1,
              }}>
                Commande <em style={{
                  fontFamily: 'var(--font-yeseva-one),serif',
                  fontStyle: 'italic', color: '#FF7A1A',
                }}>#{ref}</em>
              </div>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 12, color: '#5E6A64', marginTop: 6, letterSpacing: '0.04em',
              }}>
                {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{
                display: 'inline-block', marginTop: 6,
                background: status.color,
                color: '#0A0A0A',
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.1em',
                padding: '3px 8px', border: '2px solid #0A0A0A',
                transform: 'rotate(-2deg)',
              }}>
                {status.label}
              </div>
            </div>
            {/* Price */}
            <div style={{
              background: '#0A0A0A', color: '#D4FF3E',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 22, padding: '6px 12px',
              transform: 'rotate(-2deg)', display: 'inline-block',
            }}>
              {(o.total_cents / 100).toFixed(0)}€
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab content : Essayages ────────────────────────

function EssaisList() {
  const { data, isLoading, error } = trpc.tryon.history.list.useQuery({ limit: 20 });

  if (isLoading) {
    return <p style={{ fontFamily: 'var(--font-vt323),monospace', color: '#F4ECD8', opacity: 0.6, textAlign: 'center', padding: 40 }}>★ Chargement des essais…</p>;
  }
  if (error) {
    return <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: '#FF4D8D', textAlign: 'center', padding: 20 }}>★ {error.message}</p>;
  }
  if (!data || data.length === 0) {
    return <EmptyState icon="●" title="Aucun essai" sub="Tes essais virtuels apparaîtront ici" linkHref="/essayage" linkLabel="▶ Essayer une perruque" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 13, color: '#F4ECD8', opacity: 0.6,
        marginBottom: 6,
      }}>
        Tes derniers essais virtuels — clique pour relancer
      </div>
      {data.map((e, i) => {
        const wigData = Array.isArray(e.wigs) ? e.wigs[0] : e.wigs;
        const slug = wigData?.slug ?? '';
        const wig = slug ? WIG_BY_ID[slug] : undefined;
        const wigName = wigData?.name ?? wig?.name ?? 'Essai';
        const d = new Date(e.created_at);
        const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) +
          ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return (
          <Link
            key={e.id}
            href={slug ? `/perruque/${slug}` : '/essayage'}
            style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: 14, border: '3px solid #0A0A0A',
              display: 'grid', gridTemplateColumns: '60px 1fr auto',
              gap: 18, alignItems: 'center',
              transform: i % 2 === 0 ? 'rotate(-0.4deg)' : 'rotate(0.4deg)',
              boxShadow: i % 2 === 0 ? '4px 4px 0 #D4FF3E' : '4px 4px 0 #FF7A1A',
              textDecoration: 'none',
            }}
          >
            {(e.snapshot_url || wig?.img) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={e.snapshot_url ?? wig?.img ?? ''}
                alt={wigName}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: '2px solid #0A0A0A', objectFit: 'cover',
                }}
              />
            )}
            <div>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 20, lineHeight: 1,
              }}>
                {wigName}
              </div>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#5E6A64', marginTop: 4, letterSpacing: '0.04em',
              }}>
                {dateLabel}
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.08em',
              padding: '3px 8px',
              background: e.shared ? '#FF7A1A' : '#D4FF3E',
              color: '#0A0A0A',
              border: '2px solid #0A0A0A',
              transform: 'rotate(-2deg)',
            }}>
              {e.shared ? 'PARTAGÉ' : 'PRIVÉ'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Tab content : Wishlist ─────────────────────────

function WishlistList() {
  const { data, isLoading, error } = trpc.wishlist.list.useQuery();

  if (isLoading) {
    return <p style={{ fontFamily: 'var(--font-vt323),monospace', color: '#F4ECD8', opacity: 0.6, textAlign: 'center', padding: 40 }}>★ Chargement de la wishlist…</p>;
  }
  if (error) {
    return <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: '#FF4D8D', textAlign: 'center', padding: 20 }}>★ {error.message}</p>;
  }
  if (!data || data.length === 0) {
    return <EmptyState icon="♡" title="Aucun souhait" sub="Ajoute des perruques à tes souhaits depuis le catalogue" linkHref="/catalogue" linkLabel="→ Voir le catalogue" />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
      {data.map((item) => {
        const wigData = Array.isArray(item.wigs) ? item.wigs[0] : item.wigs;
        const slug = wigData?.slug ?? '';
        const w = slug ? WIG_BY_ID[slug] : undefined;
        if (!w) return null;
        return (
          <Link
            key={item.id}
            href={`/perruque/${slug}`}
            style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: 12, border: '3px solid #0A0A0A',
              transform: 'rotate(-0.6deg)',
              boxShadow: '4px 4px 0 #FF4D8D',
              textDecoration: 'none', display: 'block',
            }}
          >
            <div style={{ background: '#0A0A0A', aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={w.img}
                alt={w.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '10px 4px 0' }}>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 20, lineHeight: 1,
              }}>
                {w.name}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 8,
                fontFamily: 'var(--font-special-elite),monospace', fontSize: 12,
                color: '#5E6A64',
              }}>
                <span>{w.tone}</span>
                <span style={{
                  background: '#D4FF3E', color: '#0A0A0A',
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 14, padding: '2px 8px',
                  transform: 'rotate(-2deg)', display: 'inline-block',
                }}>
                  {w.price}€
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Tab content : Glory Club ───────────────────────

function FideliteCard() {
  const { profile } = useSession();
  const userPoints = profile?.points ?? 0;
  const PALIERS = [
    { name: 'Bronze',  min: 0,    max: 500,  reward: '−5% sur 1ère commande' },
    { name: 'Argent',  min: 500,  max: 1500, reward: '+1 essai Premium par mois' },
    { name: 'OR',      min: 1500, max: 3000, reward: 'Livraison express offerte' },
    { name: 'VIP',     min: 3000, max: 6000, reward: 'Atelier Paris 9 · pose VIP' },
  ];
  const current = PALIERS.find(p => userPoints >= p.min && userPoints < p.max) ?? PALIERS[0]!;
  const nextPalier = PALIERS[PALIERS.findIndex(p => p === current) + 1];
  const progress = Math.min(100, Math.round(((userPoints - current.min) / (current.max - current.min)) * 100));
  const toNext = nextPalier ? nextPalier.min - userPoints : 0;

  return (
    <div style={{
      background: '#F5E55E', color: '#0A0A0A',
      padding: 28, border: '3px solid #0A0A0A',
      transform: 'rotate(-0.5deg)',
      boxShadow: '8px 8px 0 #FF7A1A',
    }}>
      <div style={{
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 36, lineHeight: 1, marginBottom: 4,
      }}>
        ★ Glory Club
      </div>
      <div style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 64, lineHeight: 1, color: '#0A0A0A',
        letterSpacing: '-0.02em', margin: '8px 0',
      }}>
        {userPoints.toLocaleString('fr-FR')}
        <span style={{ fontSize: 24, color: '#FF7A1A', marginLeft: 8 }}>pts</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 14, color: '#0A0A0A',
      }}>
        Niveau <b style={{ background: '#0A0A0A', color: '#F5E55E', padding: '0 6px', fontWeight: 400 }}>
          {current.name}
        </b> · {current.reward}
      </div>

      {/* Progress */}
      <div style={{ marginTop: 22 }}>
        <div style={{
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          {nextPalier
            ? `// Plus que ${toNext.toLocaleString('fr-FR')} pts pour ${nextPalier.name}`
            : '// Tu es au niveau max ★'}
        </div>
        <div style={{
          height: 12, background: '#F4ECD8',
          border: '2px solid #0A0A0A', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress}%`, background: '#FF7A1A',
            borderRight: '2px solid #0A0A0A',
          }} />
        </div>
      </div>

      {/* Bonus list */}
      <div style={{
        marginTop: 22, paddingTop: 14,
        borderTop: '2px dashed #0A0A0A',
      }}>
        <div style={{
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          // Comment gagner des points
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { pts: '+10', label: 'Par euro dépensé' },
            { pts: '+200', label: 'Avis vérifié photo' },
            { pts: '+500', label: 'Parrainage validé' },
            { pts: '+100', label: 'Anniversaire Glory' },
          ].map((g) => (
            <li key={g.label} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center',
              fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
            }}>
              <span style={{
                background: '#0A0A0A', color: '#D4FF3E',
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 12, padding: '2px 8px', textAlign: 'center', minWidth: 50,
              }}>
                {g.pts}
              </span>
              <span>{g.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Empty state (commandes/essayages/souhaits vides) ───

function EmptyState({ title, sub, icon, linkHref, linkLabel }: {
  title: string; sub: string; icon: string; linkHref: string; linkLabel: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      padding: 40, border: '3px dashed #0A0A0A',
      textAlign: 'center',
      transform: 'rotate(-0.5deg)',
    }}>
      <div style={{
        fontSize: 48, marginBottom: 12,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        color: '#FF7A1A',
      }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 32, textTransform: 'uppercase', lineHeight: 1,
      }}>{title}</h3>
      <p style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 14, color: '#5E6A64', marginTop: 12, maxWidth: 360, marginInline: 'auto',
      }}>{sub}</p>
      <Link href={linkHref} className="btn-bold orange" style={{ marginTop: 18, display: 'inline-flex' }}>
        {linkLabel}
      </Link>
    </div>
  );
}

// ─── Tab content : Préférences (sécurité du compte) ───

function PreferencesCard() {
  const { user, profile } = useSession();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Compte */}
      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        padding: 24, border: '3px solid #0A0A0A',
        transform: 'rotate(-0.4deg)',
        boxShadow: '6px 6px 0 #D4FF3E',
        position: 'relative',
      }}>
        <span aria-hidden style={{
          position: 'absolute', top: -12, left: 24,
          width: 120, height: 22,
          background: 'rgba(212,255,62,.7)',
          borderLeft: '1px dashed rgba(0,0,0,.3)',
          borderRight: '1px dashed rgba(0,0,0,.3)',
          transform: 'rotate(-3deg)',
        }} />
        <h3 style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 24, marginBottom: 12,
          paddingBottom: 8, borderBottom: '2px dashed #0A0A0A',
        }}>
          Compte
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-special-elite),monospace', fontSize: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <span style={{ color: '#5E6A64', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</span>
            <span>{user?.email ?? '—'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <span style={{ color: '#5E6A64', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nom</span>
            <span>{profile?.full_name ?? '—'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <span style={{ color: '#5E6A64', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Newsletter</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {profile?.newsletter
                ? (<><CheckCircle size={14} color="#5cc864" /> Inscrit·e</>)
                : (<>— Non inscrit·e</>)
              }
            </span>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        padding: 24, border: '3px solid #0A0A0A',
        transform: 'rotate(0.4deg)',
        boxShadow: '6px 6px 0 #FF7A1A',
        position: 'relative',
      }}>
        <span aria-hidden style={{
          position: 'absolute', top: -12, left: 24,
          width: 120, height: 22,
          background: 'rgba(255,122,26,.6)',
          borderLeft: '1px dashed rgba(0,0,0,.3)',
          borderRight: '1px dashed rgba(0,0,0,.3)',
          transform: 'rotate(-3deg)',
        }} />
        <h3 style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 24, marginBottom: 12,
          paddingBottom: 8, borderBottom: '2px dashed #0A0A0A',
        }}>
          Sécurité
        </h3>
        <p style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 13, color: '#5E6A64', lineHeight: 1.5, marginBottom: 14,
        }}>
          Modifie ton mot de passe à tout moment. Tu seras toujours connecté·e après le changement.
        </p>
        <Link href="/compte/mot-de-passe" className="btn-bold">
          → Changer mon mot de passe
        </Link>
      </div>

      <div style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 11, color: '#5E6A64',
        textAlign: 'center', marginTop: 8,
      }}>
        // D&apos;autres préférences arrivent (langue, notifications, RGPD…)
      </div>
    </div>
  );
}

// ─── Tab content : Placeholder (adresses, paiement, etc.) ───

function Placeholder({ title, IconCmp, linkHref, linkLabel }: {
  title: string; IconCmp: typeof MapPin; linkHref?: string; linkLabel?: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      padding: 40, border: '3px dashed #0A0A0A',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <IconCmp size={48} strokeWidth={2} color="#FF7A1A" />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 36, textTransform: 'uppercase', lineHeight: 1,
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 14, color: '#5E6A64', marginTop: 12, maxWidth: 360, marginInline: 'auto',
      }}>
        Cette section sera disponible dans la prochaine mise à jour. En attendant, contacte le SAV pour toute modification.
      </p>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="btn-bold" style={{ marginTop: 18, display: 'inline-flex' }}>
          → {linkLabel}
        </Link>
      )}
    </div>
  );
}
