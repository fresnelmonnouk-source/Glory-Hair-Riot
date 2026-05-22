import type { Metadata } from 'next';
import { FideliteRiot } from '@/components/fidelite/FideliteRiot';

export const metadata: Metadata = {
  title: 'Glory Club · Programme de fidélité — Glory Hair RIOT',
  description: 'Cumule des points à chaque commande, débloque des avantages : essais Premium offerts, livraison express, accès VIP atelier Paris 9.',
};

export default function FidelitePage() {
  return <FideliteRiot />;
}
