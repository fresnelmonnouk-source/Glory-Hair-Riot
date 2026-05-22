'use client';

/**
 * Page Élodie RIOT — port fidèle <section class="elodie"> Riot.html (2401-2461)
 * + CSS 1369-1428.
 *
 * Composant client : chat fonctionnel via trpc.elodie.chat (public, sans auth).
 * Pas de persistance — pour conversations sauvegardées, utiliser le widget
 * authentifié (ElodieWidget) sur les pages compte.
 *
 * Pour les pills de produits recommandés, parse la réponse Élodie à la
 * recherche de noms de wigs (Velours, Mocha, Ginger, Bordeaux, Argent, Café Crème)
 * et affiche une chat-pill cliquable vers /perruque/[id].
 */

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

const QUICK_REPLIES = [
  'Voir la fiche',
  'Autres options',
  'Lancer l\'essai',
];

// Détecte un nom de wig dans une réponse Élodie pour afficher la chat-pill
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
      content: 'Bonjour ★ Je suis Élodie, ta styliste IA. Décris-moi ce que tu cherches (forme de visage, occasion, budget) et je te recommande la pièce parfaite parmi nos 6 perruques Issue N°01.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.elodie.chat.useMutation();

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    const userMsg: Message = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: text.trim(),
    };
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
      setMessages((m) => [...m, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: errMsg.includes('DEEPSEEK')
          ? 'Élodie est temporairement indisponible. Notre équipe a été prévenue.'
          : 'Désolée, je n\'arrive pas à te répondre pour le moment. Réessaie dans un instant.',
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="container-pad" style={{
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
      borderBottom: '3px solid #FF7A1A',
      position: 'relative',
      overflow: 'hidden',
      background: `
        repeating-linear-gradient(135deg, transparent 0 60px, rgba(255,122,26,.03) 60px 62px),
        #0E1B14
      `,
    }}>
      <div
        className="row-grid row-1-15"
        style={{ gap: 'clamp(28px, 5vw, 60px)', alignItems: 'start' }}
      >
        {/* ═══ Pitch gauche ═══ */}
        <div>
          <div style={{
            display: 'inline-block', background: '#0A0A0A', color: '#D4FF3E',
            padding: '6px 12px',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 11, letterSpacing: '0.12em',
            transform: 'rotate(-2deg)', marginBottom: 18,
          }}>
            ★ Conseil · 24/7
          </div>

          <h2 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(64px,9vw,140px)',
            lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
          }}>
            ÉLODIE,
            <br />
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', fontWeight: 400, textTransform: 'none',
              color: '#FF7A1A',
            }}>
              votre
            </em>
            <br />
            <span style={{
              background: '#0A0A0A', color: '#F5E55E',
              padding: '0 0.08em', display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>
              styliste IA.
            </span>
          </h2>

          <p style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 18, lineHeight: 1.5, marginTop: 22,
            maxWidth: 480, color: '#F4ECD8',
          }}>
            Forme de visage, occasion, budget. Décris ce que tu cherches en français normal. Élodie analyse, recommande, et reste joignable{' '}
            <b style={{ background: '#0A0A0A', color: '#D4FF3E', padding: '0 4px', fontWeight: 400 }}>
              24h/24
            </b>
            . Pas un bot. Une vraie IA bien dressée.
          </p>

          {/* Suggested prompts */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#5E6A64', marginBottom: 10,
            }}>
              // Tu peux lui demander :
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={sending}
                  style={{
                    textAlign: 'left',
                    background: 'transparent',
                    border: '2px dashed #D4FF3E',
                    color: '#F4ECD8',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-caveat),cursive',
                    fontSize: 18,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.4 : 1,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!sending) {
                      e.currentTarget.style.background = '#D4FF3E';
                      e.currentTarget.style.color = '#0A0A0A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#F4ECD8';
                  }}
                >
                  → {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Chat zine droite ═══ */}
        <ChatZine
          messages={messages}
          input={input}
          setInput={setInput}
          sending={sending}
          onSend={() => sendMessage(input)}
          onQuickReply={(reply) => {
            if (reply === 'Lancer l\'essai') {
              window.location.href = '/essayage';
              return;
            }
            sendMessage(reply);
          }}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </section>
  );
}

// ═══ Chat zine widget ═══════════════════════════════

