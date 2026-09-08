import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/compte'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

// Exempté du gate maintenance : la page elle-même (pas de boucle), l'admin
// (pour pouvoir se connecter et le désactiver), et /connexion (requis pour
// atteindre l'admin).
const MAINTENANCE_EXEMPT = ['/maintenance', '/admin', '/connexion'];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ─── Dev preview bypass ───
  // En NODE_ENV=development uniquement : ?preview=1 contourne l'auth pour
  // permettre de visualiser /admin et /compte sans login. Ignoré en production
  // (la condition est inlinée par Next.js au build → branch dead en prod).
  if (process.env.NODE_ENV === 'development' && searchParams.get('preview') === '1') {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ─── Mode maintenance ─────────────────────────────
  // Flag `feature_flags.maintenance` (table posée en migration 002, jamais
  // câblée jusqu'ici — voir admin/reglages). Lecture publique (RLS
  // feature_flags_public_select), une requête légère par navigation.
  const isMaintenanceExempt = MAINTENANCE_EXEMPT.some((r) => pathname.startsWith(r));
  if (!isMaintenanceExempt) {
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'maintenance')
      .maybeSingle();
    if (flag?.enabled) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected || isAdmin || isAuthPage) {
    const { data: { user } } = await supabase.auth.getUser();

    if ((isProtected || isAdmin) && !user) {
      const loginUrl = new URL('/connexion', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // La coquille /admin n'était protégée par aucun rôle — n'importe quel
    // compte connecté pouvait la charger (les données restaient protégées
    // côté tRPC via adminProcedure, mais pas la navigation elle-même).
    if (isAdmin && user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/compte', request.url));
      }
    }

    if (isAuthPage && user) {
      return NextResponse.redirect(new URL('/compte', request.url));
    }
  }

  return response;
}

export const config = {
  // Tout sauf les assets statiques et l'API (webhooks Stripe/FedaPay doivent
  // rester joignables même en maintenance, et n'ont pas besoin de ce middleware).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
