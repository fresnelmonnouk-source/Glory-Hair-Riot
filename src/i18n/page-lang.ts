import { isLocale, defaultLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

/** Résout `[lang]` + son dictionnaire pour un page.tsx serveur — évite de
    répéter ce couple partout (chaque page re-fait l'appel, pattern Sandy). */
export async function resolvePageLang(params: Promise<{ lang: string }>): Promise<{ lang: Locale; dict: Dictionary }> {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = await getDictionary(lang);
  return { lang, dict };
}
