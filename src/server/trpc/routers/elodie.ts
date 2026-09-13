import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../init';
import { getElodieResponse, ElodieError } from '@/server/services/elodie/elodie.service';
import { checkLimit, getRequestIp } from '@/lib/rate-limit';

function toTrpcError(err: unknown): never {
  if (err instanceof ElodieError) {
    const code =
      err.code === 'MISSING_KEY' || err.code === 'INVALID_KEY' ? 'PRECONDITION_FAILED' :
      err.code === 'RATE_LIMIT' ? 'TOO_MANY_REQUESTS' :
      err.code === 'TIMEOUT' ? 'TIMEOUT' :
      'INTERNAL_SERVER_ERROR';
    throw new TRPCError({ code, message: err.message, cause: err });
  }
  throw err;
}

export const elodieRouter = router({
  startConversation: protectedProcedure.mutation(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('Authentification requise');
    }

    const { data, error } = await supabase
      .from('elodie_conversations')
      .insert({
        user_id: userId,
        title: 'Nouvelle conversation',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user?.id;

    if (!userId) {
      throw new Error('Authentification requise');
    }

    const { data, error } = await supabase
      .from('elodie_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from('elodie_messages')
        .select('*')
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);

      return data || [];
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      // Save user message
      const { error: messageError } = await supabase
        .from('elodie_messages')
        .insert({
          conversation_id: input.conversationId,
          role: 'user',
          content: input.content,
        });

      if (messageError) throw new Error(messageError.message);

      // Get conversation context
      const { error: convError } = await supabase
        .from('elodie_conversations')
        .select('*')
        .eq('id', input.conversationId)
        .single();

      if (convError) throw new Error(convError.message);

      // Get previous messages for context
      const { data: messages, error: messagesError } = await supabase
        .from('elodie_messages')
        .select('*')
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw new Error(messagesError.message);

      // Get AI response from Deepseek v4
      const conversationMessages = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let content: string;
      let tokens_used: number;
      try {
        const res = await getElodieResponse(conversationMessages);
        content = res.content;
        tokens_used = res.tokens_used;
      } catch (err) {
        toTrpcError(err);
      }

      const assistantResponse = {
        role: 'assistant',
        content,
      };

      const { data: savedResponse, error: responseError } = await supabase
        .from('elodie_messages')
        .insert({
          conversation_id: input.conversationId,
          role: assistantResponse.role,
          content: assistantResponse.content,
          tokens_used,
        })
        .select()
        .single();

      if (responseError) throw new Error(responseError.message);

      return savedResponse;
    }),

  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('Authentification requise');
      }

      const { error } = await supabase
        .from('elodie_conversations')
        .delete()
        .eq('id', input.conversationId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);

      return { success: true };
    }),

  // Endpoint PUBLIC (pas de compte requis, pas de persistance) — c'est en
  // fait celui réellement utilisé par ElodieRiot.tsx (le composant
  // "Conseiller" affiché sans connexion). Trouvé sans AUCUN rate-limit
  // (audit 2026-09-13, en répondant à "les IA sont protégées contre les
  // injections de prompt") : n'importe qui pouvait scripter des appels
  // illimités à /api/trpc/elodie.chat, sans authentification, à la charge
  // du compte DeepSeek de Fresnel. Même limite que /api/newsletter (5/h/IP),
  // un conseil produit n'a pas besoin d'être plus permissif qu'un
  // formulaire d'inscription.
  chat: publicProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req ? getRequestIp(ctx.req) : 'unknown';
      const limit = checkLimit(`elodie-chat:${ip}`, 10, 3600_000);
      if (!limit.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Trop de messages envoyés. Réessayez dans un instant.',
        });
      }

      try {
        const { content, tokens_used } = await getElodieResponse([
          { role: 'user', content: input.message }
        ]);
        return { content, tokens_used };
      } catch (err) {
        toTrpcError(err);
      }
    }),
});
