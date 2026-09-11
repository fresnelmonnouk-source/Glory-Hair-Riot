import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWigBySlug, getWigs } from '@/lib/wigs/service';
import { ProduitRiot } from '@/components/produit/ProduitRiot';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export async function generateStaticParams() {
  // Le slug est identique dans les deux locales (voir migration 016) —
  // la locale par défaut suffit pour énumérer tous les ids ; Next.js
  // combine automatiquement chaque id avec chaque `lang` du layout parent.
  const wigs = await getWigs(defaultLocale);
  return wigs.map((w) => ({ id: w.id }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const wig = await getWigBySlug(params.id, lang);
  if (!wig) {
    return { title: lang === 'en' ? 'Wig not found · Glory Hair' : 'Perruque introuvable · Glory Hair' };
  }
  return {
    title: `${wig.name} · Glory Hair`,
    description: lang === 'en'
      ? `${wig.cat} ${wig.style} shade ${wig.tone}. 100% Remy human hair, HD lace front. €${wig.price} · Issue N°01.`
      : `${wig.cat} ${wig.style} teinte ${wig.tone}. Cheveux humains Remy 100%, lace front HD. ${wig.price}€ · Issue N°01.`,
    // hreflang par fiche produit (pas juste site-wide comme le layout racine) :
    // slug identique dans les deux locales pour l'instant (voir service.ts/
    // migration 016), donc seul le préfixe change — mais calculé ici plutôt
    // que codé en dur, pour rester correct le jour où un slug EN distinct
    // sera introduit (LangSwitch devra alors être revu en même temps).
    alternates: {
      languages: { fr: `/fr/perruque/${wig.id}`, en: `/en/perruque/${wig.id}` },
    },
  };
}

export default async function ProduitPage(props: PageProps) {
  const params = await props.params;
  const lang: Locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const [wig, allWigs] = await Promise.all([getWigBySlug(params.id, lang), getWigs(lang)]);
  if (!wig) notFound();
  return <ProduitRiot wig={wig} similarPool={allWigs} lang={lang} />;
}
