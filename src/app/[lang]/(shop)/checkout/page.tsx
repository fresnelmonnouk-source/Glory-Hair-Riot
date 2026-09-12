import type { Metadata } from 'next';
import { CheckoutRiot } from '@/components/checkout/CheckoutRiot';
import { isLocale, type Locale } from '@/i18n/config';
import { resolvePageLang } from '@/i18n/page-lang';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  return locale === 'en'
    ? { title: 'Checkout', description: 'Complete your order in 3 steps. Free 48h shipping, secure Stripe / FedaPay payment.' }
    : { title: 'Checkout', description: 'Finalise ta commande en 3 étapes. Livraison 48h offerte, paiement sécurisé Stripe / FedaPay.' };
}

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang, dict } = await resolvePageLang(params);
  return <CheckoutRiot lang={lang} dict={dict} />;
}
