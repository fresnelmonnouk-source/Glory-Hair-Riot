import type { Metadata } from 'next';
import { MagazineRiot } from '@/components/magazine/MagazineRiot';

export const metadata: Metadata = {
  title: 'Magazine · Issue N°01 — Glory Hair RIOT',
  description: 'Le zine éditorial Issue N°01 Été 2026 : 6 portraits, 6 articles, la rédac et l\'atelier Paris 9.',
};

export default function MagazinePage() {
  return <MagazineRiot />;
}
