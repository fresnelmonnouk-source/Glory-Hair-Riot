import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug, getPublishedArticles } from '@/lib/articles/service';
import { isLocale, type Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    return { title: 'Article introuvable' };
  }
  return {
    title: `${article.title} · Magazine`,
    description: article.excerpt ?? undefined,
    openGraph: article.cover_image_url ? { images: [{ url: article.cover_image_url }] } : undefined,
  };
}

function formatPublishedDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Rendu Markdown minimal : découpage par paragraphes séparés par une ligne
   vide → <p>, lignes "## "/"# " → <h2>. Aucune librairie markdown n'est
   installée dans ce projet (ni react-markdown ni marked dans package.json)
   — plutôt que d'ajouter une dépendance pour un besoin aussi ciblé, on se
   limite à ce découpage, conformément au contenu généré (system prompt
   DeepSeek : "des paragraphes séparés par une ligne vide, des sous-titres
   avec ## si utile"). Limite assumée et documentée : l'emphase inline
   (**gras**, *italique*, liens [texte](url)) n'est PAS interprétée — si le
   modèle en glisse, les astérisques/crochets s'affichent tels quels.
   Amélioration future si besoin d'un rendu plus riche : ajouter une petite
   lib markdown dédiée plutôt que d'étendre ce parseur maison. */
function renderContent(markdown: string) {
  const blocks = markdown.trim().split(/\n{2,}/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      return (
        <h2 key={i} className="mt-10 font-display text-2xl text-ink first:mt-0">
          {trimmed.replace(/^#{1,2}\s+/, '')}
        </h2>
      );
    }
    return (
      <p key={i} className="mt-5 leading-relaxed text-muted first:mt-0">
        {trimmed}
      </p>
    );
  });
}

export default async function ArticlePage(props: PageProps) {
  const params = await props.params;
  const lang: Locale = isLocale(params.lang) ? params.lang : 'fr';
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-[760px] px-6 py-12 md:px-11 md:py-16">
      <Link href={`/${lang}/magazine`} className="text-sm text-muted transition-colors hover:text-ink">
        ← Retour au magazine
      </Link>

      {article.cover_image_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-sm bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url} alt={article.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-8">
        {article.tag && <p className="eyebrow">{article.tag}</p>}
        <h1 className="display mt-3 text-4xl text-ink md:text-5xl">{article.title}</h1>
        {article.published_at && (
          <p className="mt-4 text-sm text-faint">{formatPublishedDate(article.published_at)}</p>
        )}
      </div>

      <div className="mt-8">{renderContent(article.content)}</div>

      <div className="mt-14 border-t border-hairline pt-8">
        <Link
          href={`/${lang}/magazine`}
          className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent"
        >
          ← Retour au magazine
        </Link>
      </div>
    </article>
  );
}
