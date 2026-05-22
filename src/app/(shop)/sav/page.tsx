import type { Metadata } from 'next';
import { SavRiot } from '@/components/sav/SavRiot';

export const metadata: Metadata = {
  title: 'Aide & SAV · Glory Hair RIOT',
  description: 'FAQ, suivi de commande, contact, atelier Paris 9. On répond en 12h.',
};

export default function SavPage() {
  return <SavRiot />;
}
