-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 012 : commande atomique + paiement réel          ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- Contexte (audit de parité vs Sandy Stylish, 2026-09-10) : /api/checkout
-- faisait confiance au prix envoyé par le CLIENT (price_at_added) pour calculer
-- le total, et ne touchait JAMAIS le stock — deux failles réelles (prix
-- falsifiable + survente illimitée). Port du pattern place_order de Sandy
-- Stylish, adapté au schéma wigs/wig_variants : le prix est RECALCULÉ ici à
-- partir de la table (wig_variants.price_override ?? wigs.base_price), jamais
-- du client, et le stock est décrémenté ATOMIQUEMENT (verrouillage FOR UPDATE
-- par ligne, rollback natif si rupture) dans la même transaction que la
-- création de la commande + ses lignes.
--
-- Ne gère PAS l'adresse/livraison/paiement/code promo : ces champs restent
-- mis à jour par un UPDATE juste après (comme avant), aucun n'est sensible au
-- prix (l'adresse ne change rien au montant, le code promo a déjà sa propre
-- re-validation serveur dans src/lib/discounts/validate.ts).

CREATE OR REPLACE FUNCTION public.place_order(
  p_items JSONB,          -- [{"wig_id":"uuid","variant_id":"uuid|null","quantity":int}, ...]
  p_customer_id UUID,     -- NULL pour un invité
  p_guest_email TEXT,
  p_guest_phone TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_wig_id UUID;
  v_variant_id UUID;
  v_qty INT;
  v_unit_price INT;
  v_wig_active BOOLEAN;
  v_wig_stock INT;
  v_variant_stock INT;
  v_variant_active BOOLEAN;
  v_subtotal INT := 0;
  v_order_id UUID;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'bad_request: no items';
  END IF;
  IF jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'bad_request: too many items';
  END IF;

  -- Coquille de commande d'abord (montants posés à 0, complétés ci-dessous
  -- puis par l'UPDATE applicatif qui suit l'appel RPC) — tout dans la même
  -- transaction, un rollback plus loin efface aussi cet insert.
  INSERT INTO orders (user_id, guest_email, guest_phone, status, subtotal_cents, shipping_cents, discount_cents, total_cents, payment_status)
  VALUES (p_customer_id, p_guest_email, p_guest_phone, 'pending', 0, 0, 0, 0, 'pending')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_wig_id := (v_item->>'wig_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'bad_request: invalid quantity';
    END IF;

    -- Verrou de ligne (FOR UPDATE) : deux commandes concurrentes sur le même
    -- article se sérialisent ici, pas de compare-and-swap applicatif.
    SELECT active, stock_quantity, base_price INTO v_wig_active, v_wig_stock, v_unit_price
      FROM wigs WHERE id = v_wig_id FOR UPDATE;

    IF NOT FOUND OR NOT v_wig_active THEN
      RAISE EXCEPTION 'item_unavailable: %', v_wig_id;
    END IF;

    IF v_variant_id IS NOT NULL THEN
      SELECT stock_quantity, active, COALESCE(price_override, v_unit_price)
        INTO v_variant_stock, v_variant_active, v_unit_price
        FROM wig_variants WHERE id = v_variant_id AND wig_id = v_wig_id FOR UPDATE;

      IF NOT FOUND OR NOT v_variant_active THEN
        RAISE EXCEPTION 'item_unavailable: %', v_variant_id;
      END IF;
      IF v_variant_stock < v_qty THEN
        RAISE EXCEPTION 'out_of_stock: %', v_variant_id;
      END IF;

      UPDATE wig_variants SET stock_quantity = stock_quantity - v_qty, updated_at = now() WHERE id = v_variant_id;
    ELSE
      IF v_wig_stock < v_qty THEN
        RAISE EXCEPTION 'out_of_stock: %', v_wig_id;
      END IF;

      UPDATE wigs SET stock_quantity = stock_quantity - v_qty, updated_at = now() WHERE id = v_wig_id;
    END IF;

    INSERT INTO order_items (order_id, wig_id, variant_id, quantity, unit_price_cents)
    VALUES (v_order_id, v_wig_id, v_variant_id, v_qty, v_unit_price);

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  END LOOP;

  UPDATE orders SET subtotal_cents = v_subtotal, total_cents = v_subtotal WHERE id = v_order_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'subtotal_cents', v_subtotal);
END;
$$;

-- Sécurité (cf. mémoire "RPC Supabase — révoquer EXECUTE") : SECURITY DEFINER
-- contourne délibérément le stock/prix pour la logique métier, donc CETTE
-- fonction ne doit JAMAIS être appelable directement via PostgREST par un
-- client anon/authenticated — seul le endpoint serveur (service_role) doit
-- pouvoir la déclencher.
REVOKE EXECUTE ON FUNCTION public.place_order(JSONB, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, UUID, TEXT, TEXT) TO service_role;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 012
-- ════════════════════════════════════════════════════════════════════════
