'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy).
   Hero éditorial + grille d'articles (mêmes proportions que le catalogue)
   + crédits de la rédaction. Contenu (bios rédaction) inchangé ; les
   éléments purement décoratifs de l'identité punk abandonnée (tampons
   "PUNK SINCE 2024") sont retirés.

   Grille "Au sommaire" : rendue dynamique (migration 007, table `articles`)
   à la place de l'ancienne grille basée sur WIGS/ARTICLE_TITLES qui pointait
   vers des fiches produit et n'affichait aucun vrai article. Articles passés
   en props depuis src/app/(shop)/magazine/page.tsx (Server Component, même
   pattern que CataloguePage → getWigs()). État vide propre tant qu'aucun
   article n'est publié (normal avant la 1ère génération IA). */

import Link from 'next/link';
import type { Article } from '@/lib/articles/service';
import { useLang } from '@/i18n/client';
import { trpc } from '@/lib/trpc/client';

const TEAM = [
  { role: 'Direction artistique', name: 'Olivia M.', bio: 'Couleurs, mise en page, direction visuelle.' },
  { role: 'Photographe', name: 'Naomi A.', bio: 'Lumière naturelle, sans retouche.' },
  { role: 'Styliste IA', name: 'Élodie', bio: 'Forme de visage, occasion, budget, disponible 24/7.' },
  { role: 'Atelier Paris 9', name: '12 NDL', bio: 'Nœud, lavage, brushing : Sandra & Léna.' },
];

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export function MagazineRiot({ articles }: { articles: Article[] }) {
  const lang = useLang();
  // Nom de marque admin-éditable (rebrand, Phase 2) — repli "Glory Hair".
  const brandQ = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const brandName = brandQ.data?.brand.name ?? 'Glory Hair';
  return (
    <>
      <section className="mx-auto max-w-[1180px] px-6 pt-16 md:pt-20">
        <p className="eyebrow">Magazine · Issue N°01</p>
        <h1 className="display mt-4 max-w-[560px] text-[clamp(2.25rem,6vw,4rem)] text-ink">
          6 perruques. 6 attitudes.
        </h1>
        <p className="mt-5 max-w-[560px] leading-relaxed text-muted">
          Tirées brin par brin dans notre atelier Paris 9, photographiées sans filtre. Voici
          {' '}{brandName}, édition été 2026.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={`/${lang}/catalogue`} className="rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
            Voir le catalogue
          </Link>
          <Link href={`/${lang}/essayage`} className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent">
            Essayer une perruque
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
        <p className="eyebrow">Au sommaire</p>
        {articles.length === 0 ? (
          <div className="mt-6 rounded-lg border border-hairline bg-surface px-8 py-16 text-center">
            <p className="font-display text-xl text-ink">Le prochain numéro arrive bientôt.</p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm text-muted">
              Aucun article publié pour l&apos;instant : reviens vite, la rédaction prépare déjà l&apos;Issue N°01.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
            {articles.map((article) => <ArticleCard key={article.id} article={article} lang={lang} brandName={brandName} />)}
          </div>
        )}
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
            Issue N°01 · Été 2026. Prochaine édition à l&apos;automne.
          </p>
        </div>
      </section>
    </>
  );
}

function ArticleCard({ article, lang, brandName }: { article: Article; lang: import('@/i18n/config').Locale; brandName: string }) {
  return (
    <Link href={`/${lang}/magazine/${article.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        {article.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-app">
            <span className="font-display text-lg text-faint">{brandName}</span>
          </div>
        )}
      </div>
      {article.tag && <p className="mt-3 text-xs uppercase tracking-wide text-faint">{article.tag}</p>}
      <h3 className="mt-1 font-display text-lg text-ink">{article.title}</h3>
      <p className="mt-2 text-xs text-faint">{estimateReadingMinutes(article.content)} min de lecture</p>
    </Link>
  );
}
