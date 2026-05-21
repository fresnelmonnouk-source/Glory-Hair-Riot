import type { Metadata, Viewport } from 'next';
import {
  Anton,
  Permanent_Marker,
  Special_Elite,
  Yeseva_One,
  VT323,
  Rubik_Mono_One,
  Caveat,
  Archivo_Black,
} from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc/provider';
import '@/styles/riot.css';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-permanent-marker',
  display: 'swap',
});

const specialElite = Special_Elite({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-special-elite',
  display: 'swap',
});

const yesevaOne = Yeseva_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-yeseva-one',
  display: 'swap',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

const rubikMonoOne = Rubik_Mono_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-rubik-mono-one',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

const fontVars = [
  anton.variable,
  permanentMarker.variable,
  specialElite.variable,
  yesevaOne.variable,
  vt323.variable,
  rubikMonoOne.variable,
  caveat.variable,
  archivoBlack.variable,
].join(' ');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Glory Hair RIOT — Issue N°01',
  description: 'Perruques cheveux humains premium — Édition RIOT',
  keywords: ['perruques', 'extensions', 'cheveux humains', 'essayage virtuel', 'IA', 'beauté', 'RIOT'],
  openGraph: {
    title: 'Glory Hair RIOT — Issue N°01',
    description: 'Perruques cheveux humains premium — Édition RIOT',
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
