import type { Metadata, Viewport } from 'next';
import { TRPCProvider } from '@/lib/trpc/provider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Glory Hair RIOT — Issue N°01',
  description:
    'Perruques cheveux humains premium — Édition RIOT',
  keywords: [
    'perruques',
    'extensions',
    'cheveux humains',
    'essayage virtuel',
    'IA',
    'beauté',
    'RIOT',
  ],
  openGraph: {
    title: 'Glory Hair RIOT — Issue N°01',
    description: 'Perruques cheveux humains premium — Édition RIOT',
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
