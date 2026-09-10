-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 013 : expiration des commandes en ligne          ║
-- ║   abandonnées + restauration du stock                                  ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- Contexte (suite migration 012) : depuis que /api/checkout décrémente
-- réellement le stock ET redirige vers un vrai paiement (Stripe Checkout /
-- FedaPay), un client qui ferme l'onglet sans payer laisse une commande
-- 'pending' avec du stock immobilisé indéfiniment — aucun webhook ne se
-- déclenche jamais pour un paiement simplement jamais tenté/abandonné (pas
-- refusé). Le paiement à la livraison est exclu (rien à abandonner en ligne).
-- Port du reaper de Sandy Stylish (0005_reaper.sql + durcissement 0008),
-- adapté au schéma orders/order_items/wigs/wig_variants.

CREATE OR REPLACE FUNCTION public.expire_stale_orders(older_than INTERVAL DEFAULT '30 minutes')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o RECORD;
  li RECORD;
  n INTEGER := 0;
  safe_interval INTERVAL;
BEGIN
  -- Borne de sécurité : jamais moins de 15 min, même si cette fonction était
  -- un jour ré-exposée avec un paramètre malveillant (cf. tech-supabase-rpc-execute-grants).
  safe_interval := GREATEST(older_than, INTERVAL '15 minutes');

  FOR o IN
    SELECT id FROM orders
    WHERE status = 'pending'
      AND payment_status = 'pending'
      AND payment_method <> 'cod'
      AND created_at < now() - safe_interval
  LOOP
    FOR li IN
      SELECT wig_id, variant_id, quantity FROM order_items WHERE order_id = o.id
    LOOP
      IF li.variant_id IS NOT NULL THEN
        UPDATE wig_variants SET stock_quantity = stock_quantity + li.quantity, updated_at = now() WHERE id = li.variant_id;
      ELSE
        UPDATE wigs SET stock_quantity = stock_quantity + li.quantity, updated_at = now() WHERE id = li.wig_id;
      END IF;
    END LOOP;

    UPDATE orders
      SET status = 'cancelled', payment_status = 'failed', notes = COALESCE(notes || ' — ', '') || 'Annulée automatiquement (paiement en ligne jamais finalisé).'
      WHERE id = o.id;
    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

-- Même règle que place_order (migration 012) : jamais appelable via PostgREST
-- par anon/authenticated — une annulation de masse serait dévastatrice si
-- exposée. Seul le endpoint CRON (service_role) doit pouvoir la déclencher.
REVOKE EXECUTE ON FUNCTION public.expire_stale_orders(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_orders(INTERVAL) TO service_role;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 013
-- ════════════════════════════════════════════════════════════════════════
