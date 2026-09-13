-- ════════════════════════════════════════════════════════════════════════
-- Migration 019 — Ferme 3 failles de la même famille que la migration 018
-- ════════════════════════════════════════════════════════════════════════
-- Audit complet du 2026-09-13 (Raphaël + Zoé, indépendamment) : le même
-- défaut structurel corrigé sur `users` (018 — policy self-service sans
-- restriction de colonne/valeur) existe aussi sur 3 autres tables.

-- ─── 1. orders — un client pouvait insérer une fausse commande "payée" ───
-- Contourne entièrement place_order (migration 012, seul chemin de vérité
-- prix/stock). Vérifié : AUCUN code applicatif restant n'insère dans
-- `orders` via le client session (payments.ts, seul appelant, supprimé le
-- même jour) — /api/checkout utilise exclusivement le RPC place_order via
-- service_role. Aucune raison de garder une voie d'INSERT client direct.
DROP POLICY IF EXISTS "orders_user_insert" ON orders;

-- ─── 2. tryon_quotas — un client pouvait s'auto-attribuer un quota illimité ───
-- (`update({granted: 999999})`) → essais IA payants (Gemini/OpenAI) sans
-- limite. Vérifié : le seul appelant applicatif (src/app/api/tryon/route.ts)
-- est réécrit pour utiliser service_role (qui bypass RLS) au lieu du client
-- session — la policy self-update n'a donc plus aucune raison d'exister.
DROP POLICY IF EXISTS "tryon_quotas_self_update" ON tryon_quotas;

-- RPC atomique de remplacement (audit Tariq, race condition confirmée
-- indépendamment de la RLS ci-dessus) : src/app/api/tryon/route.ts lisait
-- used_count puis réécrivait `used_count = quotaRow.used_count + 1` calculé
-- en JS — deux requêtes concurrentes du même compte (2 onglets, double
-- génération pendant les 5-35s de latence IA) lisent la même valeur avant
-- que l'une n'écrive, la seconde écriture écrase la première au lieu de
-- s'additionner. Un seul UPDATE conditionnel côté Postgres règle ça
-- nativement (pas de lire-puis-écrire possible depuis un client JS).
-- SECURITY DEFINER + revoke explicite : seul service_role peut l'appeler,
-- jamais un client authenticated (cohérent avec la RLS supprimée ci-dessus).
CREATE OR REPLACE FUNCTION public.consume_tryon_quota(p_user_id uuid)
RETURNS TABLE(allowed boolean, used_count int, granted int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used int;
  v_granted int;
BEGIN
  -- Auto-crée la ligne si absente (comptes créés avant le trigger
  -- d'auto-seed, migration 002/004) — même valeur par défaut (2) que
  -- handle_new_user.
  INSERT INTO tryon_quotas (user_id, granted, used_count)
  VALUES (p_user_id, 2, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE tryon_quotas
  SET used_count = tryon_quotas.used_count + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE tryon_quotas.user_id = p_user_id
    AND tryon_quotas.used_count < tryon_quotas.granted
  RETURNING tryon_quotas.used_count, tryon_quotas.granted INTO v_used, v_granted;

  IF v_used IS NULL THEN
    SELECT tq.used_count, tq.granted INTO v_used, v_granted
    FROM tryon_quotas tq WHERE tq.user_id = p_user_id;
    RETURN QUERY SELECT false, v_used, v_granted;
  ELSE
    RETURN QUERY SELECT true, v_used, v_granted;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_tryon_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_tryon_quota(uuid) TO service_role;

-- ─── 3. reviews — un client pouvait s'auto-publier un faux avis "achat
-- vérifié" en contournant la modération (status/verified_purchase envoyés
-- directement à l'INSERT). Ici, contrairement aux deux ci-dessus, l'INSERT
-- client reste légitime (src/server/trpc/routers/reviews.ts utilise le
-- client session) — on resserre donc le WITH CHECK au lieu de le supprimer :
-- `status` doit être 'pending' quoi qu'il arrive, et `verified_purchase` ne
-- peut être `true` que si une commande livrée réelle de ce client contient
-- bien ce produit (même vérification que fait déjà l'app, rejouée ici comme
-- garde-fou indépendant).
DROP POLICY IF EXISTS "reviews_own_insert" ON reviews;
CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND (
      verified_purchase = false
      OR EXISTS (
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.wig_id = reviews.wig_id
          AND o.user_id = auth.uid()
          AND o.status = 'delivered'
      )
    )
  );
