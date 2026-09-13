import type { MetadataRoute } from 'next';
import { getWigs } from '@/lib/wigs/service';
import { getPublishedArticles } from '@/lib/articles/service';
import { defaultLocale, locales } from '@/i18n/config';

/* sitemap.xml — absent jusqu'ici (audit SEO 2026-09-13). Couvre les pages
   publiques indexables en FR+EN : accueil, contenu statique, catalogue,
   fiches produit, magazine. Volontairement exclu : /compte, /checkout,
   /panier, /merci, les pages auth (privées ou sans valeur SEO), et /admin
   (déjà non-indexé via generateMetadata robots:false). */

const STATIC_PATHS = [
  '',
  '/catalogue',
  '/essayage',
  '/elodie',
  '/fidelite',
  '/magazine',
  '/sav',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://rhdempire.com').replace(/\/+$/, '');
  const [wigs, articles] = await Promise.all([
    getWigs(defaultLocale),
    getPublishedArticles().catch(() => []),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${appUrl}/${locale}${path}`, lastModified: new Date() });
    }
    for (const wig of wigs) {
      entries.push({ url: `${appUrl}/${locale}/perruque/${wig.id}`, lastModified: new Date() });
    }
    for (const article of articles) {
      entries.push({ url: `${appUrl}/${locale}/magazine/${article.slug}`, lastModified: new Date() });
    }
  }

  return entries;
}
