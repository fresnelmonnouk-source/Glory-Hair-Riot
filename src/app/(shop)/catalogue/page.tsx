import type { Metadata } from 'next';
import { CatalogueRiot } from '@/components/catalogue/CatalogueRiot';

export const metadata: Metadata = {
  title: 'Catalogue · Glory Hair RIOT',
  description: 'Issue N°01 — 6 perruques cheveux humains tirées à la main. Lace front HD, Remy 100%.',
};

export default function CataloguePage() {
  return <CatalogueRiot />;
}
