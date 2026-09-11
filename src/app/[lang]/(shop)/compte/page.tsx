import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompteRiot } from '@/components/compte/CompteRiot';
import { isLocale, type Locale } from '@/i18n/config';
import { resolvePageLang } from '@/i18n/page-lang';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  return locale === 'en'
    ? { title: 'My account · Glory Hair', description: 'Your orders, try-ons, wishlist, Glory Club points. Issue N°01 personal space.' }
    : { title: 'Mon compte · Glory Hair', description: 'Tes commandes, essayages, souhaits, points Glory Club. Espace personnel Issue N°01.' };
}

export default async function ComptePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, dict } = await resolvePageLang(params);
  return (
    <Suspense fallback={null}>
      <CompteRiot lang={lang} dict={dict} />
    </Suspense>
  );
}
