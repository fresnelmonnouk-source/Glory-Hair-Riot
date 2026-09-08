'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy).
   Hero éditorial + grille d'articles (mêmes proportions que le catalogue)
   + crédits de la rédaction. Contenu (articles, bios) inchangé ; les
   éléments purement décoratifs de l'identité punk abandonnée (tampons
   "PUNK SINCE 2024") sont retirés. */

import Link from 'next/link';
import { WIGS, type Wig } from '@/lib/wigs-data';

const ARTICLE_TITLES: Record<string, string> = {
  velours: "Body wave : l'art du naturel travaillé",
  mocha: "Le moka, ce neutre qui n'est pas neutre",
  ginger: 'Comment porter le copper sans rougir',
  bordeaux: 'Plum profond : la couleur dont personne ne parle',
  argent: "Argent : 8 façons de l'assumer",
  creme: 'Blond doré : retour de hype',
};

const TEAM = [
  { role: 'Direction artistique', name: 'Olivia M.', bio: 'Couleurs, mise en page, direction visuelle.' },
  { role: 'Photographe', name: 'Naomi A.', bio: 'Lumière naturelle, sans retouche.' },
  { role: 'Styliste IA', name: 'Élodie', bio: 'Forme de visage, occasion, budget — 24/7.' },
  { role: 'Atelier Paris 9', name: '12 NDL', bio: 'Nœud, lavage, brushing — Sandra & Léna.' },
];

export function MagazineRiot() {
  return (
    <>
      <section className="mx-auto max-w-[1180px] px-6 pt-16 md:pt-20">
        <p className="eyebrow">Magazine · Issue N°01</p>
        <h1 className="display mt-4 max-w-[560px] text-[clamp(2.25rem,6vw,4rem)] text-ink">
          6 perruques. 6 attitudes.
        </h1>
        <p className="mt-5 max-w-[560px] leading-relaxed text-muted">
          Tirées brin par brin dans notre atelier Paris 9, photographiées sans filtre. Voici
          Glory Hair, édition été 2026.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/catalogue" className="rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
            Voir le catalogue
          </Link>
          <Link href="/essayage" className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent">
            Essayer une perruque
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
        <p className="eyebrow">Au sommaire</p>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
          {WIGS.map((wig, i) => <ArticleCard key={wig.id} wig={wig} index={i} />)}
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
          <p className="eyebrow">La rédaction</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((p) => (
              <div key={p.role}>
                <p className="text-xs uppercase tracking-wide text-faint">{p.role}</p>
                <p className="font-display mt-2 text-lg text-ink">{p.name}</p>
                <p className="mt-1 text-sm text-muted">{p.bio}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 border-t border-hairline pt-6 text-xs text-faint">
            Issue N°01 · Été 2026 — prochaine édition à l&apos;automne.
          </p>
        </div>
      </section>
    </>
  );
}

function ArticleCard({ wig, index }: { wig: Wig; index: number }) {
  const title = ARTICLE_TITLES[wig.id] ?? ARTICLE_TITLES.ginger!;

  return (
    <Link href={`/perruque/${wig.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wig.img} alt={wig.name} className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]" loading="lazy" />
      </div>
      <p className="mt-3 text-xs uppercase tracking-wide text-faint">{wig.tone}</p>
      <h3 className="mt-1 font-display text-lg text-ink">{title}</h3>
      <p className="mt-2 text-xs text-faint">{3 + (index % 3)} min de lecture</p>
    </Link>
  );
}
