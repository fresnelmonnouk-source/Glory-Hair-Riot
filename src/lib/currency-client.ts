'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatMoney, type Currency } from '@/lib/money';

/* Sélecteur de devise (Phase 3, multi-devise) — cookie plutôt que segment
   d'URL (pattern Sandy Stylish), affichage uniquement : le checkout continue
   de facturer en EUR/XOF réel quelle que soit la devise choisie ici (voir
   money.ts). Repli 'EUR' tant que le cookie n'existe pas — comportement
   actuel inchangé pour tout visiteur qui n'a jamais touché au sélecteur.

   useSyncExternalStore plutôt que useState+useEffect (même pattern que
   useDebugEnabled dans TryonFlow.tsx) : le cookie est un état externe au
   rendu React (indisponible côté serveur), pas une variable synchronisée
   via un effet — évite le cascading-render que l'ESLint React Compiler
   signale sur un setState() direct dans un effet. Un évènement DOM custom
   ('gh-currency-change') fait office de mécanisme de notification : chaque
   composant qui utilise useMoneyFormatter() s'y abonne, donc TOUS se
   re-rendent quand un seul d'entre eux change la devise (sélecteur dans
   NavRiot, mais le prix affiché vit dans ProductCard/ProduitRiot/etc.). */

const COOKIE_NAME = 'gh_currency';
const CHANGE_EVENT = 'gh-currency-change';
const VALID_CURRENCIES: Currency[] = ['EUR', 'XOF', 'USD'];

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

function readCookie(): Currency {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const val = match?.[1] ? decodeURIComponent(match[1]) : null;
  return (VALID_CURRENCIES as string[]).includes(val ?? '') ? (val as Currency) : 'EUR';
}

function readCookieServer(): Currency {
  return 'EUR';
}

/**
 * Devise choisie (cookie) + taux USD live (siteSettings.getPublic, React
 * Query dédup/cache la requête si déjà chargée ailleurs sur la page) en un
 * seul helper `money(amountEurCents)` prêt à l'emploi.
 */
export function useMoneyFormatter() {
  const currency = useSyncExternalStore(subscribe, readCookie, readCookieServer);

  const settingsQ = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const usdRate = settingsQ.data?.usdRate.rate ?? 1.08;

  const setCurrency = useCallback((c: Currency) => {
    document.cookie = `${COOKIE_NAME}=${c}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const money = useCallback((amountEurCents: number) => formatMoney(amountEurCents, currency, usdRate), [currency, usdRate]);

  return { currency, setCurrency, money };
}
