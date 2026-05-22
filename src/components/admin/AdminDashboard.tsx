'use client';

/**
 * AdminDashboard — KPIs, top produits, commandes récentes branchés sur tRPC admin.*.
 *
 * Données réelles via :
 *  - trpc.admin.kpis (CA 24h, Commandes 24h, Essais 24h, Panier moyen)
 *  - trpc.admin.listProducts (top produits par ventes)
 *  - trpc.admin.listOrders (commandes récentes)
 *
 * Les tasks restent locales (Phase 6 : table tasks).
 */

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/hooks/use-session';

// ─── Tasks (local, en attendant la table dédiée) ────

const TASKS = [
  { id: 1, label: 'Valider 3 retours en attente',  priority: 'URGENT'  as const, done: false },
  { id: 2, label: 'Restocker Bordeaux 18″',         priority: 'HAUT'    as const, done: false },
  { id: 3, label: 'Publier Issue 01 du magazine',   priority: 'FAIT'    as const, done: true  },
  { id: 4, label: 'Répondre 8 messages Élodie',     priority: 'HAUT'    as const, done: false },
  { id: 5, label: 'Lancer la promo Été (-15%)',     priority: 'SEMAINE' as const, done: false },
];

const SPARKS = [
  '0,28 10,22 20,26 30,18 40,20 50,14 60,16 70,8 80,4',
  '0,24 10,28 20,18 30,22 40,16 50,18 60,10 70,14 80,8',
  '0,30 10,26 20,28 30,20 40,16 50,12 60,14 70,8 80,4',
  '0,18 10,22 20,16 30,20 40,24 50,18 60,22 70,26 80,24',
];
const SHADOWS = ['#D4FF3E', '#FF7A1A', '#F5E55E', '#FF4D8D'];

function formatDelta(value: number, suffix: '%' | '€' | '' = ''): { delta: string; direction: 'up' | 'down' } {
  if (value === 0) return { delta: '= vs hier', direction: 'up' };
  if (value > 0) return { delta: `↑ ${value}${suffix} vs hier`, direction: 'up' };
  return { delta: `↓ ${Math.abs(value)}${suffix} vs hier`, direction: 'down' };
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'EN ATT.',
  paid: 'PAYÉE',
  shipped: 'EXPÉDIÉE',
  delivered: 'LIVRÉE',
  cancelled: 'ANNULÉE',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#F5E55E',
  paid: '#D4FF3E',
  shipped: '#FF7A1A',
  delivered: '#F5E55E',
  cancelled: '#FF4D8D',
};

function shortRef(id: string): string {
  return '#' + id.slice(0, 8).toUpperCase();
}

// ─── Component ──────────────────────────────────────

