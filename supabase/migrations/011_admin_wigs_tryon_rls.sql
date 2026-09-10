-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 011 : RLS admin manquante                  ║
-- ║   wigs, wig_images (écriture) + tryon_results (lecture admin)          ║
-- ║                                                                        ║
-- ║ Contexte : comme pour orders/order_items (migration 006) et            ║
-- ║ articles/newsletters (007/008), les policies deny-all posées par la    ║
-- ║ migration 001 sur wigs et wig_images ("USING (false) WITH CHECK        ║
-- ║ (false)", commentées "only service role can bypass") n'ont JAMAIS été  ║
-- ║ remplacées par une policy is_admin() — contrairement à users,          ║
-- ║ tryon_quotas, glory_club_points_log, newsletter_subscribers et         ║
-- ║ feature_flags, corrigées en 005.                                       ║
-- ║                                                                        ║
-- ║ Le contexte tRPC (src/server/trpc/context.ts) utilise un client        ║
-- ║ Supabase user-scopé (clé anon + JWT de session), PAS le service role — ║
-- ║ donc admin.updateProduct (déjà existant) heurtait ce deny-all et       ║
-- ║ échouait SILENCIEUSEMENT (UPDATE filtré par RLS = 0 ligne affectée,    ║
-- ║ PostgREST ne renvoie pas d'erreur), et admin.createProduct/            ║
-- ║ deleteProduct (nouveaux) auraient été bloqués avec une erreur 42501    ║
-- ║ explicite ("new row violates row-level security policy"). Confirmé    ║
-- ║ empiriquement avant d'écrire cette migration, via un compte admin      ║
-- ║ jetable signé avec la clé anon (le même chemin que ctx.supabase) :     ║
-- ║   UPDATE wigs  → 0 ligne affectée, aucune erreur                       ║
-- ║   INSERT wigs  → 42501 row-level security policy                       ║
-- ║                                                                        ║
-- ║ tryon_results n'avait par ailleurs AUCUNE policy admin (SELECT limité  ║
-- ║ à `auth.uid() = user_id OR shared = true`, migration 001) — nécessaire ║
-- ║ pour admin.customerDetails (historique d'essai virtuel d'un client     ║
-- ║ précis) et, en creux, pour admin.kpis (comptage 24h) qui sous-comptait ║
-- ║ déjà silencieusement pour la même raison.                              ║
-- ║                                                                        ║
-- ║ ⚠️  À APPLIQUER MANUELLEMENT dans Supabase Dashboard → SQL Editor      ║
-- ║ (comme la migration 007 pour `articles`) : aucun token CLI/DB          ║
-- ║ disponible dans cet environnement pour pousser la migration            ║
-- ║ automatiquement. Tant que ce n'est pas fait, createProduct/            ║
-- ║ deleteProduct/updateProduct échouent (updateProduct : silencieusement),║
-- ║ et customerDetails renvoie un historique d'essai virtuel toujours vide ║
-- ║ pour les clients d'un autre utilisateur que l'admin lui-même.          ║
-- ╚════════════════════════════════════════════════════════════════════════╝

-- wigs : remplace le deny-all par is_admin() (lecture publique déjà OK,
-- policy "wigs_public_select" inchangée depuis la migration 001).
DROP POLICY IF EXISTS "wigs_admin_mutations" ON wigs;
CREATE POLICY "wigs_admin_mutations" ON wigs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- wig_images : idem — nécessaire pour le nettoyage explicite fait par
-- admin.deleteProduct (même si ON DELETE CASCADE couvrirait déjà le cas
-- via la suppression de la ligne wigs elle-même).
DROP POLICY IF EXISTS "wig_images_admin_mutations" ON wig_images;
CREATE POLICY "wig_images_admin_mutations" ON wig_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- tryon_results : ajoute la lecture admin (aucune policy admin avant,
-- policies existantes "user voit/modifie son propre essai" inchangées).
CREATE POLICY "tryon_results_admin_select" ON tryon_results
  FOR SELECT USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 011
-- ════════════════════════════════════════════════════════════════════════
