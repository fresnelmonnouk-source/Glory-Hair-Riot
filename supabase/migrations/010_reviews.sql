-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 010 : Avis clients + modération            ║
-- ║                                                                        ║
-- ║ Contexte : wigs.rating et wigs.review_count (migration 006) sont des   ║
-- ║   valeurs STATIQUES codées en dur au moment du seed (ex. rating=4.9,   ║
-- ║   review_count=218 pour 'velours') — jamais recalculées depuis un vrai ║
-- ║   avis, et /admin/avis n'était qu'un stub "Bientôt disponible". Aucune ║
-- ║   table d'avis individuels n'existait avant cette migration.          ║
-- ║                                                                        ║
-- ║ Cette migration crée la table `reviews` (dépôt + modération) et un     ║
-- ║   trigger qui recalcule wigs.rating/review_count à partir des avis     ║
-- ║   `published` — remplaçant définitivement les valeurs codées en dur    ║
-- ║   par un vrai calcul dynamique, sans toucher aux affichages existants  ║
-- ║   (catalogue, sélection accueil) qui lisent déjà ces deux colonnes.    ║
-- ║                                                                        ║
-- ║ RLS : lecture publique des seuls avis status='published' (comme        ║
-- ║   `articles`) ; dépôt réservé aux comptes connectés (user_id=auth.uid,║
-- ║   statut par défaut 'pending' — jamais publié par l'auteur lui-même) ; ║
-- ║   modération (publish/reject) réservée aux admins via public.is_admin()║
-- ║   (migration 005, non redéfinie ici — réutilisée telle quelle), même   ║
-- ║   pattern que `articles`/`newsletters`.                                ║
-- ║                                                                        ║
-- ║ orders.user_id est nullable depuis la migration 006 (checkout invité). ║
-- ║   reviews.user_id reste NOT NULL : un avis "invité" non authentifié    ║
-- ║   serait impossible à faire respecter par la RLS (rien à comparer à    ║
-- ║   auth.uid()), donc le dépôt d'avis est réservé aux comptes connectés  ║
-- ║   — le lien order_id (nullable) sert uniquement à marquer un avis      ║
-- ║   "achat vérifié" quand une commande livrée existe pour ce compte.     ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════
-- 1. Table reviews
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wig_id uuid NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL, -- lien vers la commande qui justifie "achat vérifié" (nullable : avis sans commande retrouvée)
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  verified_purchase boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz,
  moderated_by uuid REFERENCES auth.users(id),

  -- Un seul avis par utilisateur et par produit (appliqué aussi côté tRPC
  -- pour renvoyer une erreur lisible avant d'atteindre cette contrainte).
  UNIQUE (wig_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_wig_status ON reviews (wig_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);

-- ════════════════════════════════════════════════════════════════════════
-- 2. RLS
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique : seuls les avis publiés (comme articles_public_select).
DROP POLICY IF EXISTS "reviews_public_select" ON reviews;
CREATE POLICY "reviews_public_select" ON reviews
  FOR SELECT USING (status = 'published');

-- L'auteur peut relire son propre avis même en attente/rejeté (ex. "Vous avez
-- déjà déposé un avis pour ce produit" côté fiche produit).
DROP POLICY IF EXISTS "reviews_own_select" ON reviews;
CREATE POLICY "reviews_own_select" ON reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Dépôt : un utilisateur connecté ne peut créer qu'un avis à son propre nom.
-- Le statut par défaut ('pending') et la contrainte CHECK empêchent toute
-- publication directe par l'auteur — seule une policy admin peut UPDATE status.
DROP POLICY IF EXISTS "reviews_own_insert" ON reviews;
CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Modération (SELECT/UPDATE/DELETE tous statuts) réservée aux admins — même
-- pattern que articles_admin_all / newsletters_admin_all.
DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 3. Trigger — recalcul dynamique de wigs.rating / wigs.review_count
-- ════════════════════════════════════════════════════════════════════════
-- Remplace les valeurs statiques codées en dur en migration 006 (ex.
-- rating=4.9, review_count=218 pour 'velours') par un vrai calcul :
-- moyenne (arrondie à 1 décimale) et compte des avis `status='published'`
-- pour le produit concerné. Se déclenche sur INSERT/UPDATE/DELETE de
-- `reviews` (un avis peut passer pending→published, published→rejected,
-- ou être supprimé) et recalcule à chaque fois pour rester exact, y
-- compris quand wig_id change sur UPDATE (recalcule l'ancien ET le nouveau).

CREATE OR REPLACE FUNCTION public.recalc_wig_rating(p_wig_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_count int;
BEGIN
  SELECT round(avg(rating)::numeric, 1), count(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE wig_id = p_wig_id AND status = 'published';

  UPDATE public.wigs
  SET rating = v_avg, review_count = coalesce(v_count, 0)
  WHERE id = p_wig_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviews_recalc_wig_rating_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_wig_rating(OLD.wig_id);
    RETURN OLD;
  END IF;

  PERFORM public.recalc_wig_rating(NEW.wig_id);
  IF TG_OP = 'UPDATE' AND OLD.wig_id IS DISTINCT FROM NEW.wig_id THEN
    PERFORM public.recalc_wig_rating(OLD.wig_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_recalc_wig_rating ON reviews;
CREATE TRIGGER reviews_recalc_wig_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_recalc_wig_rating_trigger();

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 010
-- ════════════════════════════════════════════════════════════════════════
