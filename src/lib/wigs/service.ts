import { createClient } from '@supabase/supabase-js';
import type { Wig } from '@/lib/wigs-data';

/* Lecture catalogue réel (table wigs + wig_images, migration 006) — même
   forme (interface Wig) que l'ancien src/lib/wigs-data.ts pour que
   ProductCard/ProduitRiot n'aient aucun changement à faire, seule la
   source change. `num`/`tag`/`swatches`/`rating`/`reviews` viennent des
   colonnes ajoutées en migration 006 (backfillées à l'identique de
   l'ancien fichier statique) ; `length` (pouces) est extrait du nom
   plutôt que de la colonne `length` (qui porte 'short'/'medium'/'long',
   un usage différent, sans rapport avec les filtres UI).

   Client anon SANS cookies (pas createServerSupabaseClient) : les wigs
   sont en lecture publique (RLS wigs_public_select USING(true)), aucune
   session nécessaire — et generateStaticParams tourne au build, sans
   requête HTTP, donc sans cookies() disponible. */
function publicWigsClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

interface WigRow {
  slug: string;
  name: string;
  category: string | null;
  color: string | null;
  base_price: number;
  construction_type: string | null;
  tag: string | null;
  swatches: string[] | null;
  display_order: number | null;
  rating: number | null;
  review_count: number | null;
  wig_images: { image_url: string }[] | null;
}

const SELECT = 'slug, name, category, color, base_price, construction_type, tag, swatches, display_order, rating, review_count, wig_images(image_url)';

function parseLengthFromName(name: string): number {
  const m = name.match(/(\d+)"/);
  return m ? Number(m[1]) : 0;
}

function mapRow(row: WigRow): Wig {
  const swatches = row.swatches && row.swatches.length === 3
    ? (row.swatches as [string, string, string])
    : (['#4a2a3e', '#4a2a3e', '#4a2a3e'] as [string, string, string]);

  return {
    id: row.slug,
    num: `N°${String(row.display_order ?? 0).padStart(2, '0')}`,
    name: row.name,
    length: parseLengthFromName(row.name),
    cat: row.construction_type ?? '',
    style: row.category ?? '',
    tone: row.color ?? '',
    img: row.wig_images?.[0]?.image_url ?? '/images/velours.jpg',
    price: Math.round(row.base_price / 100),
    tag: (row.tag ?? undefined) as Wig['tag'],
    rating: row.rating ?? undefined,
    reviews: row.review_count ?? undefined,
    swatches,
  };
}

export async function getWigs(): Promise<Wig[]> {
  const supabase = publicWigsClient();
  const { data, error } = await supabase
    .from('wigs')
    .select(SELECT)
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as WigRow[]).map(mapRow);
}

export async function getWigBySlug(slug: string): Promise<Wig | null> {
  const supabase = publicWigsClient();
  const { data, error } = await supabase
    .from('wigs')
    .select(SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as unknown as WigRow);
}
