'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Hook responsive — true quand la media query matche.
 *
 * Usage :
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * SSR-safe : retourne `false` au premier render serveur (pas de window).
 *
 * Implémenté via useSyncExternalStore (plutôt que useState+useEffect) :
 * c'est le pattern canonique React pour "lire une valeur externe + s'y
 * abonner" — évite d'appeler setState() synchronement dans le corps d'un
 * effet (interdit par le React Compiler) tout en gardant exactement le
 * même comportement (valeur initiale `false` côté serveur, valeur réelle
 * synchronisée côté client, mise à jour sur chaque changement).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Helpers prêts à l'emploi. */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 768px)');
export const useIsTablet = (): boolean => useMediaQuery('(max-width: 1024px)');
