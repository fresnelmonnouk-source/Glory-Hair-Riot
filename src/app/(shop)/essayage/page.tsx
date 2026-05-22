import type { Metadata } from 'next';
import { TryonMarketing } from '@/components/tryon/TryonMarketing';

export const metadata: Metadata = {
  title: 'Essai Live · Essayage virtuel IA — Glory Hair RIOT',
  description: '2 essais gratuits offerts par appareil, 5 avec un compte. Rendu photo-réaliste IA en ~5 secondes, sans installation. Glory Hair Issue N°01.',
};

export default function EssayageMarketingPage() {
  return <TryonMarketing />;
}
