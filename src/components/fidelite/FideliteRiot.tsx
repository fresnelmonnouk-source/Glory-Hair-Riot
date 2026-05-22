'use client';

/**
 * Page Glory Club RIOT — port fidèle <section class="fid"> Riot.html (2933-3022)
 * + CSS 489-589.
 *
 * Phase 5 : user et points lus via useSession() (Supabase).
 * Historique pts mock pour l'instant (à brancher tRPC trpc.points.list).
 */

import Link from 'next/link';
import { useMemo, type CSSProperties } from 'react';
import { useSession } from '@/hooks/use-session';

const TIERS = [
  { name: 'Bronze', min: 0,    max: 500,  ico: '●'  },
  { name: 'Argent', min: 500,  max: 1500, ico: '●'  },
  { name: 'Or',     min: 1500, max: 3000, ico: '★'  },
  { name: 'VIP',    min: 3000, max: 6000, ico: '★★' },
] as const;

const REWARDS = [
  { ico: '10%', nm: '10% sur ta prochaine commande', des: 'Valable jusqu\'au 30 juin 2026 · cumulable',           locked: false, cta: 'Utiliser →' },
  { ico: '▶',   nm: '+1 essai Premium par 100 pts',   des: 'Solde actuel : 24 essais bonus disponibles',           locked: false, cta: 'Activer →' },
  { ico: '✦',   nm: 'Livraison express offerte',      des: 'Sur ta prochaine commande dès 100€',                   locked: false, cta: 'Utiliser →' },
  { ico: 'VIP', nm: 'Accès aux drops VIP',            des: 'Débloqué au tier VIP · 520 pts manquants',             locked: true,  cta: 'Verrouillé' },
  { ico: '★',   nm: 'Atelier Paris 9 — pose VIP offerte', des: 'Débloqué au tier VIP',                              locked: true,  cta: 'Verrouillé' },
];

const EARN_WAYS: { pts: string; bg: string; label: string; note: string }[] = [
  { pts: '+10',  bg: '#D4FF3E', label: 'Chaque euro dépensé',  note: 'par 1€' },
  { pts: '+50',  bg: '#F5E55E', label: 'Création de compte',   note: '+5 essais' },
  { pts: '+200', bg: '#FF7A1A', label: 'Avis vérifié photo',   note: 'par produit' },
  { pts: '+500', bg: '#FF4D8D', label: 'Parrainage validé',    note: 'par filleul' },
  { pts: '+100', bg: '#D4FF3E', label: 'Anniversaire Glory',   note: 'par an' },
];

const PTS_LOG: { label: string; date: string; value: number }[] = [
  { label: 'Commande #142 · Ginger 22″',     date: '20 mai 2026',    value:  349 },
  { label: 'Avis vérifié · Velours 14″',     date: '15 mai 2026',    value:  200 },
  { label: 'Essai Premium offert',           date: '10 mai 2026',    value: -250 },
  { label: 'Parrainage : Naomi A.',          date: '2 mai 2026',     value:  500 },
  { label: 'Commande #128 · Velours',        date: '20 avril 2026',  value:  259 },
  { label: 'Anniversaire Glory ★',           date: '12 mars 2026',   value:  100 },
];

