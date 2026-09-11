import type { Metadata } from 'next';
import { TRPCProvider } from '@/lib/trpc/provider';
import { fontVars } from '../fonts';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/styles/riot.css';

/* Racine indépendante (migration i18n) — l'admin reste HORS `[lang]`, en
   français uniquement (outil interne, pas client-facing, comme chez Sandy
   Stylish). Avant : héritait de l'ancien app/layout.tsx unique, qui n'existe
   plus (remplacé par 3 racines sœurs : [lang], admin, maintenance). */

export const metadata: Metadata = {
  title: 'Back-office · Glory Hair',
  description: 'Administration Glory Hair · Issue N°01.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVars}>
      <body suppressHydrationWarning>
        <TRPCProvider>
          <AdminShell>{children}</AdminShell>
        </TRPCProvider>
      </body>
    </html>
  );
}
