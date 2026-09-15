-- ════════════════════════════════════════════════════════════════════════
-- Migration 022 — Réapplique le verrou RLS sur reviews (partie de la 019
-- qui n'a pas pris, vérifié en conditions réelles le 2026-09-15)
-- ════════════════════════════════════════════════════════════════════════
--
-- Vérification réelle : un compte non-admin pouvait insérer directement un
-- avis avec status='published' (contournant la modération) — la policy
-- restrictive de la migration 019 n'est manifestement jamais entrée en
-- vigueur (orders/tryon_quotas de la même migration, eux, fonctionnent
-- bien — probable collage tronqué, cette section était la dernière du
-- fichier). Isolée ici dans son propre fichier pour être recollée seule,
-- sans avoir à rejouer toute la 019.

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
