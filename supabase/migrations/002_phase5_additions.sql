-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration Phase 5                                    ║
-- ║ Date : 2026-05-22                                                      ║
-- ║                                                                        ║
-- ║ Ajouts au schéma V1 (001_initial_schema.sql) :                         ║
-- ║   1. Colonnes users : role, points, tier, newsletter                   ║
-- ║   2. Tables : tryon_quotas, glory_club_points_log,                     ║
-- ║               newsletter_subscribers, feature_flags                    ║
-- ║   3. RLS policies + triggers                                           ║
-- ║   4. Trigger handle_new_user pour auto-créer profil users              ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════
-- 1. EXTENSION COLONNES users
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin', 'support')),
  ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0
    CHECK (points >= 0),
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'bronze'
    CHECK (tier IN ('bronze', 'argent', 'or', 'vip')),
  ADD COLUMN IF NOT EXISTS newsletter BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- ════════════════════════════════════════════════════════════════════════
-- 2. tryon_quotas — remplace localStorage anti-abuse
-- ════════════════════════════════════════════════════════════════════════
-- Pour les users connectés : 5 essais Premium offerts (re-créditables)
-- Pour les anon : on garde localStorage (24h sliding window)

CREATE TABLE IF NOT EXISTS tryon_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  granted INT NOT NULL DEFAULT 5 CHECK (granted >= 0),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tryon_quotas_user_id ON tryon_quotas(user_id);

-- ════════════════════════════════════════════════════════════════════════
-- 3. glory_club_points_log — historique points fidélité
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS glory_club_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                           -- "Commande #142 · Ginger 22\""
  value INT NOT NULL,                            -- +349 ou -250
  source TEXT NOT NULL CHECK (source IN (
    'order', 'review', 'referral', 'birthday', 'signup', 'tryon_redemption', 'admin_adjust'
  )),
  reference_id UUID,                             -- ID de la commande/avis/etc. si applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_log_user ON glory_club_points_log(user_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════════════
-- 4. newsletter_subscribers — pour Resend audience
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'footer' CHECK (source IN (
    'footer', 'inscription', 'admin_import', 'checkout'
  )),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  resend_audience_id TEXT                        -- ID dans l'audience Resend
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(unsubscribed_at) WHERE unsubscribed_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════
-- 5. feature_flags — toggle global (maintenance, tryon, elodie)
-- ════════════════════════════════════════════════════════════════════════
-- Riot.html utilise data-flag-need="tryon" / data-flag-fallback. On porte ça
-- en table pour pouvoir activer/désactiver via admin sans déployer.

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('tryon',       true,  'Module Essai Live IA actif'),
  ('elodie',      true,  'Chat Élodie IA actif'),
  ('newsletter',  true,  'Inscription newsletter active'),
  ('fidelite',    true,  'Programme Glory Club actif'),
  ('maintenance', false, 'Mode maintenance globale (redirige toutes les routes)')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- 6. Trigger handle_new_user — crée le profil users + quota + signup points
-- ════════════════════════════════════════════════════════════════════════
-- Quand un user s'inscrit via /inscription, Supabase Auth crée auth.users.
-- On crée automatiquement la ligne public.users + tryon_quotas + +50 pts.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 1. Profil users
  INSERT INTO public.users (id, email, full_name, newsletter, role, points, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'prenom'),
    COALESCE((NEW.raw_user_meta_data->>'newsletter')::boolean, false),
    'customer',
    50,        -- +50 pts à la création
    'bronze'
  );

  -- 2. Quota tryon (5 essais Premium offerts au signup)
  INSERT INTO public.tryon_quotas (user_id, granted, used_count)
  VALUES (NEW.id, 5, 0);

  -- 3. Log points signup
  INSERT INTO public.glory_club_points_log (user_id, label, value, source)
  VALUES (NEW.id, 'Création de compte', 50, 'signup');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════
-- 7. RLS — Row Level Security sur les nouvelles tables
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE tryon_quotas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE glory_club_points_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags            ENABLE ROW LEVEL SECURITY;

-- tryon_quotas : user voit/modifie son propre quota
CREATE POLICY "tryon_quotas_self_select" ON tryon_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tryon_quotas_self_update" ON tryon_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tryon_quotas_admin_all" ON tryon_quotas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- glory_club_points_log : user voit son historique, admin écrit
CREATE POLICY "points_log_self_select" ON glory_club_points_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "points_log_admin_all" ON glory_club_points_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- newsletter_subscribers : public INSERT (footer form), admin SELECT
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "newsletter_self_select" ON newsletter_subscribers
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "newsletter_admin_all" ON newsletter_subscribers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- feature_flags : public SELECT, admin UPDATE
CREATE POLICY "feature_flags_public_select" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "feature_flags_admin_all" ON feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════
-- 8. Update RLS sur users (ajouter policy admin)
-- ════════════════════════════════════════════════════════════════════════
-- (Les policies "user voit son propre profil" sont supposées exister dans 001.
-- On ajoute une policy admin pour lire/modifier tous les profils.)

CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════
-- 9. Trigger auto-update tier selon points
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tier := CASE
    WHEN NEW.points >= 3000 THEN 'vip'
    WHEN NEW.points >= 1500 THEN 'or'
    WHEN NEW.points >= 500  THEN 'argent'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_tier_auto_update ON users;
CREATE TRIGGER user_tier_auto_update
  BEFORE UPDATE OF points ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_tier();

-- ════════════════════════════════════════════════════════════════════════
-- 10. Helper view : v_user_dashboard (utilisée par /compte)
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.points,
  u.tier,
  u.newsletter,
  u.created_at AS member_since,
  COALESCE(o.orders_count, 0)           AS orders_count,
  COALESCE(w.wishlist_count, 0)         AS wishlist_count,
  COALESCE(t.tryon_used, 0)             AS tryon_used,
  COALESCE(t.tryon_granted, 5)          AS tryon_granted
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS orders_count FROM orders
  GROUP BY user_id
) o ON o.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS wishlist_count FROM wishlist_items
  GROUP BY user_id
) w ON w.user_id = u.id
LEFT JOIN (
  SELECT user_id, used_count AS tryon_used, granted AS tryon_granted FROM tryon_quotas
) t ON t.user_id = u.id;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 002
-- ════════════════════════════════════════════════════════════════════════
