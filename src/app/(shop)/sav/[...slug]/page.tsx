import { redirect } from 'next/navigation';

/** Catch-all SAV : tous les sous-chemins (livraison, retours, garantie, atelier,
 *  contact, presse, cartes-cadeau) redirigent vers /sav (la FAQ contient déjà
 *  les réponses). Phase 5 : créer des pages dédiées par catégorie si besoin SEO.
 */
export default function SavCatchall() {
  redirect('/sav');
}
