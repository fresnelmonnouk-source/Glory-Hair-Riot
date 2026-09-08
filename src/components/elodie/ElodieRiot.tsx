'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy —
   structure du "Conseiller" AdvisorTeaser reprise : pitch + panneau
   conversation, bulles rounded-full type "aperçu conversationnel"). Toute
   la logique (mutation tRPC, gestion d'erreurs, détection de perruque
   recommandée, auto-scroll) est strictement inchangée. */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { WIGS, type Wig } from '@/lib/wigs-data';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommended?: Wig;
}

const SUGGESTED_PROMPTS = [
  'Une perruque ondulée quotidien, ~250€ ?',
  'Quelle perruque pour un visage rond ?',
  'Je cherche du long cuivré, des idées ?',
];

const QUICK_REPLIES = ['Voir la fiche', 'Autres options', "Lancer l'essai"];

function findRecommendedWig(text: string): Wig | undefined {
  const lower = text.toLowerCase();
  return WIGS.find((w) => {
    const nameKeyword = w.name.replace(/\s*\d+"$/, '').trim().toLowerCase();
    return lower.includes(nameKeyword);
  });
}

export function ElodieRiot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'hello',
      role: 'assistant',
      content: "Bonjour ! Je suis Élodie, votre styliste IA. Décrivez-moi ce que vous cherchez (forme de visage, occasion, budget) et je vous recommande la pièce parfaite parmi nos 6 perruques Issue N°01.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.elodie.chat.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    const userMsg: Message = { id: 'u-' + Date.now(), role: 'user', content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const result = await chatMutation.mutateAsync({ message: text.trim() });
      const botMsg: Message = {
        id: 'b-' + Date.now(),
        role: 'assistant',
        content: result.content,
        recommended: findRecommendedWig(result.content),
      };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const tErr = err as { data?: { code?: string }; message?: string };
      const code = tErr?.data?.code;

      let friendly: string;
      if (code === 'PRECONDITION_FAILED') {
        friendly = `Élodie n'est pas configurée correctement côté serveur (${tErr.message ?? 'clé manquante'}).`;
      } else if (code === 'TOO_MANY_REQUESTS') {
        friendly = 'Trop de monde discute avec moi en ce moment. Réessaie dans une minute.';
      } else if (code === 'TIMEOUT') {
        friendly = "J'ai mis trop de temps à réfléchir. Réessaie avec une question plus simple.";
      } else if (code === 'INTERNAL_SERVER_ERROR') {
        friendly = `Erreur Élodie : ${tErr.message ?? 'inconnue'}`;
      } else {
        friendly = `Désolée, je n'arrive pas à te répondre. ${errMsg.slice(0, 200)}`;
      }

      setMessages((m) => [...m, { id: 'err-' + Date.now(), role: 'assistant', content: friendly }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-14">
        <div>
          <p className="eyebrow">Conseil · 24/7</p>
          <h1 className="display mt-4 text-[clamp(2rem,5vw,3.25rem)] text-ink">
            Élodie, votre styliste IA.
          </h1>
          <p className="mt-5 max-w-[440px] leading-relaxed text-muted">
            Forme de visage, occasion, budget — décrivez ce que vous cherchez en français
            normal. Élodie analyse, recommande, et reste disponible 24h/24.
          </p>

          <div className="mt-8">
            <p className="eyebrow">Vous pouvez lui demander</p>
            <div className="mt-3 flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={sending}
                  className="rounded-sm border border-input px-4 py-2.5 text-left text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-hairline bg-surface/60 p-6" style={{ minHeight: 560, maxHeight: 680 }}>
          <div className="flex items-center gap-3 border-b border-hairline pb-4">
            <div aria-hidden className="h-10 w-10 shrink-0 rounded-full" style={{ background: 'linear-gradient(160deg, var(--accent-hi), var(--accent-deep))' }} />
            <div>
              <p className="font-display text-lg text-ink">Élodie</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                {sending ? 'écrit…' : 'répond en quelques secondes'}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pt-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} onQuickReply={(reply) => {
                if (reply === "Lancer l'essai") { window.location.href = '/essayage'; return; }
                sendMessage(reply);
              }} />
            ))}
            {sending && (
              <div className="inline-flex gap-1 rounded-2xl border border-line px-4 py-2.5">
                <Dot delay="0s" /><Dot delay=".2s" /><Dot delay=".4s" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="mt-4 flex gap-2 border-t border-hairline pt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez à Élodie…"
              aria-label="Message pour Élodie"
              autoComplete="off"
              className="flex-1 rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-[color:var(--accent)]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message, onQuickReply }: { message: Message; onQuickReply: (reply: string) => void }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className="max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={isUser
          ? { background: 'var(--peach)', color: 'var(--on-accent)' }
          : { border: '1px solid var(--border-card)', color: 'var(--text-primary)' }}
      >
        {message.content}
      </div>

      {!isUser && message.recommended && (
        <Link
          href={`/perruque/${message.recommended.id}`}
          className="flex max-w-[88%] items-center gap-3 rounded-lg border border-hairline bg-app px-3 py-2.5 transition-colors hover:border-[color:var(--border-accent)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={message.recommended.img} alt={message.recommended.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <div>
            <p className="font-display text-sm text-ink">{message.recommended.name}</p>
            <p className="mt-0.5 text-xs text-accent">{message.recommended.price}€ · {message.recommended.swatches.length} coloris</p>
          </div>
        </Link>
      )}

      {!isUser && message.recommended && (
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => {
                if (qr === 'Voir la fiche') { window.location.href = `/perruque/${message.recommended!.id}`; return; }
                onQuickReply(qr);
              }}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-[color:var(--border-accent)] hover:text-ink"
            >
              {qr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: 'var(--text-faint)', animation: 'pulse 1s infinite', animationDelay: delay }}
    />
  );
}
