import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WIG_BY_ID, WIGS } from '@/lib/wigs-data';
import { ProduitRiot } from '@/components/produit/ProduitRiot';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return WIGS.map((w) => ({ id: w.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const wig = WIG_BY_ID[params.id];
  if (!wig) {
    return { title: 'Perruque introuvable · Glory Hair RIOT' };
  }
  return {
    title: `${wig.name} · Glory Hair RIOT`,
    description: `${wig.cat} ${wig.style} teinte ${wig.tone}. Cheveux humains Remy 100%, lace front HD. ${wig.price}€ · Issue N°01.`,
  };
}

export default function ProduitPage({ params }: PageProps) {
  const wig = WIG_BY_ID[params.id];
  if (!wig) notFound();
  return <ProduitRiot wig={wig} />;
}
