-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 008 : Newsletter IA + CRON hebdomadaire    ║
-- ║                                                                        ║
-- ║ 1. Table newsletters — historique des envois (brouillon généré par     ║
-- ║    le CRON hebdomadaire /api/cron/newsletter ou à la demande depuis    ║
-- ║    l'admin, envoi manuel ou automatique selon le flag ci-dessous).     ║
-- ║ 2. Feature flag newsletter_auto_send (false par défaut — sécurité :    ║
-- ║    envoyer à toute la liste d'abonnés est une action à fort impact,    ║
-- ║    difficile à annuler ; le CRON génère un brouillon tant que ce flag  ║
-- ║    n'est pas activé volontairement depuis l'admin).                    ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- ════════════════════════════════════════════════════════════════════════
-- 1. Table newsletters — historique des envois
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html_body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  recipients_count int,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)  -- NULL si généré par le CRON (aucun humain à l'origine)
);

CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Historique interne : aucune lecture publique, admin uniquement (public.is_admin(),
-- helper SECURITY DEFINER défini en migration 005 — réutilisé tel quel).
CREATE POLICY "newsletters_admin_all" ON newsletters
  FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 2. Feature flag newsletter_auto_send
-- ════════════════════════════════════════════════════════════════════════
-- Par défaut (false) : le CRON hebdomadaire génère un BROUILLON que l'admin
-- doit valider/envoyer manuellement depuis /admin/newsletter. Une fois la
-- confiance établie dans la qualité du contenu généré par l'IA, Fresnel peut
-- activer ce flag (même toggle générique que les autres flags, voir
-- admin.toggleFlag dans src/server/trpc/routers/admin.ts) pour que le CRON
-- envoie automatiquement, sans intervention humaine.

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('newsletter_auto_send', false, 'Envoi automatique de la newsletter hebdomadaire par le CRON (sinon : brouillon généré, envoi manuel requis depuis l''admin)')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 008
-- ════════════════════════════════════════════════════════════════════════
