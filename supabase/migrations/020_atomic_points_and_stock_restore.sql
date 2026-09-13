-- ════════════════════════════════════════════════════════════════════════
-- Migration 020 — RPC atomiques pour les points fidélité et la restauration
-- de stock (audit performance/fiabilité 2026-09-13, Tariq)
-- ════════════════════════════════════════════════════════════════════════
--
-- 1. `increment_user_points` était appelée depuis src/lib/loyalty/award-
--    points.ts sans jamais avoir été créée dans aucune migration (vérifié
--    par grep) — le "fallback" JS (SELECT points puis UPDATE points+N)
--    était donc en réalité le SEUL chemin exécuté, sur CHAQUE commande.
--    Lire-puis-écrire côté JS, non-atomique : deux commandes du même client
--    traitées à quelques centaines de ms d'écart (webhook + retry, double
--    paiement rapide) peuvent perdre l'incrément de l'une des deux.
--
-- 2. `restoreOrderStock` faisait le même lire-puis-écrire pour restaurer le
--    stock d'une commande annulée (échec paiement), contrairement à
--    `expire_stale_orders` (migration 013) qui, lui, fait déjà un UPDATE
--    atomique. Deux échecs de paiement concurrents sur le même produit
--    peuvent perdre une restauration de stock.

CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points int;
BEGIN
  UPDATE users SET points = points + p_amount WHERE id = p_user_id
  RETURNING points INTO v_points;
  RETURN v_points;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_user_points(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_points(uuid, int) TO service_role;

CREATE OR REPLACE FUNCTION public.restore_stock(p_wig_id uuid, p_variant_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE wig_variants SET stock_quantity = stock_quantity + p_quantity WHERE id = p_variant_id;
  ELSE
    UPDATE wigs SET stock_quantity = stock_quantity + p_quantity WHERE id = p_wig_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_stock(uuid, uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, uuid, int) TO service_role;
