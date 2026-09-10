import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWigBySlug, getWigs } from '@/lib/wigs/service';
import { ProduitRiot } from '@/components/produit/ProduitRiot';


interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const wigs = await getWigs();
  return wigs.map((w) => ({ id: w.id }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const wig = await getWigBySlug(params.id);
  if (!wig) {
    return { title: 'Perruque introuvable · Glory Hair' };
  }
  return {
    title: `${wig.name} · Glory Hair`,
    description: `${wig.cat} ${wig.style} teinte ${wig.tone}. Cheveux humains Remy 100%, lace front HD. ${wig.price}€ · Issue N°01.`,
  };
}

export default async function ProduitPage(props: PageProps) {
  const params = await props.params;
  const [wig, allWigs] = await Promise.all([getWigBySlug(params.id), getWigs()]);
  if (!wig) notFound();
  return <ProduitRiot wig={wig} similarPool={allWigs} />;
}
