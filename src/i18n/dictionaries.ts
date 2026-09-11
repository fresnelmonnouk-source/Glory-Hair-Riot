import 'server-only';
import type { Locale } from './config';
import fr from './dictionaries/fr.json';
import en from './dictionaries/en.json';

/* `server-only` : les dictionnaires ne sont JAMAIS envoyés au client (Server
   Components uniquement). Le type `Dictionary` est dérivé de fr.json et
   appliqué à en.json — si en.json perd une clé ou en a une en trop, tsc
   échoue à la compilation (parité forcée entre les deux locales, pattern
   Sandy Stylish). */
export type Dictionary = typeof fr;

const dictionaries: Record<Locale, Dictionary> = { fr, en: en as Dictionary };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}
