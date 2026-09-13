import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

/**
 * Create tRPC context
 * Context is passed to all tRPC procedures
 * Contains authenticated user and database client
 */
export async function createTRPCContext(
  opts?: FetchCreateContextFnOptions
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Exposé pour les rares procédures publiques qui appellent une API tierce
  // payante sans authentification (ex. elodie.chat) et doivent donc se
  // rate-limiter elles-mêmes par IP — audit 2026-09-13.
  return {
    user,
    supabase,
    req: opts?.req,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
