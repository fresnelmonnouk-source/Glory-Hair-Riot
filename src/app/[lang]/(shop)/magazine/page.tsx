import type { Metadata } from 'next';
import { getPublishedArticles } from '@/lib/articles/service';
import { MagazineRiot } from '@/components/magazine/MagazineRiot';


export const metadata: Metadata = {
  title: 'Magazine · Issue N°01',
  description: 'Le magazine éditorial Issue N°01 Été 2026 : conseils, tendances, la rédac et l\'atelier Paris 9.',
};

export default async function MagazinePage() {
  const articles = await getPublishedArticles();
  return <MagazineRiot articles={articles} />;
}
