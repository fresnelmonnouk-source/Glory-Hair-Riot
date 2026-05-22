-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 004 : nouveaux quotas                      ║
-- ║ Date : 2026-05-22                                                      ║
-- ║                                                                        ║
-- ║ Changement de règles :                                                 ║
-- ║   - Anon : 1 essai par appareil par 30 jours (au lieu de 2 / 24h)     ║
-- ║   - Logged : 2 essais Premium offerts (au lieu de 5)                   ║
-- ║   - Total essais gratuits = 3 (1 anon + 2 logged)                      ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════
-- 1. Update trigger handle_new_user : granted=2 (au lieu de 5)
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, newsletter, role, points, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'prenom'),
    COALESCE((NEW.raw_user_meta_data->>'newsletter')::boolean, false),
    'customer',
    50,
    'bronze'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Quota : 2 essais Premium offerts au signup (au lieu de 5)
  INSERT INTO public.tryon_quotas (user_id, granted, used_count)
  VALUES (NEW.id, 2, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.glory_club_points_log (user_id, label, value, source)
  VALUES (NEW.id, 'Création de compte', 50, 'signup');

  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 2. Migration data : update existing quotas
-- ════════════════════════════════════════════════════════════════════════
-- Pour les users existants qui ont encore granted=5 (créés sous l'ancienne
-- règle), on les ramène à granted=2. used_count est préservé.

UPDATE public.tryon_quotas
SET granted = 2,
    updated_at = now()
WHERE granted = 5;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 004
-- ════════════════════════════════════════════════════════════════════════