export function FideliteRiot() {
  const { profile, loading } = useSession();

  const USER = useMemo(() => {
    if (profile) {
      const prenom = profile.full_name?.split(' ')[0] || profile.email.split('@')[0] || 'Toi';
      return {
        prenom,
        initiales: profile.full_name || profile.email.split('@')[0] || 'Toi',
        memberSince: new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()),
        points: profile.points,
      };
    }
    return { prenom: 'Toi', initiales: 'Toi', memberSince: 'Aujourd\'hui', points: 0 };
  }, [profile]);

  const currentTier = TIERS.find((t) => USER.points >= t.min && USER.points < t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.findIndex((t) => t === currentTier) + 1];
  const progress = nextTier
    ? Math.round(((USER.points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;
  const toNext = nextTier ? nextTier.min - USER.points : 0;

  if (loading) {
    return (
      <section style={{ padding: '120px 32px', textAlign: 'center', minHeight: '60vh' }}>
        <p style={{
          fontFamily: 'var(--font-vt323),monospace',
          fontSize: 22, color: '#F4ECD8', opacity: 0.6,
        }}>
          ★ Chargement du Glory Club…
        </p>
      </section>
    );
  }

  return (
    <section style={{
      padding: '80px 32px',
      borderBottom: '3px solid #D4FF3E',
      position: 'relative',
      overflow: 'hidden',
      background: `
        repeating-linear-gradient(135deg, transparent 0 60px, rgba(245,229,94,.04) 60px 62px),
        #0E1B14
      `,
    }}>
      {/* Head */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 24,
        borderBottom: '3px dashed #D4FF3E',
        paddingBottom: 28, marginBottom: 32,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(64px,9vw,140px)',
            lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
          }}>
            ★{' '}
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', textTransform: 'none', color: '#F5E55E',
            }}>
              Glory
            </em>
            <br />
            Club
            <span style={{
              background: '#F5E55E', color: '#0A0A0A',
              padding: '0 0.08em', display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>.</span>
          </h2>
          <div style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 13, color: '#5E6A64',
            letterSpacing: '0.04em', marginTop: 8,
          }}>
            // {USER.initiales} · membre depuis {USER.memberSince}
          </div>
        </div>

        <div style={{
          background: '#F5E55E', color: '#0A0A0A',
          padding: '16px 24px',
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 12, letterSpacing: '0.06em',
          textAlign: 'right',
          transform: 'rotate(2deg)',
          border: '3px solid #0A0A0A',
          boxShadow: '5px 5px 0 #FF7A1A',
        }}>
          Solde de points
          <b style={{
            display: 'block',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 36, color: '#0A0A0A', marginTop: 4,
            letterSpacing: '-0.02em',
          }}>
            {USER.points.toLocaleString('fr-FR')}
          </b>
          <small style={{
            display: 'block', fontSize: 10, color: '#5E6A64',
            marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            ★ Tier {currentTier.name.toUpperCase()}{nextTier && ` · ${toNext.toLocaleString('fr-FR')} pts pour ${nextTier.name.toUpperCase()}`}
          </small>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr',
        gap: 24, alignItems: 'start',
      }}>
        {/* Left col : parcours + récompenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ParcoursCard
            current={currentTier.name}
            currentPts={USER.points}
            nextMin={nextTier?.min ?? null}
            currentMin={currentTier.min}
            progress={progress}
          />
          <RecompensesCard />
        </div>

        {/* Right col : comment gagner + historique */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ComentGagnerCard />
          <HistoriqueCard />
        </div>
      </div>
    </section>
  );
}

// ═══ Parcours card ══════════════════════════════════

