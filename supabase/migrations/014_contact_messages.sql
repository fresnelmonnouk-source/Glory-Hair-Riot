-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair — Migration 014 : messages de contact (inbox admin)          ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- Gap trouvé dans l'audit de parité vs Sandy Stylish : /sav/contact
-- redirigeait simplement vers la FAQ, aucun formulaire réel, aucune trace
-- des messages clients pour l'admin (contrairement à `messages` + admin
-- inbox chez Sandy). Table volontairement simple (pas de threads/réponses —
-- juste un statut) : le "traitement" reste par email (mailto), cette table
-- sert à ne PAS perdre un message et à suivre ce qui a déjà été traité.

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'read' | 'replied'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_status_created ON messages (status, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Écriture publique (formulaire de contact anonyme) — INSERT seulement,
-- jamais de SELECT public (les messages contiennent des adresses email de
-- visiteurs, pas une donnée à exposer). Toutes les lectures/écritures
-- admin passent par service_role de toute façon (route /api/contact et
-- routeur tRPC messages), cette policy ne sert qu'à documenter l'intention
-- si jamais un accès direct PostgREST anon était tenté.
CREATE POLICY "messages_public_insert" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_admin_all" ON messages FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 014
-- ════════════════════════════════════════════════════════════════════════
