-- ════════════════════════════════════════════════════════════════════════
-- Migration 021 — Clé d'idempotence sur place_order (audit fiabilité 2026-09-13)
-- ════════════════════════════════════════════════════════════════════════
--
-- Un double-clic ou un retry réseau (fréquent sur mobile/3G, marché cible)
-- déclenchait deux POST /api/checkout indépendants : place_order est
-- atomique en lui-même (pas de survente), mais créait bel et bien DEUX
-- commandes distinctes et décrémentait le stock deux fois pour un seul
-- achat réel. Le stock finissait par être restauré par le cron
-- expire-orders, mais restait indisponible entre-temps pour d'autres
-- acheteurs, et l'utilisateur pouvait se retrouver avec deux sessions de
-- paiement ouvertes.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key UUID;

-- Index unique PARTIEL (uniquement sur les lignes qui en ont une) : les
-- commandes créées avant ce correctif, ou par un chemin qui n'en fournit
-- pas, gardent idempotency_key NULL sans jamais entrer en conflit entre
-- elles (NULL n'est jamais égal à NULL dans une contrainte UNIQUE standard,
-- mais un index partiel le rend explicite et évite toute ambiguïté).
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.place_order(
  p_items JSONB,
  p_customer_id UUID,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_idempotency_key UUID DEFAULT NULL
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
  v_existing_id UUID;
  v_existing_subtotal INT;
BEGIN
  -- Replay idempotent : une commande avec cette clé existe déjà (retry
  -- réseau normal, arrivé APRÈS que la première tentative ait fini) —
  -- renvoie directement son résultat, ne touche plus au stock.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, subtotal_cents INTO v_existing_id, v_existing_subtotal
      FROM orders WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('order_id', v_existing_id, 'subtotal_cents', v_existing_subtotal, 'idempotent_replay', true);
    END IF;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'bad_request: no items';
  END IF;
  IF jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'bad_request: too many items';
  END IF;

  -- Coquille de commande d'abord (montants posés à 0, complétés ci-dessous
  -- puis par l'UPDATE applicatif qui suit l'appel RPC) — tout dans la même
  -- transaction, un rollback plus loin efface aussi cet insert.
  BEGIN
    INSERT INTO orders (user_id, guest_email, guest_phone, status, subtotal_cents, shipping_cents, discount_cents, total_cents, payment_status, idempotency_key)
    VALUES (p_customer_id, p_guest_email, p_guest_phone, 'pending', 0, 0, 0, 0, 'pending', p_idempotency_key)
    RETURNING id INTO v_order_id;
  EXCEPTION WHEN unique_violation THEN
    -- Vraie course : deux appels avec la même clé quasi simultanés, l'autre
    -- a gagné entre notre vérification ci-dessus et cet INSERT. Renvoie SA
    -- commande plutôt que d'échouer ou de décrémenter le stock une 2e fois.
    SELECT id, subtotal_cents INTO v_existing_id, v_existing_subtotal
      FROM orders WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object('order_id', v_existing_id, 'subtotal_cents', v_existing_subtotal, 'idempotent_replay', true);
  END;

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

  RETURN jsonb_build_object('order_id', v_order_id, 'subtotal_cents', v_subtotal, 'idempotent_replay', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(JSONB, UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, UUID, TEXT, TEXT, UUID) TO service_role;

-- L'ancienne signature à 4 arguments (sans idempotency_key) est supprimée :
-- CREATE OR REPLACE ne remplace pas une fonction si la signature change,
-- il en crée une seconde en parallèle (Postgres autorise la surcharge). Le
-- code appelant est mis à jour pour toujours passer les 5 arguments, donc
-- l'ancienne devient morte — on la retire pour ne pas laisser deux
-- fonctions "place_order" divergentes rappelables via service_role.
DROP FUNCTION IF EXISTS public.place_order(JSONB, UUID, TEXT, TEXT);
