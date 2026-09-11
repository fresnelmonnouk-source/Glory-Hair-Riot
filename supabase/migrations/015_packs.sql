-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 015 : Packs (lots de produits, prix fixe admin) ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- Port du design packs de Sandy Stylish, adapté au schéma wigs (Sandy réifie
-- un pack comme un `products` avec product_type='pack' ; ici, un pack est
-- une ligne `wigs` avec is_pack=true). PRINCIPE IMPORTANT (comme Sandy) :
-- le prix du pack N'EST PAS calculé depuis ses composants — l'admin le fixe
-- directement (wigs.base_price), et son stock (wigs.stock_quantity) est
-- INDÉPENDANT du stock des composants (l'admin gère manuellement combien de
-- lots il a physiquement préparés). `pack_items` n'est qu'un manifeste
-- d'affichage ("Contenu du pack"), jamais touché par place_order/checkout —
-- acheter un pack décrémente uniquement le stock du pack lui-même, exactement
-- comme un wig normal. Zéro changement requis côté RPC place_order.

ALTER TABLE wigs ADD COLUMN IF NOT EXISTS is_pack BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS pack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,   -- le pack
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE RESTRICT,    -- composant inclus (jamais supprimable tel quel s'il est dans un pack)
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (pack_id, wig_id)
);
CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id ON pack_items (pack_id);

ALTER TABLE pack_items ENABLE ROW LEVEL SECURITY;

-- Lecture publique (la composition d'un pack doit s'afficher sur sa fiche
-- produit) ; écriture réservée à l'admin.
CREATE POLICY "pack_items_public_select" ON pack_items FOR SELECT USING (true);
CREATE POLICY "pack_items_admin_all" ON pack_items FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 015
-- ════════════════════════════════════════════════════════════════════════
