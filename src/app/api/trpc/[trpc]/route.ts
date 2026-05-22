import { createTRPCContext } from '@/server/trpc/context';
import { appRouter } from '@/server/trpc/root';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

/**
 * Élodie / tryon peuvent durer 5-25s (LLM streaming).
 * Vercel Hobby = 10s max, Pro = 60s. On vise 30s qui couvre 99% des cas Élodie
 * sans dépasser le Hobby limit si jamais le plan change.
 */
export const maxDuration = 30;
export const runtime = 'nodejs';

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path ?? '<unknown>'}:`, error);
    },
  });
};

export { handler as GET, handler as POST };
