import type { Metadata } from 'next';
import { getWigs } from '@/lib/wigs/service';
import { CatalogueRiot } from '@/components/catalogue/CatalogueRiot';
import { isLocale, type Locale } from '@/i18n/config';
import { resolvePageLang } from '@/i18n/page-lang';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  return locale === 'en'
    ? { title: 'Catalogue · Glory Hair', description: 'Issue N°01: 6 human-hair wigs, hand-drawn. HD lace front, 100% Remy.' }
    : { title: 'Catalogue · Glory Hair', description: 'Issue N°01 : 6 perruques cheveux humains tirées à la main. Lace front HD, Remy 100%.' };
}

export default async function CataloguePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  const wigs = await getWigs(lang);
  return <CatalogueRiot wigs={wigs} lang={lang} />;
}
