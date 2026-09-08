-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 006 : Phase C (démarrage)                       ║
-- ║   1. Catalogue en vraies données (colonnes manquantes + backfill,      ║
-- ║      parité 1:1 avec l'ancien src/lib/wigs-data.ts — zéro changement   ║
-- ║      visuel, juste un changement de source)                            ║
-- ║   2. Checkout invité (comme Sandy Stylish : jamais de blocage login)   ║
-- ║   3. Fix RLS orders/order_items — policy admin manquante, jamais       ║
-- ║      découvert car la table était vide pendant toute la refonte        ║
-- ║   4. Table settings — clés de paiement configurables depuis l'admin    ║
-- ║      (FedaPay), jamais en clair côté client                            ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════
-- 1. Catalogue — colonnes manquantes sur wigs
-- ════════════════════════════════════════════════════════════════════════
-- L'UI (product-card, fiche produit, catalogue) affichait depuis
-- src/lib/wigs-data.ts des champs que la table wigs ne portait pas encore :
-- type de confection, badge marketing, pastilles de couleur, ordre
-- d'affichage, note/avis (pas de vraie table avis avant Phase E — éditable
-- admin en attendant, comme c'était déjà un mock statique avant).

ALTER TABLE wigs ADD COLUMN IF NOT EXISTS construction_type TEXT; -- 'Closure' | 'Lace Front' | '360 Lace' | 'Full Lace'
ALTER TABLE wigs ADD COLUMN IF NOT EXISTS tag TEXT;                -- 'BEST' | 'NEW' | 'HOT' | 'EDIT' (nullable)
ALTER TABLE wigs ADD COLUMN IF NOT EXISTS swatches TEXT[];         -- 3 couleurs hex pour les pastilles de sélection
ALTER TABLE wigs ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE wigs ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
ALTER TABLE wigs ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Backfill exact des 6 produits réels (mêmes valeurs que l'ancien fichier
-- statique — category corrigée pour 'bordeaux' : 'wavy' en base ne portait
-- pas la nuance 'Body Wave' de la fiche produit d'origine).
UPDATE wigs SET category = 'Wavy',      construction_type = 'Closure',    tag = 'BEST', swatches = ARRAY['#3a1d10','#5a3a1e','#7a4a26'], display_order = 1, rating = 4.9, review_count = 218 WHERE slug = 'velours';
UPDATE wigs SET category = 'Straight',  construction_type = 'Lace Front', tag = 'NEW',  swatches = ARRAY['#3a2418','#5a3a1e','#8a5a2e'], display_order = 2, rating = 4.8, review_count = 156 WHERE slug = 'mocha';
UPDATE wigs SET category = 'Wavy',      construction_type = 'Lace Front', tag = 'HOT',  swatches = ARRAY['#d36a1a','#a04a14','#7a3a10'], display_order = 3, rating = 4.7, review_count = 412 WHERE slug = 'ginger';
UPDATE wigs SET category = 'Body Wave', construction_type = '360 Lace',   tag = 'NEW',  swatches = ARRAY['#5a1d28','#7a2a36','#3a1418'], display_order = 4, rating = 4.9, review_count = 67  WHERE slug = 'bordeaux';
UPDATE wigs SET category = 'Straight',  construction_type = 'Full Lace',  tag = 'EDIT', swatches = ARRAY['#a9a3a8','#6e6a70','#1a1a1a'], display_order = 5, rating = 4.8, review_count = 189 WHERE slug = 'argent';
UPDATE wigs SET category = 'Wavy',      construction_type = 'Closure',    tag = 'BEST', swatches = ARRAY['#b8895c','#8a5a2e','#d4a878'], display_order = 6, rating = 4.9, review_count = 288 WHERE slug = 'creme';

-- wig_images était vide (0 ligne) — l'UI affichait ses images depuis les
-- fichiers statiques /public/images/*.jpg. Pas de Cloudinary configuré
-- (CLOUDINARY_API_KEY vide) : image_url pointe simplement vers ces mêmes
-- fichiers déjà servis par l'app, aucune dépendance externe ajoutée.
INSERT INTO wig_images (wig_id, image_url, alt_text, display_order)
SELECT w.id, img.path, w.name, 0
FROM wigs w
JOIN (VALUES
  ('velours',  '/images/velours.jpg'),
  ('mocha',    '/images/mocha.jpg'),
  ('ginger',   '/images/ginger.jpg'),
  ('bordeaux', '/images/bordeaux.jpg'),
  ('argent',   '/images/argent.jpg'),
  ('creme',    '/images/cafe-creme.jpg')
) AS img(slug, path) ON img.slug = w.slug
WHERE NOT EXISTS (SELECT 1 FROM wig_images wi WHERE wi.wig_id = w.id);

-- ════════════════════════════════════════════════════════════════════════
-- 2. Checkout invité
-- ════════════════════════════════════════════════════════════════════════
-- Sandy Stylish ne bloque jamais le checkout, même sans compte
-- (customer_id null, flux invité). GloryHairRiot exigeait un compte
-- (orders.user_id NOT NULL) — on aligne sur la référence.

ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- ════════════════════════════════════════════════════════════════════════
-- 3. Fix RLS orders/order_items — policy admin manquante
-- ════════════════════════════════════════════════════════════════════════
-- Le commentaire de la migration 001 disait "admins can see all" mais
-- aucune policy ne l'implémentait — jamais repéré car la table orders est
-- restée vide (0 commande) pendant toute la refonte. Sans ce fix,
-- admin.listOrders et admin.setOrderStatus n'auraient fonctionné que sur
-- les commandes appartenant à l'admin lui-même (orders_user_select ne
-- couvre que sa propre ligne), jamais sur les vraies commandes clients.

DROP POLICY IF EXISTS "orders_admin_mutations" ON orders;
CREATE POLICY "orders_admin_select" ON orders FOR SELECT USING (public.is_admin());
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (public.is_admin());

CREATE POLICY "order_items_admin_select" ON order_items FOR SELECT USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 4. Table settings — clés de paiement configurables depuis l'admin
-- ════════════════════════════════════════════════════════════════════════
-- Contrairement à feature_flags (lecture publique), settings ne doit
-- JAMAIS être lisible en dehors de l'admin — elle porte la clé secrète
-- FedaPay. Aucune policy SELECT publique ici, volontairement.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_admin_all" ON settings
  FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 006
-- ════════════════════════════════════════════════════════════════════════
