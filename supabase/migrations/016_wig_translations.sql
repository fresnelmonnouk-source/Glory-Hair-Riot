-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 016 : wig_translations (i18n contenu produit)    ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- Phase 1b du plan i18n bilingue FR/EN (suite de la Phase 1a, chrome/UI déjà
-- livré). Une ligne par (wig, locale) pour les champs éditoriaux traduisibles
-- — les champs neutres (prix, stock, catégorie-filtre, couleur, longueur)
-- restent sur `wigs`, jamais dupliqués.
--
-- Colonnes alignées sur le schéma RÉEL de `wigs` (001_initial_schema.sql :
-- name, slug, description, long_description, meta_description) — pas de
-- `care_instructions`/`meta_title` : ces colonnes n'existent nulle part sur
-- `wigs` aujourd'hui, les ajouter ici aurait été spéculatif.
--
-- `slug` est UNIQUE PAR locale (comme chez Sandy Stylish, référence produit)
-- pour permettre un jour un slug anglais distinct du slug français. Le
-- backfill ci-dessous copie le même slug pour 'en' que pour 'fr' : le reste
-- de l'application (cart/panier, order_items, liens ProductCard/ProduitRiot
-- posés en Phase 1a) référence encore `wigs.slug` comme identifiant unique
-- inter-locale, donc changer le slug anglais MAINTENANT casserait ces liens.
-- Le jour où `getWigs`/`getWigBySlug` seront réécrits pour lire cette table
-- (résolution en 2 temps slug+locale → wig_id), un vrai slug EN distinct
-- pourra être introduit sans rien casser.
--
-- Pas de colonne `search tsvector` (contrairement à Sandy) : l'exploration
-- de cette session a confirmé que la sienne n'est jamais peuplée ni
-- interrogée — copier une colonne morte n'aurait aucune valeur ici.

CREATE TABLE IF NOT EXISTS wig_translations (
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('fr', 'en')),

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  meta_description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  PRIMARY KEY (wig_id, locale),
  UNIQUE (locale, slug)
);
CREATE INDEX IF NOT EXISTS idx_wig_translations_wig_id ON wig_translations (wig_id);

ALTER TABLE wig_translations ENABLE ROW LEVEL SECURITY;

-- Même pattern que pack_items (migration 015) : lecture publique (fiche
-- produit affichée sans session), écriture réservée à l'admin.
CREATE POLICY "wig_translations_public_select" ON wig_translations FOR SELECT USING (true);
CREATE POLICY "wig_translations_admin_all" ON wig_translations FOR ALL USING (public.is_admin());

-- ─── Backfill FR : copie 1:1 des colonnes existantes de `wigs` ───
-- Pour TOUS les produits actifs (wigs comme packs), pas seulement les 6
-- perruques actuelles — un futur pack ou produit ajouté par l'admin doit
-- aussi avoir sa traduction FR de base dès sa création (voir trigger plus
-- bas), mais ce backfill couvre ceux qui existent déjà au moment du push.
INSERT INTO wig_translations (wig_id, locale, name, slug, description, long_description, meta_description)
SELECT id, 'fr', name, slug, description, long_description, meta_description
FROM wigs
ON CONFLICT (wig_id, locale) DO NOTHING;

-- ─── Backfill EN : traduction des 6 perruques réelles actuelles ───
-- Slugs IDENTIQUES au FR (voir note ci-dessus — pas de slug EN distinct tant
-- que les points d'accès applicatifs ne savent pas résoudre par locale).
-- Traduction de premier jet : à relire par Fresnel avant mise en avant
-- commerciale (ton/voix de marque), mais fonctionnellement correcte.
INSERT INTO wig_translations (wig_id, locale, name, slug, description, long_description, meta_description)
SELECT id, 'en', v.name_en, slug, v.description_en, NULL, NULL
FROM wigs
JOIN (VALUES
  ('velours',  'Velvet 14"',       'Chocolate curly bob — Closure, invisible HD lace front'),
  ('mocha',    'Mocha 20"',        'Mocha body wave — Lace Front, 180% density'),
  ('ginger',   'Ginger 18"',       'Flame copper wavy — HD Lace Front, Issue N°01 cover'),
  ('bordeaux', 'Bordeaux 22"',     'Deep plum body wave — 360 Lace, pre-plucked baby hair'),
  ('argent',   'Silver 18"',       'Metallic silver straight — Full Lace HD'),
  ('creme',    'Café Crème 16"',   'Golden blonde wavy — Closure, breathable cap')
) AS v(slug_match, name_en, description_en) ON v.slug_match = wigs.slug
ON CONFLICT (wig_id, locale) DO NOTHING;

-- ─── Trigger : toute nouvelle perruque/pack créée par l'admin reçoit
-- automatiquement sa ligne FR (copie des colonnes de base), pour ne jamais
-- disparaître silencieusement du catalogue FR faute de traduction — le
-- risque que l'exploration Sandy avait identifié comme un bug silencieux
-- chez la référence (produit sans traduction = invisible via `!inner`).
-- La ligne EN reste à la charge de l'admin (onglet FR/EN du formulaire,
-- Phase 1b suite) : il n'y a pas de traduction automatique fiable côté DB.
CREATE OR REPLACE FUNCTION public.seed_wig_translation_fr()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wig_translations (wig_id, locale, name, slug, description, long_description, meta_description)
  VALUES (NEW.id, 'fr', NEW.name, NEW.slug, NEW.description, NEW.long_description, NEW.meta_description)
  ON CONFLICT (wig_id, locale) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_seed_wig_translation_fr ON wigs;
CREATE TRIGGER trg_seed_wig_translation_fr
AFTER INSERT ON wigs
FOR EACH ROW EXECUTE FUNCTION public.seed_wig_translation_fr();

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 016
-- ════════════════════════════════════════════════════════════════════════
