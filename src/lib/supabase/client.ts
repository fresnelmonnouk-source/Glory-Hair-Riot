import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get or create Supabase browser client
 * Use this in Client Components and browser-side code
 */
export function getSupabaseBrowserClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

/**
 * Sign out user and clear session
 */
export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}
