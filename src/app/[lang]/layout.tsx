import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { TRPCProvider } from '@/lib/trpc/provider';
import { fontVars } from '../fonts';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getBrandSettings } from '@/lib/settings/service';
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
  const brand = await getBrandSettings();
  const tagline = locale === 'en'
    ? 'Premium human hair wigs'
    : 'Perruques cheveux humains premium';
  const description = locale === 'en'
    ? '100% Remy human hair wigs, AI virtual try-on. Paris 9 atelier.'
    : 'Perruques cheveux humains 100% Remy, essayage virtuel par IA. Atelier Paris 9.';
  const fullTitle = `${brand.name} · ${tagline}`;

  return {
    // `template` s'applique à chaque page enfant qui fournit un `title`
    // simple (chaîne) — GloryHairRiot devenant RHD Empire (ou tout futur
    // rebrand) ne demande plus qu'un changement ici, pas dans chacune des
    // ~13 pages qui ont désormais juste leur titre propre (voir leurs
    // generateMetadata/metadata, suffixe "· Glory Hair" retiré).
    title: { default: fullTitle, template: `%s · ${brand.name}` },
    description,
    keywords: ['perruques', 'extensions', 'cheveux humains', 'essayage virtuel', 'IA', 'beauté'],
    openGraph: { title: fullTitle, description, type: 'website' },
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