export function AdminDashboard() {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const { profile } = useSession();
  const prenom = profile?.full_name?.split(' ')[0] ?? 'Admin';

  const kpisQ = trpc.admin.kpis.useQuery(undefined, { staleTime: 60_000 });
  const productsQ = trpc.admin.listProducts.useQuery({ limit: 20 }, { staleTime: 120_000 });
  const ordersQ = trpc.admin.listOrders.useQuery({ status: 'all', limit: 4, offset: 0 }, { staleTime: 30_000 });

  const KPIS = useMemo(() => {
    const k = kpisQ.data;
    return [
      {
        label: 'CA · 24h',
        value: k ? k.ca.value.toLocaleString('fr-FR') : '—',
        suffix: '€',
        ...formatDelta(k?.ca.delta ?? 0, '%'),
        shadow: SHADOWS[0], spark: SPARKS[0],
      },
      {
        label: 'Commandes · 24h',
        value: k ? String(k.orders.value) : '—',
        suffix: '',
        ...formatDelta(k?.orders.delta ?? 0),
        shadow: SHADOWS[1], spark: SPARKS[1],
      },
      {
        label: 'Essais virtuels · 24h',
        value: k ? String(k.tryon.value) : '—',
        suffix: '',
        ...formatDelta(k?.tryon.delta ?? 0),
        shadow: SHADOWS[2], spark: SPARKS[2],
      },
      {
        label: 'Panier moyen',
        value: k ? k.avgBasket.value.toLocaleString('fr-FR') : '—',
        suffix: '€',
        ...formatDelta(k?.avgBasket.delta ?? 0, '€'),
        shadow: SHADOWS[3], spark: SPARKS[3],
      },
    ];
  }, [kpisQ.data]);

  const TOP_PRODUCTS = useMemo(() => {
    const items = productsQ.data ?? [];
    const sorted = [...items].sort((a, b) => b.sales.units - a.sales.units).slice(0, 5);
    return sorted.map((p, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      name: p.name,
      id: p.slug,
      sales: p.sales.units,
      ca: `${Math.round(p.sales.revenue / 100).toLocaleString('fr-FR')}€`,
      stars: p.featured ? '★★' : '★',
      stock: p.stock_quantity > 0 ? ('live' as const) : ('oos' as const),
    }));
  }, [productsQ.data]);

  const RECENT_ORDERS = useMemo(() => {
    const items = ordersQ.data?.items ?? [];
    return items.map((o) => {
      const raw = (o as unknown as { users?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null }).users;
      const u = Array.isArray(raw) ? raw[0] : raw;
      const client = u?.full_name?.split(' ')[0] || u?.email?.split('@')[0] || 'Anonyme';
      return {
        num: shortRef(o.id),
        client,
        product: '—',
        total: `${Math.round((o.total_amount ?? 0) / 100).toLocaleString('fr-FR')}€`,
        status: o.status as keyof typeof STATUS_LABEL,
      };
    });
  }, [ordersQ.data]);

  const [tasksState, setTasksState] = useState(TASKS);

  function toggleTask(id: number) {
    setTasksState((arr) => arr.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 18, flexWrap: 'wrap',
        borderBottom: '3px dashed #D4FF3E', paddingBottom: 18,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(48px,6vw,84px)',
            lineHeight: 0.9, textTransform: 'uppercase', color: '#F4ECD8',
          }}>
            Bonjour,{' '}
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', textTransform: 'none', color: '#D4FF3E',
            }}>
              {prenom}
            </em>
            <span style={{
              background: '#FF7A1A', color: '#0A0A0A',
              padding: '0 0.06em', display: 'inline-block',
            }}>.</span>
          </h1>
          <div style={{
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 11, letterSpacing: '0.1em',
            color: '#5E6A64', marginTop: 6, textTransform: 'lowercase',
          }}>
            // Aujourd&apos;hui · {today}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn-bold outline">↓ Exporter (CSV)</button>
          <button type="button" className="btn-bold orange">+ Nouvelle commande</button>
        </div>
      </div>

      {/* KPI grid : 4 colonnes fixes (port fidèle Admin.html line 239) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}>
        {KPIS.map((k, i) => {
          const rotations = ['-0.5deg', '0.5deg', '-0.7deg', '0.6deg'];
          return (
            <div key={i} style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: 18, border: '3px solid #0A0A0A',
              transform: `rotate(${rotations[i]})`,
              boxShadow: `4px 4px 0 ${k.shadow}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.1em',
                color: '#5E6A64', marginBottom: 8,
              }}>
                // {k.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 38, lineHeight: 1,
                color: '#0A0A0A', letterSpacing: '-0.02em',
              }}>
                {k.value}
                {k.suffix && (
                  <small style={{
                    fontFamily: 'var(--font-yeseva-one),serif',
                    fontStyle: 'italic', fontSize: 24,
                  }}>{k.suffix}</small>
                )}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 10,
                background: k.direction === 'up' ? '#D4FF3E' : '#FF4D8D',
                color: '#0A0A0A',
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, letterSpacing: '0.04em',
                padding: '3px 8px',
                border: '2px solid #0A0A0A',
              }}>
                {k.delta}
              </span>
              {/* Sparkline en haut à droite (port fidèle Admin.html line 268-271) */}
              <svg
                viewBox="0 0 80 36"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute', top: 18, right: 14,
                  width: 80, height: 36, opacity: 0.85,
                }}
              >
                <polyline points={k.spark} fill="none" stroke="#0A0A0A" strokeWidth="2" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Chart + Tasks (port fidèle .dash-grid 1.5fr/1fr Admin.html line 275) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 20,
        marginBottom: 24,
      }}>
        <RevenueChart />
        <TasksList tasks={tasksState} onToggle={toggleTask} />
      </div>

      {/* Top products + Recent orders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: 20,
      }}>
        <TopProducts items={TOP_PRODUCTS} loading={productsQ.isLoading} />
        <RecentOrders items={RECENT_ORDERS} loading={ordersQ.isLoading} />
      </div>
    </div>
  );
}

type TopProduct = {
  rank: string; name: string; id: string; sales: number; ca: string;
  stars: string; stock: 'live' | 'oos';
};
type RecentOrder = {
  num: string; client: string; product: string; total: string;
  status: keyof typeof STATUS_LABEL;
};

// ─── Sub-components ─────────────────────────────────

function RevenueChart() {
  return (
    <div style={cardStyle('#FF7A1A', '-0.3deg')}>
      <span aria-hidden style={tapeStyle('rgba(255,122,26,.65)')} />
      <CardHead
        title={<>Chiffre <em style={italicAccent}>d&apos;affaires</em> · 30 jours</>}
        sub="// Du 21 avril au 21 mai 2026"
        action="↓ CSV"
      />
      <div style={{ height: 220, position: 'relative' }}>
        <svg viewBox="0 0 720 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Grid lines */}
          {[50, 100, 150].map((y) => (
            <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="#0A0A0A" strokeWidth="1" strokeDasharray="2 4" opacity="0.15" />
          ))}
          <line x1="0" y1="200" x2="720" y2="200" stroke="#0A0A0A" strokeWidth="1" />
          {/* Area under curve */}
          <polygon
            fill="#FF7A1A" fillOpacity="0.2"
            points="0,180 24,170 48,168 72,150 96,160 120,140 144,150 168,130 192,140 216,120 240,135 264,110 288,125 312,100 336,118 360,90 384,108 408,80 432,90 456,70 480,82 504,60 528,75 552,55 576,68 600,48 624,60 648,40 672,55 696,35 720,28 720,200 0,200"
          />
          {/* CA line */}
          <polyline
            fill="none" stroke="#FF7A1A" strokeWidth="3" strokeLinejoin="round"
            points="0,180 24,170 48,168 72,150 96,160 120,140 144,150 168,130 192,140 216,120 240,135 264,110 288,125 312,100 336,118 360,90 384,108 408,80 432,90 456,70 480,82 504,60 528,75 552,55 576,68 600,48 624,60 648,40 672,55 696,35 720,28"
          />
          {/* Objectif dashed */}
          <polyline
            fill="none" stroke="#0A0A0A" strokeWidth="2" strokeDasharray="6 4"
            points="0,150 720,40"
          />
          {/* Last point */}
          <circle cx="720" cy="28" r="6" fill="#D4FF3E" stroke="#0A0A0A" strokeWidth="2" />
          {/* Labels VT323 */}
          <text x="10" y="40" fontFamily="var(--font-vt323), monospace" fontSize="14" fill="#0A0A0A" opacity="0.6">15k€</text>
          <text x="10" y="195" fontFamily="var(--font-vt323), monospace" fontSize="14" fill="#0A0A0A" opacity="0.6">0</text>
          <text x="0" y="216" fontFamily="var(--font-vt323), monospace" fontSize="12" fill="#0A0A0A" opacity="0.5">21 avr</text>
          <text x="680" y="216" fontFamily="var(--font-vt323), monospace" fontSize="12" fill="#0A0A0A" opacity="0.5">21 mai</text>
        </svg>
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12,
        fontFamily: 'var(--font-special-elite),monospace', fontSize: 11,
      }}>
        <Legend color="#FF7A1A" label="CA réel" />
        <Legend color="transparent" border="dashed" label="Objectif" />
        <Legend color="#D4FF3E" label="Aujourd'hui" />
      </div>
    </div>
  );
}

