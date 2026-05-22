import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires authenticated user
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
  }
  return next({
    ctx: {
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});

/**
 * Admin procedure — requires user.role === 'admin' (Phase 5).
 *
 * Lit public.users.role pour l'user auth courant (single query).
 * RLS : la policy "users_admin_all" autorise admin à voir tous les profils,
 * mais ici on lit juste son propre profil donc la policy "self_select"
 * suffit (toujours autorisée).
 *
 * Erreurs :
 * - UNAUTHORIZED si pas logged (hérité de protectedProcedure)
 * - FORBIDDEN si role !== 'admin'
 * - INTERNAL_SERVER_ERROR si la query users échoue
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { data: profile, error } = await ctx.supabase
    .from('users')
    .select('role')
    .eq('id', ctx.user.id)
    .single();

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Impossible de vérifier le rôle. Réessaie.',
      cause: error,
    });
  }

  if (profile?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux comptes admin.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      role: profile.role as 'admin',
    },
  });
});
