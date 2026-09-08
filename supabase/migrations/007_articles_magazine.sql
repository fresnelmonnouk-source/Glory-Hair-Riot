-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 007 : Magazine — articles générés par IA    ║
-- ║                                                                        ║
-- ║ Contexte : /magazine affichait une grille statique basée sur les 6     ║
-- ║   perruques du catalogue (titres codés en dur), sans aucun vrai        ║
-- ║   article. Cette migration crée la table `articles` qui sert de        ║
-- ║   source de vérité pour le magazine public + l'admin /admin/contenu.   ║
-- ║                                                                        ║
-- ║ RLS : lecture publique des seuls articles publiés (comme `wigs`),      ║
-- ║   écriture réservée aux admins via public.is_admin() (migration 005,   ║
-- ║   non redéfinie ici — réutilisée telle quelle).                        ║
-- ║                                                                        ║
-- ║ Storage : bucket public `article-covers` pour héberger les images de   ║
-- ║   couverture générées par IA (Gemini) — jamais stockées en base64 en   ║
-- ║   base, seule l'URL publique est écrite dans articles.cover_image_url. ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- 1. Table articles
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  tag text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS articles_status_published_at_idx
  ON articles (status, published_at DESC);

-- 2. RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_public_select" ON articles;
CREATE POLICY "articles_public_select" ON articles
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "articles_admin_all" ON articles;
CREATE POLICY "articles_admin_all" ON articles
  FOR ALL USING (public.is_admin());

-- 3. Storage bucket pour les images de couverture (public, lecture directe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-covers', 'article-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 007
-- ════════════════════════════════════════════════════════════════════════