function TasksList({ tasks, onToggle }: { tasks: typeof TASKS; onToggle: (id: number) => void }) {
  const remaining = tasks.filter((t) => !t.done).length;
  return (
    <div style={cardStyle('#F5E55E', '0.3deg')}>
      <span aria-hidden style={tapeStyle('repeating-linear-gradient(45deg, rgba(212,255,62,.7) 0 8px, rgba(212,255,62,.4) 8px 16px)')} />
      <CardHead
        title={<>À <em style={italicAccent}>faire</em> ★</>}
        sub={`// ${remaining} tâches restantes`}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t) => {
          const prColor =
            t.priority === 'URGENT'  ? '#FF4D8D' :
            t.priority === 'FAIT'    ? '#F5E55E' :
            t.priority === 'SEMAINE' ? '#F5E55E' :
                                       '#FF7A1A';
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: '#F4ECD8',
                border: '2px solid #0A0A0A',
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 13, color: t.done ? '#5E6A64' : '#0A0A0A',
                textDecoration: t.done ? 'line-through' : 'none',
                cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              <span aria-hidden style={{
                width: 18, height: 18,
                border: '2px solid #0A0A0A',
                background: t.done ? '#D4FF3E' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 12,
                color: '#0A0A0A',
                flexShrink: 0,
              }}>
                {t.done && '✓'}
              </span>
              <span style={{ flex: 1 }}>{t.label}</span>
              <span style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.08em',
                padding: '2px 6px', background: prColor, color: '#0A0A0A',
                border: '1px solid #0A0A0A',
              }}>
                {t.priority}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopProducts({ items, loading }: { items: TopProduct[]; loading: boolean }) {
  return (
    <div style={cardStyle('#FF4D8D', '-0.4deg')}>
      <span aria-hidden style={tapeStyle('rgba(212,255,62,.65)')} />
      <CardHead
        title={<>Top <em style={italicAccent}>produits</em></>}
        sub="// 30 jours"
        link={{ href: '/admin/produits', label: 'Tout →' }}
      />
      {loading && (
        <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, color: '#5E6A64' }}>
          Chargement…
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, color: '#5E6A64' }}>
          Aucune vente sur la période.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((p) => (
          <Link
            key={p.rank}
            href={`/perruque/${p.id}`}
            target="_blank"
            style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto',
              gap: 10, alignItems: 'center',
              padding: '8px 10px',
              background: '#FAF7F0',
              border: '2px solid #0A0A0A',
              textDecoration: 'none', color: '#0A0A0A',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 18, color: '#0A0A0A',
            }}>{p.rank}</div>
            <div>
              <div style={{
                fontFamily: 'var(--font-permanent-marker),cursive',
                fontSize: 15, lineHeight: 1,
              }}>{p.name}</div>
              <div style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 11, color: '#5E6A64', marginTop: 2,
              }}>
                {p.sales} ventes · {p.ca}
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.06em',
              padding: '2px 7px',
              background: p.stock === 'oos' ? '#FF4D8D' : '#D4FF3E',
              color: '#0A0A0A',
              border: '1px solid #0A0A0A',
            }}>
              {p.stock === 'oos' ? 'RUPT.' : p.stars}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentOrders({ items, loading }: { items: RecentOrder[]; loading: boolean }) {
  return (
    <div style={cardStyle('#D4FF3E', '0.4deg')}>
      <span aria-hidden style={tapeStyle('rgba(255,122,26,.65)')} />
      <CardHead
        title={<>Commandes <em style={italicAccent}>récentes</em></>}
        sub={`// ${items.length} dernières`}
        link={{ href: '/admin/commandes', label: 'Tout →' }}
      />
      {loading && (
        <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, color: '#5E6A64' }}>
          Chargement…
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 12, color: '#5E6A64' }}>
          Aucune commande pour l&apos;instant.
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto',
        gap: 10, alignItems: 'center',
        fontFamily: 'var(--font-special-elite),monospace', fontSize: 12,
      }}>
        {items.map((o) => (
          <div key={o.num} style={{
            display: 'contents',
          }}>
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 13, color: '#0A0A0A',
              padding: '8px 10px',
              background: '#FAF7F0',
              border: '2px solid #0A0A0A',
            }}>{o.num}</div>
            <div style={{ padding: '8px 0', color: '#0A0A0A' }}>{o.client}</div>
            <div style={{ padding: '8px 0', color: '#5E6A64', fontSize: 11 }}>{o.product}</div>
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 13, padding: '4px 8px',
              background: '#0A0A0A', color: '#D4FF3E',
              transform: 'rotate(-1deg)',
            }}>{o.total}</div>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.08em',
              padding: '3px 8px',
              background: STATUS_COLOR[o.status] ?? '#F4ECD8', color: '#0A0A0A',
              border: '1px solid #0A0A0A',
            }}>
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────

