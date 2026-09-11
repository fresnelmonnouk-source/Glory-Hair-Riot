import { fontVars } from '../fonts';
import '@/styles/riot.css';

/* Racine indépendante (migration i18n) — page utilitaire, française
   uniquement, jamais localisée (voir src/proxy.ts : exemptée du gate
   maintenance elle-même, et hors de portée du segment [lang]). Pas de
   TRPCProvider : cette page ne fait aucun appel tRPC. */

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVars}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
