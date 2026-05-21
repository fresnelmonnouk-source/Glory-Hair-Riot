import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase Server Client
 * Use this in Server Components and API routes
 * Service Role Key is only used when needed (admin operations)
 */
export function createServerSupabaseClient(useServiceRole = false) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Get current user session in Server Component
 */
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authenticated user in Server Component/Route
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
