import type { Metadata } from 'next';
import { getWigs } from '@/lib/wigs/service';
import { CatalogueRiot } from '@/components/catalogue/CatalogueRiot';
import { resolvePageLang } from '@/i18n/page-lang';

export const metadata: Metadata = {
  title: 'Catalogue · Glory Hair',
  description: 'Issue N°01 : 6 perruques cheveux humains tirées à la main. Lace front HD, Remy 100%.',
};

export default async function CataloguePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  const wigs = await getWigs();
  return <CatalogueRiot wigs={wigs} lang={lang} />;
}
