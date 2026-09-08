/* Stub "en construction" — pas d'équivalent Sandy (admin Sandy est
   entièrement construit). Réhabillé avec le même vocabulaire de carte
   (rounded-lg border-hairline bg-app) que le reste de l'admin, sans les
   éléments décoratifs punk (rotation, box-shadow offset, tampon). */

import Link from 'next/link';

const TITLES: Record<string, { title: string; sub: string }> = {
  commandes:  { title: 'Commandes',   sub: 'Gestion des commandes, retours, expéditions' },
  produits:   { title: 'Produits',    sub: 'CRUD perruques, variantes, photos, prix' },
  stock:      { title: 'Stock',       sub: 'Inventaire temps réel, alertes rupture' },
  clients:    { title: 'Clients',     sub: 'Base clients, segmentation, exports RGPD' },
  avis:       { title: 'Avis',        sub: 'Modération avis vérifiés, photos, rating' },
  elodie:     { title: 'Élodie · IA', sub: 'Conversations supervisées, prompts, métriques' },
  contenu:    { title: 'Magazine',    sub: 'Articles Issue N°XX, éditos, planning' },
  promos:     { title: 'Promos',      sub: 'Codes promo, campagnes, A/B test' },
  analytics:  { title: 'Analytics',   sub: 'CA, conversion, sources, cohortes' },
  reglages:   { title: 'Réglages',    sub: 'Paramètres système, intégrations, équipe' },
};

export default async function AdminCatchall(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const key = params.slug[0] ?? 'unknown';
  const meta = TITLES[key] ?? { title: key.charAt(0).toUpperCase() + key.slice(1), sub: 'Section admin' };

  return (
    <div className="mx-auto mt-10 max-w-[560px] rounded-lg border border-hairline bg-app p-10 text-center">
      <p className="eyebrow">Bientôt disponible</p>
      <h1 className="display mt-3 text-3xl text-ink">{meta.title}</h1>
      <p className="mx-auto mt-3 max-w-[380px] text-sm leading-relaxed text-muted">{meta.sub}</p>
      <p className="mt-6 text-xs text-faint">Cette section arrive dans une prochaine mise à jour.</p>
      <Link href="/admin" className="mt-6 inline-flex rounded-sm border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
        ← Tableau de bord
      </Link>
    </div>
  );
}
