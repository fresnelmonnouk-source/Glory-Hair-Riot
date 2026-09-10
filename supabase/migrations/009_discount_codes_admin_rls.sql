-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Migration 009 : Codes promo — policy admin RLS       ║
-- ║                                                                        ║
-- ║ Contexte : la table `discount_codes` existe depuis la migration        ║
-- ║   initiale (001) avec une policy de lecture publique                   ║
-- ║   `discount_codes_public_select` (codes actifs et dans leur fenêtre    ║
-- ║   de validité uniquement), mais AUCUNE policy d'écriture — impossible  ║
-- ║   de créer/modifier/désactiver/supprimer un code promo depuis l'admin  ║
-- ║   (/admin/promos) tant que cette migration n'est pas appliquée.        ║
-- ║                                                                        ║
-- ║ RLS : écriture (et lecture complète, y compris codes inactifs/expirés) ║
-- ║   réservée aux admins via public.is_admin() (migration 005, non        ║
-- ║   redéfinie ici — réutilisée telle quelle), même pattern que           ║
-- ║   articles_admin_all (007) et newsletters_admin_all (008). Les policies║
-- ║   SELECT (publique + admin) sont toutes deux permissives et            ║
-- ║   s'additionnent (OR) : un admin connecté voit TOUS les codes, un      ║
-- ║   visiteur anonyme ne voit que les codes actifs et valides.            ║
-- ╚════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "discount_codes_admin_all" ON discount_codes;
CREATE POLICY "discount_codes_admin_all" ON discount_codes
  FOR ALL USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- FIN MIGRATION 009
-- ════════════════════════════════════════════════════════════════════════
