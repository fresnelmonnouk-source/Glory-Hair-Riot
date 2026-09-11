'use client';

import { useParams } from 'next/navigation';
import { defaultLocale, isLocale, type Locale } from './config';
import type { Dictionary } from './dictionaries';
import fr from './dictionaries/fr.json';
import en from './dictionaries/en.json';

/* Variante client-safe de src/i18n/dictionaries.ts (qui est `server-only`).
   Pour les pages qui sont directement 'use client' (formulaires auth,
   compte/mot-de-passe, merci) — pas de restructuration en wrapper serveur +
   composant client, juste ce hook + cet import direct des deux JSON
   (petits fichiers, le coût de bundler les deux locales est négligeable). */

const dictionaries: Record<Locale, Dictionary> = { fr, en: en as Dictionary };

export function getDictionaryClient(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Lit le segment [lang] de l'URL courante depuis un composant client. */
export function useLang(): Locale {
  const params = useParams<{ lang?: string | string[] }>();
  const raw = params?.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && isLocale(value) ? value : defaultLocale;
}