function ParcoursCard({ currentPts, nextMin, currentMin, progress }: {
  current: string; currentPts: number; nextMin: number | null; currentMin: number; progress: number;
}) {
  return (
    <Card tape="rgba(245,229,94,.6)" shadow="#FF7A1A" rotate="-0.5deg">
      <H3>Ton <em style={italicAccent}>parcours</em></H3>

      {/* Progress bar */}
      <div style={{
        height: 14, background: '#0E1B14',
        border: '2px solid #0A0A0A', position: 'relative',
        marginTop: 14, marginBottom: 8, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progress}%`, background: '#FF7A1A',
          transition: 'width .35s',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 12, color: '#5E6A64', letterSpacing: '0.04em',
      }}>
        <span>OR ({currentMin.toLocaleString('fr-FR')} pts)</span>
        <span>
          <b style={{ color: '#0A0A0A', fontWeight: 400 }}>{currentPts.toLocaleString('fr-FR')} pts</b>
        </span>
        {nextMin && <span>VIP ({nextMin.toLocaleString('fr-FR')} pts)</span>}
      </div>

      {/* Ladder */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginTop: 18,
      }}>
        {TIERS.map((t) => {
          const isActive = t.name === 'Or';
          const isFuture = t.name === 'VIP';
          return (
            <div key={t.name} style={{
              background: isActive ? '#F5E55E' : 'transparent',
              border: '2px solid #0A0A0A',
              padding: '10px 8px',
              textAlign: 'center',
              transform: isActive ? 'rotate(-1deg)' : 'rotate(0deg)',
              boxShadow: isActive ? '3px 3px 0 #0A0A0A' : 'none',
              opacity: isFuture ? 0.4 : 1,
              position: 'relative', zIndex: isActive ? 2 : 1,
            }}>
              <div style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 18, color: '#FF7A1A',
                marginBottom: 4, lineHeight: 1,
              }}>{t.ico}</div>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 16, lineHeight: 1, color: '#0A0A0A',
              }}>{t.name}</div>
              <div style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.08em',
                color: isActive ? '#0A0A0A' : '#5E6A64', marginTop: 4,
              }}>
                {t.min.toLocaleString('fr-FR')} pts
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ═══ Récompenses card ═══════════════════════════════

function RecompensesCard() {
  return (
    <Card tape="rgba(212,255,62,.6)" shadow="#D4FF3E" rotate="0.5deg">
      <H3>Récompenses <em style={italicAccent}>débloquées</em> ★</H3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {REWARDS.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '64px 1fr auto',
            gap: 14, alignItems: 'center',
            padding: 12,
            background: r.locked ? '#FAF7F0' : '#F4ECD8',
            border: '2px solid #0A0A0A',
            opacity: r.locked ? 0.55 : 1,
          }}>
            <div style={{
              width: 56, height: 56,
              background: r.locked ? '#ccc' : '#D4FF3E',
              border: '2px solid #0A0A0A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 14, color: '#0A0A0A',
            }}>
              {r.ico}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 16, lineHeight: 1.1, color: '#0A0A0A',
              }}>
                {r.nm}
              </div>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#5E6A64',
                marginTop: 4, letterSpacing: '0.04em',
              }}>
                {r.des}
              </div>
            </div>
            <button
              type="button"
              disabled={r.locked}
              style={{
                background: r.locked ? '#ccc' : '#0A0A0A',
                color: r.locked ? '#5E6A64' : '#D4FF3E',
                border: '2px solid #0A0A0A',
                padding: '6px 12px',
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.08em',
                cursor: r.locked ? 'not-allowed' : 'pointer',
              }}
            >
              {r.cta}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═══ Comment gagner card ════════════════════════════

function ComentGagnerCard() {
  return (
    <Card tape="rgba(255,77,141,.55)" shadow="#FF4D8D" rotate="-0.4deg">
      <H3>Comment <em style={italicAccent}>gagner</em> ?</H3>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
        marginTop: 8,
      }}>
        {EARN_WAYS.map((w, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto',
            gap: 10, alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < EARN_WAYS.length - 1 ? '2px dashed #0A0A0A' : 'none',
          }}>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 14, background: w.bg, color: '#0A0A0A',
              padding: '3px 8px',
              border: '2px solid #0A0A0A',
            }}>
              {w.pts}
            </span>
            <span style={{ color: '#0A0A0A' }}>{w.label}</span>
            <span style={{ color: '#5E6A64', fontSize: 11 }}>{w.note}</span>
          </div>
        ))}
      </div>

      <Link
        href="/compte?preview=1"
        className="btn-bold orange full"
        style={{ marginTop: 14 }}
      >
        → Parrainer une amie
      </Link>
    </Card>
  );
}

// ═══ Historique card ════════════════════════════════

function HistoriqueCard() {
  return (
    <Card tape="rgba(245,229,94,.6)" shadow="#FF7A1A" rotate="0.5deg">
      <H3>Historique <em style={italicAccent}>de points</em></H3>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6 }}>
        {PTS_LOG.map((p, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            gap: 10, alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < PTS_LOG.length - 1 ? '2px dashed #0A0A0A' : 'none',
          }}>
            <div>
              <b style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 13, color: '#0A0A0A', fontWeight: 400,
                display: 'block',
              }}>
                {p.label}
              </b>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#5E6A64',
                letterSpacing: '0.04em', marginTop: 2,
              }}>
                {p.date}
              </div>
            </div>
            <span style={{
              background: p.value < 0 ? '#FF4D8D' : '#D4FF3E',
              color: '#0A0A0A',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 14, padding: '4px 10px',
              border: '2px solid #0A0A0A',
              transform: 'rotate(-2deg)',
              display: 'inline-block',
            }}>
              {p.value > 0 ? '+' : ''}{p.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═══ Primitives ═════════════════════════════════════

function Card({ children, tape, shadow, rotate }: {
  children: React.ReactNode; tape: string; shadow: string; rotate: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A',
      padding: 22,
      transform: `rotate(${rotate})`,
      boxShadow: `6px 6px 0 ${shadow}`,
      position: 'relative',
    }}>
      <span aria-hidden style={{
        position: 'absolute', top: -12, left: 24,
        width: 120, height: 22,
        background: tape,
        borderLeft: '1px dashed rgba(0,0,0,.3)',
        borderRight: '1px dashed rgba(0,0,0,.3)',
        transform: 'rotate(-3deg)',
      }} />
      {children}
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-permanent-marker),cursive',
      fontSize: 22, marginBottom: 10,
      paddingBottom: 8, borderBottom: '2px dashed #0A0A0A',
      color: '#0A0A0A',
    }}>
      {children}
    </h3>
  );
}

const italicAccent: CSSProperties = {
  fontFamily: 'var(--font-yeseva-one),serif',
  fontStyle: 'italic', color: '#FF7A1A',
};
