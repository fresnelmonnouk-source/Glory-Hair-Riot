'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';

/**
 * Retourne l'URL de base à utiliser pour les requêtes tRPC.
 *
 * - Navigateur : URL relative `''` → `/api/trpc` même origin, fonctionne en
 *   dev, sur n'importe quelle preview Vercel, et en prod sans config.
 * - SSR : URL absolue, nécessaire car fetch côté serveur ne résout pas le path.
 *
 * **Ne JAMAIS hardcoder NEXT_PUBLIC_APP_URL ici** : cette var est bakée au
 * build, donc si `.env.local` contient localhost, tous les déploiements
 * Vercel essaieront de joindre localhost depuis le navigateur du visiteur.
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''; // browser : relative URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // Include credentials for authentication
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
