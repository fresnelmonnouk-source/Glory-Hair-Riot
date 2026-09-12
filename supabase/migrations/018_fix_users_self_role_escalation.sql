-- ════════════════════════════════════════════════════════════════════════
-- Migration 018 — Bloque l'auto-escalade de rôle sur `users`
-- ════════════════════════════════════════════════════════════════════════
-- 🔴 Faille trouvée le 2026-09-12 en préparant la page /admin/profil : la
-- policy "users_update_own" (001_initial_schema.sql) autorise un
-- utilisateur connecté à modifier N'IMPORTE QUELLE colonne de sa propre
-- ligne — role/points/tier inclus. RLS ne restreint que les LIGNES
-- visibles, pas les colonnes modifiables. Concrètement, n'importe quel
-- client inscrit pouvait s'auto-promouvoir admin avec un simple appel
-- direct à l'API Supabase (update({role:'admin'}).eq('id', sonPropreId)),
-- sans jamais passer par une page du site.
--
-- Fix retenu : trigger BEFORE UPDATE plutôt qu'un GRANT column-level, car
-- un GRANT aurait aussi cassé les mutations légitimes qui touchent role/
-- points/tier via le même rôle Postgres "authenticated" (setUserRole côté
-- admin.ts, award-points.ts). Le trigger ne bloque QUE le cas précis
-- "un non-admin modifie SA PROPRE ligne ET change role/points/tier" :
--   - service_role (award-points.ts, webhooks, scripts) : auth.uid() est
--     NULL pour ces connexions → jamais bloqué.
--   - un admin qui modifie la ligne d'un AUTRE utilisateur (setUserRole) :
--     auth.uid() != OLD.id → jamais bloqué (déjà gardé par la policy
--     users_admin_all + adminProcedure en amont).
--   - un admin qui se met à jour lui-même sans changer role/points/tier :
--     NEW = OLD sur ces colonnes → jamais bloqué.
-- Réutilise public.is_admin() (helper SECURITY DEFINER posé en migration
-- 005, anti-récursion RLS).

CREATE OR REPLACE FUNCTION public.guard_users_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id
     AND NOT public.is_admin()
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.points IS DISTINCT FROM OLD.points
       OR NEW.tier IS DISTINCT FROM OLD.tier
     ) THEN
    RAISE EXCEPTION 'Modification de role/points/tier réservée aux admins.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_users_self_role_escalation ON public.users;
CREATE TRIGGER trg_guard_users_self_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_users_self_role_escalation();
