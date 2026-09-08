import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create Supabase Server Client
 * Use this in Server Components, Route Handlers and the tRPC context.
 *
 * Lit la session depuis les cookies Next.js (mêmes cookies que proxy.ts,
 * posés par le client browser via @supabase/ssr) — sans ça, auth.getUser()
 * ne voit jamais personne : c'était le bug (toute protectedProcedure/
 * adminProcedure renvoyait 401 pour tout le monde, y compris connecté).
 * Service Role Key = bypass RLS, pas de session utilisateur nécessaire.
 */
export async function createServerSupabaseClient(useServiceRole = false) {
  if (useServiceRole) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un contexte en lecture seule (Server Component) —
            // sans effet ; proxy.ts rafraîchit déjà la session côté middleware.
          }
        },
      },
    }
  );
}

/**
 * Get current user session in Server Component
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
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
