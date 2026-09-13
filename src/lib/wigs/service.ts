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
  stock_quantity: number;
  wig_images: { image_url: string }[] | null;
}

const SELECT = 'id, slug, name, category, color, base_price, construction_type, tag, swatches, display_order, rating, review_count, is_pack, stock_quantity, wig_images(image_url)';

function parseLengthFromName(name: string): number {
  const m = name.match(/(\d+)"/);
  return m ? Number(m[1]) : 0;
}

interface TranslatedFields { name: string; metaDescription: string | null }

// Nom + meta_description traduits (migration 016, `wig_translations`) —
// meta_description était en base depuis le début mais jamais lue par aucun
// composant (audit commercial/SEO 2026-09-13 : 6 fiches produit avec des
// meta descriptions quasi identiques, générées à la volée dans
// generateMetadata plutôt que d'utiliser ce champ dédié). `length` reste
// dérivé du nom (traduit ou non, les gabarits `14"`/`20"` etc. sont
// identiques dans les deux langues).
function mapRow(row: WigRow, translated?: TranslatedFields): Wig {
  const swatches = row.swatches && row.swatches.length === 3
    ? (row.swatches as [string, string, string])
    : (['#4a2a3e', '#4a2a3e', '#4a2a3e'] as [string, string, string]);

  const name = translated?.name ?? row.name;
  return {
    id: row.slug,
    num: `N°${String(row.display_order ?? 0).padStart(2, '0')}`,
    name,
    length: parseLengthFromName(name),
    cat: row.construction_type ?? '',
    style: row.category ?? '',
    tone: row.color ?? '',
    // Jamais de repli sur la photo d'un autre produit (bug trouvé en audit
    // 2026-09-13 : un produit sans photo héritait silencieusement de
    // l'image "Velours" — le wizard IA en crée justement sans étape photo).
    // `null` = les composants affichent un placeholder neutre.
    img: row.wig_images?.[0]?.image_url ?? null,
    price: Math.round(row.base_price / 100),
    tag: (row.tag ?? undefined) as Wig['tag'],
    rating: row.rating ?? undefined,
    reviews: row.review_count ?? undefined,
    swatches,
    isPack: row.is_pack,
    metaDescription: translated?.metaDescription ?? undefined,
    stockQuantity: row.stock_quantity,
  };
}

// Récupère nom + meta_description traduits pour `lang`, avec repli explicite
// sur 'fr' si la ligne manque (jamais de disparition silencieuse d'un
// produit faute de traduction — décision documentée dans le plan i18n, à
// l'inverse du bug trouvé chez Sandy Stylish où un `!inner` fait juste
// disparaître le produit de la locale sans traduction).
async function fetchTranslatedFields(
  supabase: ReturnType<typeof publicWigsClient>,
  wigIds: string[],
  lang: Locale,
): Promise<Map<string, TranslatedFields>> {
  if (wigIds.length === 0) return new Map();
  const locales = lang === 'fr' ? ['fr'] : ['fr', 'en'];
  const { data } = await supabase
    .from('wig_translations')
    .select('wig_id, locale, name, meta_description')
    .in('wig_id', wigIds)
    .in('locale', locales);

  const fields = new Map<string, TranslatedFields>();
  type Row = { wig_id: string; locale: string; name: string; meta_description: string | null };
  for (const row of (data ?? []) as Row[]) {
    if (row.locale === 'fr') fields.set(row.wig_id, { name: row.name, metaDescription: row.meta_description });
  }
  if (lang !== 'fr') {
    for (const row of (data ?? []) as Row[]) {
      if (row.locale === lang) fields.set(row.wig_id, { name: row.name, metaDescription: row.meta_description });
    }
  }
  return fields;
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
  const translated = await fetchTranslatedFields(supabase, rows.map((r) => r.id), lang);
  return rows.map((row) => mapRow(row, translated.get(row.id)));
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
  const translated = await fetchTranslatedFields(supabase, [row.id], lang);
  const wig = mapRow(row, translated.get(row.id));

  // Composition du pack (migration 015) — manifeste d'affichage seulement,
  // jamais utilisé par le checkout (qui ne connaît que le pack lui-même).
  if (wig.isPack) {
    const { data: packItems } = await supabase
      .from('pack_items')
      .select('quantity, wigs!pack_items_wig_id_fkey(slug, name)')
      .eq('pack_id', row.id)
      .order('display_order', { ascending: true });

    // `wigs!pack_items_wig_id_fkey(...)` est une relation vers-un (chaque
    // pack_item référence UN SEUL wig) : PostgREST l'embarque comme un objet,
    // pas un tableau — vérifié en conditions réelles (requête anon
    // identique à celle-ci). Le `?.[0]` précédent indexait un objet comme un
    // tableau : toujours `undefined`, donc slug/name toujours vides sur la
    // fiche produit publique d'un pack (bug jamais détecté faute de pack
    // réel en prod à ce jour).
    wig.packItems = ((packItems ?? []) as unknown as { quantity: number; wigs: { slug: string; name: string } | null }[])
      .map((r) => ({ slug: r.wigs?.slug ?? '', name: r.wigs?.name ?? '', quantity: r.quantity }));
  }

  return wig;
}
