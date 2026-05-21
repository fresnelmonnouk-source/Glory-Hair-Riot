'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function ElodieWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startConversationMutation =
    trpc.elodie.startConversation.useMutation();
  const sendMessageMutation = trpc.elodie.sendMessage.useMutation();
  const { data: fetchedMessages } = trpc.elodie.getMessages.useQuery(
    { conversationId: conversationId || '' },
    { enabled: !!conversationId }
  );

  // Initialize conversation on open
  useEffect(() => {
    if (isOpen && !conversationId) {
      startConversationMutation.mutate(undefined, {
        onSuccess: (conv) => {
          setConversationId(conv.id);
        },
      });
    }
  }, [isOpen]);

  // Update messages when fetched
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
      scrollToBottom();
    }
  }, [fetchedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId,
        content: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        },
        {
          id: response.id,
          role: 'assistant' as const,
          content: response.content,
          created_at: response.created_at,
        },
      ]);

      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl z-40"
        aria-label="Chat avec ELODIE"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-full max-w-sm bg-surface rounded-lg border border-line-soft shadow-2xl overflow-hidden z-40 flex flex-col h-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-gold to-gold-light px-4 py-4 text-white">
            <h3 className="font-serif text-lg">ELODIE</h3>
            <p className="text-xs opacity-90">Assistant intelligent Glory Hair</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-warm">
            {messages.length === 0 ? (
              <div className="text-center text-ink-soft text-sm">
                <p>Bonjour! Je suis ELODIE 👋</p>
                <p className="mt-2 text-xs">
                  Posez-moi vos questions sur nos perruques.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-gold text-white'
                        : 'bg-surface border border-line-soft text-ink'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-line-soft px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-line-soft p-4 bg-surface flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre question..."
              className="flex-1 px-3 py-2 rounded border border-line-soft text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 bg-gold text-white rounded font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}
