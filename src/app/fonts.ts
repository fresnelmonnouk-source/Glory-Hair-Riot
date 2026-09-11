import { Cormorant_Garamond, Work_Sans, Playfair_Display } from 'next/font/google';

/* Extrait de l'ancien app/layout.tsx unique — partagé entre les 3 racines
   indépendantes (public [lang], admin, maintenance) qui remplacent ce
   layout unique (migration i18n : une racine par branche déclare son
   propre <html>/<body>, cf. tech-next16-proxy-root-layouts). next/font
   dédupe automatiquement des appels identiques dans plusieurs fichiers. */

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

export const fontVars = [cormorant.variable, workSans.variable, playfair.variable].join(' ');
