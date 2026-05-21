import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

/**
 * Create tRPC context
 * Context is passed to all tRPC procedures
 * Contains authenticated user and database client
 */
export async function createTRPCContext(_opts?: FetchCreateContextFnOptions) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    supabase,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
