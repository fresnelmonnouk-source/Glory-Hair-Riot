import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { TRPCProvider } from '@/lib/trpc/provider';
import { fontVars } from '../fonts';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';
import '@/styles/riot.css';

/* Racine indépendante pour toutes les pages publiques (remplace l'ancien
   app/layout.tsx unique, qui couvrait aussi /admin et /maintenance — ceux-ci
   ont maintenant chacun leur propre racine <html>/<body>, cf.
   src/app/admin/layout.tsx et src/app/maintenance/layout.tsx). Consolide
   aussi les anciens (shop)/layout.tsx et (auth)/layout.tsx, strictement
   identiques (Nav+main+Footer) — plus besoin de les dupliquer. */

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  const title = locale === 'en'
    ? 'Glory Hair · Premium human hair wigs'
    : 'Glory Hair · Perruques cheveux humains premium';
  const description = locale === 'en'
    ? '100% Remy human hair wigs, AI virtual try-on. Paris 9 atelier.'
    : 'Perruques cheveux humains 100% Remy, essayage virtuel par IA. Atelier Paris 9.';

  return {
    title,
    description,
    keywords: ['perruques', 'extensions', 'cheveux humains', 'essayage virtuel', 'IA', 'beauté'],
    openGraph: { title, description, type: 'website' },
    alternates: {
      languages: { fr: '/fr', en: '/en' },
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={fontVars}>
      <body suppressHydrationWarning>
        <TRPCProvider>
          <NavRiot lang={lang} dict={dict} />
          <main>{children}</main>
          <FooterRiot lang={lang} dict={dict} />
        </TRPCProvider>
      </body>
    </html>
  );
}
