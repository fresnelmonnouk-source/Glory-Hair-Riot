import type { Metadata } from 'next';
import { PanierRiot } from '@/components/panier/PanierRiot';

export const metadata: Metadata = {
  title: 'Votre sac · Glory Hair RIOT',
  description: 'Récap de ton sac Glory Hair. Livraison 48h offerte, retour 30j, garantie 12 mois.',
};

export default function PanierPage() {
  return <PanierRiot />;
}
