import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../init';
import { getElodieResponse } from '@/server/services/elodie/elodie.service';

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
      const conversationMessages = (messages || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const { content, tokens_used } = await getElodieResponse(
        conversationMessages
      );

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

  chat: publicProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const { content, tokens_used } = await getElodieResponse([
        { role: 'user', content: input.message }
      ]);
      return { content, tokens_used };
    }),
});
