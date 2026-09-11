import type { Metadata } from 'next';
import { PanierRiot } from '@/components/panier/PanierRiot';
import { isLocale, type Locale } from '@/i18n/config';
import { resolvePageLang } from '@/i18n/page-lang';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  return locale === 'en'
    ? { title: 'Your bag · Glory Hair', description: 'Your Glory Hair bag summary. Free 48h shipping, 30-day returns, 12-month warranty.' }
    : { title: 'Votre sac · Glory Hair', description: 'Récap de votre sac Glory Hair. Livraison 48h offerte, retour 30j, garantie 12 mois.' };
}

export default async function PanierPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, dict } = await resolvePageLang(params);
  return <PanierRiot lang={lang} dict={dict} />;
}