const italicAccent: CSSProperties = {
  fontFamily: 'var(--font-yeseva-one),serif',
  fontStyle: 'italic', color: '#FF7A1A',
};

function cardStyle(shadowColor: string, rotate: string): CSSProperties {
  return {
    background: '#F4ECD8', color: '#0A0A0A',
    border: '3px solid #0A0A0A', padding: 22,
    transform: `rotate(${rotate})`,
    boxShadow: `5px 5px 0 ${shadowColor}`,
    position: 'relative', overflow: 'hidden',
  };
}

function tapeStyle(bg: string): CSSProperties {
  return {
    position: 'absolute', top: -12, left: 24,
    width: 100, height: 22,
    background: bg,
    borderLeft: '1px dashed rgba(0,0,0,.3)',
    borderRight: '1px dashed rgba(0,0,0,.3)',
    transform: 'rotate(-3deg)',
  };
}

function CardHead({ title, sub, action, link }: {
  title: React.ReactNode;
  sub: string;
  action?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 14, paddingBottom: 10,
      borderBottom: '2px dashed #0A0A0A',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 22, lineHeight: 1, color: '#0A0A0A',
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 11, letterSpacing: '0.06em',
          color: '#5E6A64', marginTop: 4,
        }}>
          {sub}
        </div>
      </div>
      {action && (
        <button type="button" style={seeallStyle}>{action}</button>
      )}
      {link && (
        <Link href={link.href} style={{ ...seeallStyle, textDecoration: 'none' }}>{link.label}</Link>
      )}
    </div>
  );
}

const seeallStyle: CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 10, letterSpacing: '0.08em',
  padding: '4px 10px',
  background: 'transparent',
  border: '2px solid #0A0A0A',
  color: '#0A0A0A',
  cursor: 'pointer',
};

function Legend({ color, border, label }: {
  color: string;
  border?: 'dashed' | 'solid';
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{
        width: 12, height: 12,
        background: color,
        border: `1px ${border ?? 'solid'} #0A0A0A`,
        display: 'inline-block',
      }} />
      <span>{label}</span>
    </div>
  );
}
