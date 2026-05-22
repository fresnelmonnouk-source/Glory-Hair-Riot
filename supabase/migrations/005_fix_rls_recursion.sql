-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 005 : fix RLS récursive sur users          ║
-- ║                                                                        ║
-- ║ Bug : les policies "users_admin_all" et autres qui font                ║
-- ║   EXISTS (SELECT 1 FROM public.users WHERE id=auth.uid() AND role='admin')║
-- ║   provoquent une récursion infinie quand on query users (la policy se  ║
-- ║   ré-évalue elle-même).                                                 ║
-- ║                                                                        ║
-- ║ Fix : helper SECURITY DEFINER public.is_admin() qui bypass RLS pour    ║
-- ║   lire le rôle. Toutes les policies utilisent cette fonction.          ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- 1. Helper function (SECURITY DEFINER bypass RLS pour cette query)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Recréer les policies sans récursion

-- users
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (public.is_admin());

-- tryon_quotas
DROP POLICY IF EXISTS "tryon_quotas_admin_all" ON tryon_quotas;
CREATE POLICY "tryon_quotas_admin_all" ON tryon_quotas
  FOR ALL USING (public.is_admin());

-- glory_club_points_log
DROP POLICY IF EXISTS "points_log_admin_all" ON glory_club_points_log;
CREATE POLICY "points_log_admin_all" ON glory_club_points_log
  FOR ALL USING (public.is_admin());

-- newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_self_select" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_all" ON newsletter_subscribers;

CREATE POLICY "newsletter_self_select" ON newsletter_subscribers
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "newsletter_admin_all" ON newsletter_subscribers
  FOR ALL USING (public.is_admin());

-- feature_flags
DROP POLICY IF EXISTS "feature_flags_admin_all" ON feature_flags;
CREATE POLICY "feature_flags_admin_all" ON feature_flags
  FOR ALL USING (public.is_admin());

-- 3. Permettre INSERT public sur newsletter_subscribers (pas de RLS recursion ici)
-- (existait déjà via newsletter_public_insert, on garde)

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 005
-- ════════════════════════════════════════════════════════════════════════
