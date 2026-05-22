import type { Metadata } from 'next';
import { ElodieRiot } from '@/components/elodie/ElodieRiot';

export const metadata: Metadata = {
  title: 'Élodie · Styliste IA — Glory Hair RIOT',
  description: 'Décris ta morphologie, ton occasion, ton budget. Élodie te recommande la perruque parfaite parmi nos 6 pièces Issue N°01. Conseil 24/7.',
};

export default function ElodiePage() {
  return <ElodieRiot />;
}
