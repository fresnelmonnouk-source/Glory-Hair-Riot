import type { Metadata } from 'next';
import { CompteRiot } from '@/components/compte/CompteRiot';

export const metadata: Metadata = {
  title: 'Mon compte · Glory Hair RIOT',
  description: 'Tes commandes, essayages, souhaits, points Glory Club. Espace personnel Issue N°01.',
};

export default function ComptePage() {
  return <CompteRiot />;
}
