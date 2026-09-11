import { redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';

/** Catch-all SAV : tous les sous-chemins (livraison, retours, garantie, atelier,
 *  contact, presse, cartes-cadeau) redirigent vers /sav (la FAQ contient déjà
 *  les réponses). Phase 5 : créer des pages dédiées par catégorie si besoin SEO.
 */
export default async function SavCatchall({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${isLocale(lang) ? lang : 'fr'}/sav`);
}
