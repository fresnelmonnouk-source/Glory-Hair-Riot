-- ════════════════════════════════════════════════════════════════════════
-- Migration 017 — Synchro e-mail auth.users → public.users
-- ════════════════════════════════════════════════════════════════════════
-- Contexte : nouvelle page /admin/profil permet à un admin de changer son
-- e-mail via supabase.auth.updateUser({ email }). Ça modifie auth.users
-- (une fois le/les lien(s) de confirmation cliqués côté GoTrue), mais RIEN
-- ne synchronisait jusqu'ici public.users.email — toutes les listes admin
-- (listCustomers, customerDetails...) lisent public.users.email, qui serait
-- resté figé sur l'ancienne adresse indéfiniment.
--
-- SECURITY DEFINER : nécessaire pour écrire dans public.users depuis un
-- trigger sur auth.users (schéma géré par Supabase, pas par cette app).
-- Se déclenche uniquement APRÈS que l'e-mail a réellement changé côté
-- GoTrue (donc après confirmation), jamais avant.

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();
