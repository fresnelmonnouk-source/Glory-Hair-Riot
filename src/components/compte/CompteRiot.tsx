'use client';

/**
 * Page Compte RIOT — port fidèle <section class="account"> Riot.html (2556-2609)
 * + CSS 1498-1555.
 *
 * Composant client : tabs state-driven (1 seule route /compte).
 *
 * Données mock pour l'instant. Phase 5 : intégration trpc.auth.getSession +
 * routes Supabase (orders, wishlist, addresses, preferences).
 */

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { WIG_BY_ID } from '@/lib/wigs-data';

// ─── Mock user + données ────────────────────────────

const MOCK_USER = {
  prenom: 'Olivia',
  initiales: 'O.M.',
  niveau: 'OR ★',
  email: 'olivia@maison-glory.fr',
  memberSince: 'Mars 2024',
  points: 2480,
};

interface Order {
  num: string;
  month: string;
  wigId: string;
  name: string;
  variant: string;
  passed: string;
  status: { label: string; type: 'delivered' | 'shipping' | 'pending' };
  price: number;
}

const MOCK_ORDERS: Order[] = [
  { num: '142', month: 'Mai 26', wigId: 'ginger', name: 'Ginger', variant: '22″ · Cuivre flame',  passed: '18 mai 2026 · Livrée 20 mai',  status: { label: '★ LIVRÉE', type: 'delivered' }, price: 349 },
  { num: '141', month: 'Mai 26', wigId: 'bordeaux', name: 'Bordeaux', variant: '18″ · Vin profond', passed: '02 mai 2026 · En route',          status: { label: 'EN ROUTE', type: 'shipping' }, price: 289 },
  { num: '128', month: 'Avr 26', wigId: 'velours', name: 'Velours', variant: '14″ · Chocolat',     passed: '18 avril 2026 · Livrée 20 avril', status: { label: '★ LIVRÉE', type: 'delivered' }, price: 259 },
];

interface Essai {
  date: string;
  wigId: string;
  name: string;
  provider: 'gemini' | 'openai';
  type: 'free' | 'paid';
}

const MOCK_ESSAIS: Essai[] = [
  { date: '20 mai 2026 · 14:32', wigId: 'ginger',   name: 'Ginger 22″',     provider: 'openai', type: 'free' },
  { date: '20 mai 2026 · 14:18', wigId: 'velours',  name: 'Velours 14″',    provider: 'gemini', type: 'free' },
  { date: '18 mai 2026 · 09:42', wigId: 'bordeaux', name: 'Bordeaux 22″',   provider: 'openai', type: 'paid' },
];

const MOCK_WISHLIST = ['mocha', 'argent', 'creme'];

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
const TABS: TabDef[] = [
  { id: 'commandes',   label: 'Commandes', count: String(MOCK_ORDERS.length), star: true },
  { id: 'essayages',   label: 'Essayages', count: String(MOCK_ESSAIS.length) },
  { id: 'souhaits',    label: 'Souhaits',  count: String(MOCK_WISHLIST.length) },
  { id: 'fidelite',    label: 'Glory Club', count: `${MOCK_USER.points.toLocaleString('fr-FR')} pts`, star: true, variant: 'glory' },
  { id: 'adresses',    label: 'Adresses' },
  { id: 'paiement',    label: 'Paiement' },
  { id: 'preferences', label: 'Préférences' },
  { id: 'sav',         label: 'SAV' },
];

// ─── Component ──────────────────────────────────────