function ChatZine({ messages, input, setInput, sending, onSend, onQuickReply, messagesEndRef }: {
  messages: Message[];
  input: string;
  setInput: (s: string) => void;
  sending: boolean;
  onSend: () => void;
  onQuickReply: (reply: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A',
      padding: 20,
      position: 'relative',
      // Rotation retirée du conteneur input (interférait avec le caret).
      // Effet visuel RIOT préservé via la rotation de la sticker + tape.
      boxShadow: '8px 8px 0 #FF7A1A',
      display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 600, maxHeight: 720,
    }}>
      {/* Tape orange */}
      <span aria-hidden style={{
        position: 'absolute', top: -12, left: '30%',
        width: 120, height: 22, background: 'rgba(255,122,26,.7)',
        borderLeft: '1px dashed rgba(0,0,0,.3)',
        borderRight: '1px dashed rgba(0,0,0,.3)',
        transform: 'rotate(-3deg)',
      }} />

      {/* Sticker ★ En ligne */}
      <div style={{
        position: 'absolute', top: -16, right: 20,
        background: '#D4FF3E', color: '#0A0A0A',
        padding: '6px 12px', borderRadius: 999,
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 14, border: '2px solid #0A0A0A',
        transform: 'rotate(8deg)',
        boxShadow: '2px 3px 0 #0A0A0A',
      }}>
        ★ En ligne
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingBottom: 12, borderBottom: '2px dashed #0A0A0A',
      }}>
        <div aria-hidden style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #f5d4b8 0%, #e8b794 50%, #b8755a 90%)',
          border: '2px solid #0A0A0A',
          flexShrink: 0,
        }} />
        <div>
          <b style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 22, color: '#0A0A0A', display: 'block', lineHeight: 1,
          }}>
            Élodie
          </b>
          <small style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 11, color: '#5E6A64',
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
          }}>
            <span aria-hidden style={{
              width: 8, height: 8, background: '#6cd964',
              borderRadius: '50%', border: '1px solid #0A0A0A',
              display: 'inline-block',
            }} />
            {sending ? 'écrit…' : 'répond en 12s'}
          </small>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
        paddingRight: 4,
      }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onQuickReply={onQuickReply} />
        ))}
        {sending && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 14px',
            fontFamily: 'var(--font-special-elite),monospace', fontSize: 14,
            background: '#F4ECD8', border: '2px solid #0A0A0A',
            color: '#5E6A64',
          }}>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <Dot delay="0s" />
              <Dot delay=".2s" />
              <Dot delay=".4s" />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        style={{
          display: 'flex', gap: 6,
          paddingTop: 12, borderTop: '2px dashed #0A0A0A',
          marginTop: 6,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris à Élodie…"
          aria-label="Message pour Élodie"
          autoComplete="off"
          style={{
            flex: 1, border: '2px solid #0A0A0A',
            padding: '10px 14px', background: '#F4ECD8',
            color: '#0A0A0A',
            fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
            outline: 'none',
            // Force pointer events sur l'input (defensive contre overlays)
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            background: '#0A0A0A', color: '#D4FF3E',
            padding: '10px 16px',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 11, letterSpacing: '0.08em',
            border: '2px solid #0A0A0A',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: (sending || !input.trim()) ? 0.5 : 1,
          }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message, onQuickReply }: {
  message: Message;
  onQuickReply: (reply: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        padding: '10px 14px',
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 14, lineHeight: 1.45,
        maxWidth: '88%',
        border: '2px solid #0A0A0A',
        background: isUser ? '#0A0A0A' : '#F4ECD8',
        color: isUser ? '#D4FF3E' : '#0A0A0A',
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>

      {/* Pill de recommandation produit (uniquement messages bot) */}
      {!isUser && message.recommended && (
        <Link
          href={`/perruque/${message.recommended.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#0A0A0A', color: '#F4ECD8',
            padding: '8px 12px',
            border: '2px solid #0A0A0A',
            boxShadow: '3px 3px 0 #D4FF3E',
            transform: 'rotate(-1deg)',
            textDecoration: 'none', cursor: 'pointer',
            transition: 'transform .12s, box-shadow .12s',
            maxWidth: '88%',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.recommended.img}
            alt={message.recommended.name}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '2px solid #F4ECD8', objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{
              fontFamily: 'var(--font-permanent-marker),cursive',
              fontSize: 15, lineHeight: 1,
            }}>
              {message.recommended.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 11, color: '#D4FF3E', marginTop: 4,
            }}>
              {message.recommended.price}€ · {message.recommended.swatches.length} coloris
            </div>
          </div>
        </Link>
      )}

      {/* Quick replies (uniquement après messages bot + reco) */}
      {!isUser && message.recommended && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => {
                if (qr === 'Voir la fiche') {
                  window.location.href = `/perruque/${message.recommended!.id}`;
                  return;
                }
                onQuickReply(qr);
              }}
              style={qrButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FF7A1A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0A0A0A'; }}
            >
              {qr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const qrButtonStyle: CSSProperties = {
  background: '#0A0A0A',
  color: '#F4ECD8',
  padding: '6px 12px',
  fontFamily: 'var(--font-special-elite),monospace',
  fontSize: 11, letterSpacing: '0.04em',
  border: '2px solid #0A0A0A',
  cursor: 'pointer',
  transition: 'background .12s',
};

function Dot({ delay }: { delay: string }) {
  return (
    <span aria-hidden style={{
      display: 'inline-block',
      width: 6, height: 6, borderRadius: '50%',
      background: '#0A0A0A',
      animation: 'pulse 1s infinite',
      animationDelay: delay,
    }} />
  );
}
