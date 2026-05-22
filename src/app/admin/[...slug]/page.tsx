import Link from 'next/link';

const TITLES: Record<string, { title: string; sub: string; icon: string }> = {
  commandes:  { title: 'Commandes',     sub: 'Gestion des commandes, retours, expéditions',     icon: '▤' },
  produits:   { title: 'Produits',      sub: 'CRUD perruques, variantes, photos, prix',          icon: '★' },
  stock:      { title: 'Stock',         sub: 'Inventaire temps réel, alertes rupture',           icon: '▥' },
  clients:    { title: 'Clients',       sub: 'Base clients, segmentation, exports RGPD',         icon: '◉' },
  avis:       { title: 'Avis',          sub: 'Modération avis vérifiés, photos, rating',         icon: '✦' },
  elodie:     { title: 'Élodie · IA',   sub: 'Conversations supervisées, prompts, métriques',    icon: '●' },
  contenu:    { title: 'Magazine',      sub: 'Articles Issue N°XX, éditos, planning',            icon: '▦' },
  promos:     { title: 'Promos',        sub: 'Codes promo, campagnes, A/B test',                 icon: '%' },
  analytics:  { title: 'Analytics',     sub: 'CA, conversion, sources, cohortes',                icon: '⌃' },
  reglages:   { title: 'Réglages',      sub: 'Paramètres système, intégrations, équipe',         icon: '⚙' },
};

export default function AdminCatchall({ params }: { params: { slug: string[] } }) {
  const key = params.slug[0] ?? 'unknown';
  const meta = TITLES[key] ?? { title: key.charAt(0).toUpperCase() + key.slice(1), sub: 'Section admin', icon: '◇' };

  return (
    <div style={{
      maxWidth: 720, margin: '40px auto',
      background: '#F4ECD8', color: '#0A0A0A',
      padding: 48, border: '3px dashed #0A0A0A',
      textAlign: 'center',
      transform: 'rotate(-0.4deg)',
      boxShadow: '6px 6px 0 #FF7A1A',
    }}>
      <div style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 64, lineHeight: 1, color: '#FF7A1A',
        marginBottom: 12,
      }}>
        {meta.icon}
      </div>
      <h1 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 48, lineHeight: 1,
        textTransform: 'uppercase',
      }}>
        {meta.title}
      </h1>
      <p style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 14, color: '#5E6A64',
        marginTop: 12, maxWidth: 480, marginInline: 'auto',
        lineHeight: 1.5,
      }}>
        {meta.sub}
      </p>
      <div style={{
        marginTop: 24,
        display: 'inline-block',
        background: '#FF7A1A', color: '#0A0A0A',
        padding: '6px 14px',
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 11, letterSpacing: '0.1em',
        border: '2px solid #0A0A0A',
        transform: 'rotate(-2deg)',
      }}>
        ★ EN CONSTRUCTION
      </div>
      <p style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 13, color: '#5E6A64',
        marginTop: 22, lineHeight: 1.5,
      }}>
        Section disponible dans la prochaine mise à jour (Phase 5).
      </p>
      <Link href="/admin" className="btn-bold" style={{ marginTop: 18, display: 'inline-flex' }}>
        ← Tableau de bord
      </Link>
    </div>
  );
}
