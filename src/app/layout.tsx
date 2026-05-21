import type { Metadata, Viewport } from 'next';
import { TRPCProvider } from '@/lib/trpc/provider';
import '@/styles/design.css';
import '@/styles/responsive.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Glory Hair — Votre beauté, votre couronne',
  description:
    'Plateforme e-commerce premium de perruques avec essayage virtuel par IA',
  keywords: [
    'perruques',
    'extensions',
    'cheveux',
    'essayage virtuel',
    'IA',
    'beauté',
  ],
  openGraph: {
    title: 'Glory Hair',
    description: 'Perruques premium avec essayage virtuel par IA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