export function CompteRiot() {
  const [activeTab, setActiveTab] = useState<TabId>('commandes');

  return (
    <section style={{
      padding: '80px 32px',
      borderBottom: '3px solid #FF7A1A',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
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
            {MOCK_USER.prenom}
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
          Membre depuis {MOCK_USER.memberSince}
          <br />
          <b style={{
            display: 'block', fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 22, color: '#0A0A0A', fontWeight: 400,
          }}>
            {MOCK_USER.initiales} — niveau {MOCK_USER.niveau}
          </b>
          {MOCK_USER.email}
        </div>
      </div>

      {/* Grid sidebar + content */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 2.2fr',
        gap: 32, alignItems: 'start',
      }}>
        {/* Sidebar tabs */}
        <nav aria-label="Onglets compte" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TABS.map((t, i) => (
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
          {activeTab === 'adresses' && <Placeholder title="Adresses" icon="📍" />}
          {activeTab === 'paiement' && <Placeholder title="Moyens de paiement" icon="💳" />}
          {activeTab === 'preferences' && <Placeholder title="Préférences" icon="✨" />}
          {activeTab === 'sav' && <Placeholder title="Service après-vente" icon="✉" linkHref="/sav" linkLabel="Aller au centre SAV" />}
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

function OrdersList() {
  const shadows = ['#D4FF3E', '#FF7A1A', '#F5E55E', '#FF4D8D'];
  const rotations = ['-0.5deg', '0.5deg', '-0.7deg', '0.4deg'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {MOCK_ORDERS.map((o, i) => (
        <div key={o.num} style={{
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
            fontSize: 36, color: '#0A0A0A', lineHeight: 1,
          }}>
            {o.num}
            <small style={{
              display: 'block', fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 10, color: '#5E6A64', letterSpacing: '0.1em', marginTop: 4,
            }}>
              {o.month}
            </small>
          </div>
          {/* Info */}
          <div>
            <Link href={`/perruque/${o.wigId}`} style={{ textDecoration: 'none' }}>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 22, color: '#0A0A0A', lineHeight: 1,
              }}>
                {o.name} <em style={{
                  fontFamily: 'var(--font-yeseva-one),serif',
                  fontStyle: 'italic', color: '#FF7A1A',
                }}>
                  {o.variant.split(' · ')[0]}
                </em>{' '}· {o.variant.split(' · ').slice(1).join(' · ')}
              </div>
            </Link>
            <div style={{
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 12, color: '#5E6A64', marginTop: 6, letterSpacing: '0.04em',
            }}>
              Passée le {o.passed}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 6,
              background: o.status.type === 'shipping' ? '#FF7A1A' : '#D4FF3E',
              color: '#0A0A0A',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.1em',
              padding: '3px 8px', border: '2px solid #0A0A0A',
              transform: 'rotate(-2deg)',
            }}>
              {o.status.label}
            </div>
          </div>
          {/* Price */}
          <div style={{
            background: '#0A0A0A', color: '#D4FF3E',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 22, padding: '6px 12px',
            transform: 'rotate(-2deg)', display: 'inline-block',
          }}>
            {o.price}€
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab content : Essayages ────────────────────────

function EssaisList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 13, color: '#F4ECD8', opacity: 0.6,
        marginBottom: 6,
      }}>
        Tes 8 derniers essais virtuels — clique pour relancer
      </div>
      {MOCK_ESSAIS.map((e, i) => {
        const wig = WIG_BY_ID[e.wigId];
        return (
          <Link
            key={i}
            href={`/perruque/${e.wigId}`}
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
            {wig && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={wig.img}
                alt={wig.name}
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
                {e.name}
              </div>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#5E6A64', marginTop: 4, letterSpacing: '0.04em',
              }}>
                {e.date}
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.08em',
              padding: '3px 8px',
              background: e.type === 'paid' ? '#FF7A1A' : '#D4FF3E',
              color: '#0A0A0A',
              border: '2px solid #0A0A0A',
              transform: 'rotate(-2deg)',
            }}>
              {e.type === 'paid' ? 'PREMIUM' : 'GRATUIT'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Tab content : Wishlist ─────────────────────────

function WishlistList() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
      {MOCK_WISHLIST.map((id) => {
        const w = WIG_BY_ID[id];
        if (!w) return null;
        return (
          <Link
            key={id}
            href={`/perruque/${id}`}
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
  const PALIERS = [
    { name: 'Bronze',  min: 0,    max: 500,  reward: '−5% sur 1ère commande' },
    { name: 'Argent',  min: 500,  max: 1500, reward: '+1 essai Premium par mois' },
    { name: 'OR',      min: 1500, max: 3000, reward: 'Livraison express offerte' },
    { name: 'Platine', min: 3000, max: 6000, reward: 'Atelier Paris 9 · pose VIP' },
  ];
  const current = PALIERS.find(p => MOCK_USER.points >= p.min && MOCK_USER.points < p.max) ?? PALIERS[2]!;
  const nextPalier = PALIERS[PALIERS.findIndex(p => p === current) + 1];
  const progress = Math.min(100, Math.round(((MOCK_USER.points - current.min) / (current.max - current.min)) * 100));
  const toNext = nextPalier ? nextPalier.min - MOCK_USER.points : 0;

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
        {MOCK_USER.points.toLocaleString('fr-FR')}
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

// ─── Tab content : Placeholder (adresses, paiement, etc.) ───

function Placeholder({ title, icon, linkHref, linkLabel }: {
  title: string; icon: string; linkHref?: string; linkLabel?: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      padding: 40, border: '3px dashed #0A0A0A',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
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
