import { createClient } from '@supabase/supabase-js';
import type { Wig } from '@/lib/wigs-data';
import type { Locale } from '@/i18n/config';

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
  id: string;
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
  is_pack: boolean;
  wig_images: { image_url: string }[] | null;
}

const SELECT = 'id, slug, name, category, color, base_price, construction_type, tag, swatches, display_order, rating, review_count, is_pack, wig_images(image_url)';

function parseLengthFromName(name: string): number {
  const m = name.match(/(\d+)"/);
  return m ? Number(m[1]) : 0;
}

// Nom traduit (migration 016, `wig_translations`) — seul champ de cette
// table réellement affiché aujourd'hui (description/long_description/
// meta_description existent en base pour usage futur, mais aucun composant
// ne les lit actuellement : voir ProduitRiot, generateMetadata construisent
// leur propre texte depuis cat/style/tone/price). `length` reste dérivé du
// nom (traduit ou non, les gabarits `14"`/`20"` etc. sont identiques dans
// les deux langues).
function mapRow(row: WigRow, translatedName?: string): Wig {
  const swatches = row.swatches && row.swatches.length === 3
    ? (row.swatches as [string, string, string])
    : (['#4a2a3e', '#4a2a3e', '#4a2a3e'] as [string, string, string]);

  const name = translatedName ?? row.name;
  return {
    id: row.slug,
    num: `N°${String(row.display_order ?? 0).padStart(2, '0')}`,
    name,
    length: parseLengthFromName(name),
    cat: row.construction_type ?? '',
    style: row.category ?? '',
    tone: row.color ?? '',
    img: row.wig_images?.[0]?.image_url ?? '/images/velours.jpg',
    price: Math.round(row.base_price / 100),
    tag: (row.tag ?? undefined) as Wig['tag'],
    rating: row.rating ?? undefined,
    reviews: row.review_count ?? undefined,
    swatches,
    isPack: row.is_pack,
  };
}

// Récupère le nom traduit pour `lang`, avec repli explicite sur 'fr' si la
// ligne manque (jamais de disparition silencieuse d'un produit faute de
// traduction — décision documentée dans le plan i18n, à l'inverse du bug
// trouvé chez Sandy Stylish où un `!inner` fait juste disparaître le
// produit de la locale sans traduction).
async function fetchTranslatedNames(
  supabase: ReturnType<typeof publicWigsClient>,
  wigIds: string[],
  lang: Locale,
): Promise<Map<string, string>> {
  if (wigIds.length === 0) return new Map();
  const locales = lang === 'fr' ? ['fr'] : ['fr', 'en'];
  const { data } = await supabase
    .from('wig_translations')
    .select('wig_id, locale, name')
    .in('wig_id', wigIds)
    .in('locale', locales);

  const names = new Map<string, string>();
  for (const row of (data ?? []) as { wig_id: string; locale: string; name: string }[]) {
    if (row.locale === 'fr') names.set(row.wig_id, row.name);
  }
  if (lang !== 'fr') {
    for (const row of (data ?? []) as { wig_id: string; locale: string; name: string }[]) {
      if (row.locale === lang) names.set(row.wig_id, row.name);
    }
  }
  return names;
}

export async function getWigs(lang: Locale): Promise<Wig[]> {
  const supabase = publicWigsClient();
  const { data, error } = await supabase
    .from('wigs')
    .select(SELECT)
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error || !data) return [];
  const rows = data as unknown as WigRow[];
  const names = await fetchTranslatedNames(supabase, rows.map((r) => r.id), lang);
  return rows.map((row) => mapRow(row, names.get(row.id)));
}

export async function getWigBySlug(slug: string, lang: Locale): Promise<Wig | null> {
  const supabase = publicWigsClient();
  const { data, error } = await supabase
    .from('wigs')
    .select(SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as WigRow;
  const names = await fetchTranslatedNames(supabase, [row.id], lang);
  const wig = mapRow(row, names.get(row.id));

  // Composition du pack (migration 015) — manifeste d'affichage seulement,
  // jamais utilisé par le checkout (qui ne connaît que le pack lui-même).
  if (wig.isPack) {
    const { data: packItems } = await supabase
      .from('pack_items')
      .select('quantity, wigs!pack_items_wig_id_fkey(slug, name)')
      .eq('pack_id', row.id)
      .order('display_order', { ascending: true });

    wig.packItems = ((packItems ?? []) as unknown as { quantity: number; wigs: { slug: string; name: string }[] | null }[])
      .map((r) => ({ slug: r.wigs?.[0]?.slug ?? '', name: r.wigs?.[0]?.name ?? '', quantity: r.quantity }));
  }

  return wig;
}
