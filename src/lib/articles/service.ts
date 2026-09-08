import { createClient } from '@supabase/supabase-js';

/* Lecture publique des articles publiés (table `articles`, migration 007).
   Même pattern que src/lib/wigs/service.ts : client anon SANS cookies (pas
   createServerSupabaseClient) — les pages publiques du magazine sont des
   Server Components / generateStaticParams qui tournent au build, sans
   contexte HTTP donc sans cookies() disponible. La RLS publique
   (articles_public_select USING (status = 'published')) garantit déjà côté
   DB qu'aucun brouillon ne fuite ; le filtre .eq('status','published') ici
   est redondant mais explicite (clarté du code, pas une dépendance à la RLS
   pour la sécurité de cette lecture publique). */

function publicArticlesClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tag: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
}

const SELECT = 'id, slug, title, excerpt, content, cover_image_url, tag, status, published_at, created_at';

export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = publicArticlesClient();
  const { data, error } = await supabase
    .from('articles')
    .select(SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !data) return [];
  return data as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = publicArticlesClient();
  const { data, error } = await supabase
    .from('articles')
    .select(SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;
  return data as Article;
}
