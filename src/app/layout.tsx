import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Work_Sans, Playfair_Display } from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc/provider';
import '@/styles/riot.css';

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const workSans = Work_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  weight: ['600', '700'],
  style: ['italic'],
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const fontVars = [cormorant.variable, workSans.variable, playfair.variable].join(' ');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Glory Hair · Perruques cheveux humains premium',
  description: 'Perruques cheveux humains 100% Remy, essayage virtuel par IA. Atelier Paris 9.',
  keywords: ['perruques', 'extensions', 'cheveux humains', 'essayage virtuel', 'IA', 'beauté'],
  openGraph: {
    title: 'Glory Hair · Perruques cheveux humains premium',
    description: 'Perruques cheveux humains 100% Remy, essayage virtuel par IA. Atelier Paris 9.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVars}>
      <body suppressHydrationWarning>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
