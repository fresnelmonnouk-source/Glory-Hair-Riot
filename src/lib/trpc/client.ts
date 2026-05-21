import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/root';

/**
 * tRPC React client
 * Use this in Client Components to call procedures
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Example usage in a Client Component:
 *
 * 'use client';
 * import { trpc } from '@/lib/trpc/client';
 *
 * export function MyComponent() {
 *   const { data: session } = trpc.auth.getSession.useQuery();
 *
 *   return <div>{session?.user?.email}</div>;
 * }
 */
