/**
 * tRPC router messages — inbox des messages de contact (migration 014).
 *
 * Table : messages (name, email, subject, body, status: 'new'|'read'|'replied').
 * Écriture publique via /api/contact (REST, pas tRPC — cohérent avec
 * /api/newsletter, formulaire anonyme sans session). Ce routeur ne couvre
 * que la lecture/gestion admin.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../init';

export const messagesRouter = router({
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'new', 'read', 'replied']).default('all'),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from('messages')
        .select('id, name, email, subject, body, status, created_at', { count: 'exact' })
        // 'new' en premier (file prioritaire), puis le plus récent
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status !== 'all') {
        q = q.eq('status', input.status);
      }

      const { data, count, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { items: data ?? [], total: count ?? 0 };
    }),

  updateStatus: adminProcedure
    .input(z.object({
      messageId: z.string().uuid(),
      status: z.enum(['new', 'read', 'replied']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('messages')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.messageId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { ok: true };
    }),
});
