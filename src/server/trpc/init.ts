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
 * Admin procedure — requires admin role (to be implemented)
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // TODO: Check user role from database
  return next({ ctx });
});
