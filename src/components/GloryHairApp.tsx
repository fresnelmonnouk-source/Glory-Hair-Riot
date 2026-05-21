'use client';

import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { WigCard } from './shared/WigCard';
import { WIGS } from '@/lib/wigs-data';
import type { Route, CartItem } from '@/types/app';

import { Navbar } from './layout/Navbar';
import { HomeScreen } from './home/HomeScreen';
import { CatalogScreen } from './catalogue/CatalogScreen';
import { ProductScreen } from './produit/ProductScreen';
import { CartScreen } from './panier/CartScreen';
import { JournalPage } from './journal/JournalPage';

export function GloryHairApp() {
  const [route, setRoute] = useState<Route>('home');
  const [selectedWig, setSelectedWig] = useState(WIGS[0]!);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [showTryOn, setShowTryOn] = useState(false);
  const [elodieChatOpen, setElodieChatOpen] = useState(false);

  const goProduct = (wig: typeof WIGS[0]) => {
    setSelectedWig(wig);
    setRoute('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, item];
    });
  };

  const toggleWishlist = (id: string) => {
    setWishlistIds((ids) => ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]);
  };

  return (
    <>
      <Navbar
        route={route}
        setRoute={setRoute}
        wishlistCount={wishlistIds.length}
        cartCount={cartItems.length}
        isLoggedIn={false}
        onElodieToggle={() => setElodieChatOpen((o) => !o)}
      />

      {route === 'home' && (
        <HomeScreen setRoute={setRoute} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onGoProduct={goProduct} onOpenChat={() => setElodieChatOpen(true)} />
      )}
      {route === 'catalog' && (
        <CatalogScreen setRoute={setRoute} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} onGoProduct={goProduct} />
      )}
      {route === 'product' && (
        <ProductScreen wig={selectedWig} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlisted={wishlistIds.includes(selectedWig.id)} />
      )}
      {route === 'cart' && (
        <CartScreen cartItems={cartItems} setCartItems={setCartItems} setRoute={setRoute} />
      )}
      {route === 'journal' && <JournalPage />}
      {route === 'wishlist' && <WishlistScreen wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} goProduct={goProduct} setRoute={setRoute} />}
      {route === 'checkout' && <CheckoutScreen cartItems={cartItems} />}
      {route === 'account' && <AccountScreen />}

      {route === 'tryon' && (
        <TryOnPage
          wishlistIds={wishlistIds}
          toggleWishlist={toggleWishlist}
          goProduct={goProduct}
          onSelectWig={(w) => { setSelectedWig(w); setShowTryOn(true); }}
        />
      )}

      {showTryOn && (
        <TryOnModal wig={selectedWig} onClose={() => setShowTryOn(false)} onAddToCart={addToCart} />
      )}

      {elodieChatOpen && <ElodiePanel onClose={() => setElodieChatOpen(false)} />}
    </>
  );
}

// ─── Écrans secondaires inlinés (à extraire progressivement) ─────────────────

function WishlistScreen({ wishlistIds, toggleWishlist, goProduct, setRoute }: {
  wishlistIds: string[];
  toggleWishlist: (id: string) => void;
  goProduct: (w: typeof WIGS[0]) => void;
  setRoute: (r: Route) => void;
}) {
  const items = WIGS.filter((w) => wishlistIds.includes(w.id));
  if (items.length === 0) {
    return (
      <section className="section" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mute)" strokeWidth="1.4">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 36 }}>Aucun <span className="italic" style={{ color: 'var(--gold-deep)' }}>favori</span></h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>Cliquez sur le ♡ d'une perruque pour la retrouver ici.</p>
        <button className="btn btn-primary" onClick={() => setRoute('catalog')}>Explorer le catalogue</button>
      </section>
    );
  }
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Mes favoris</div>
          <h2>{items.length} <span className="italic" style={{ color: 'var(--gold-deep)' }}>favori{items.length > 1 ? 's' : ''}</span></h2>
        </div>
      </div>
      <div className="wig-grid">
        {items.map((w) => (
          <WigCard key={w.id} wig={w} onClick={() => goProduct(w)} wishlisted onToggleWishlist={toggleWishlist} />
        ))}
      </div>
    </section>
  );
}

function CheckoutScreen({ cartItems }: { cartItems: CartItem[] }) {
  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState<'stripe' | 'fedapay'>('stripe');
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 150 ? 0 : 9.9;
  const total = subtotal + shipping;

  return (
    <section className="section">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 40 }}>
          Finaliser votre <span className="italic" style={{ color: 'var(--gold-deep)' }}>commande</span>
        </h2>
        <div style={{ display: 'flex', marginBottom: 40, borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} onClick={() => setStep(s)} style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', background: step >= s ? 'var(--gold-light)' : 'var(--bg-warm)', color: step >= s ? 'white' : 'var(--ink-soft)', fontWeight: step === s ? 600 : 400 }}>
              {s === 1 ? 'Adresse' : s === 2 ? 'Livraison' : 'Paiement'}
            </div>
          ))}
        </div>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <input type="text" placeholder="Rue et numéro" style={{ padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', fontFamily: 'var(--f-body)', fontSize: 14 }} />
            <input type="text" placeholder="Code postal et ville" style={{ padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', fontFamily: 'var(--f-body)', fontSize: 14 }} />
            <input type="text" placeholder="Pays" style={{ padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', fontFamily: 'var(--f-body)', fontSize: 14 }} />
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continuer vers la livraison →</button>
          </div>
        )}
        {step === 2 && (
          <div style={{ maxWidth: 600 }}>
            {[{ id: 'standard', label: 'Standard', desc: '3-5 jours', price: 9.9 }, { id: 'express', label: 'Express', desc: '1-2 jours', price: 19.9 }].map((opt) => (
              <label key={opt.id} style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <input type="radio" name="shipping" style={{ accentColor: 'var(--gold)' }} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{opt.label}</div><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{opt.desc}</div></div>
                <div style={{ fontWeight: 600 }}>+{opt.price}€</div>
              </label>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setStep(3)}>Continuer vers le paiement →</button>
          </div>
        )}
        {step === 3 && (
          <div style={{ maxWidth: 600 }}>
            {(['stripe', 'fedapay'] as const).map((m) => (
              <label key={m} onClick={() => setPayMethod(m)} style={{ padding: '16px', border: `${payMethod === m ? '2px solid var(--gold)' : '1px solid var(--line)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, background: payMethod === m ? 'rgba(184,135,70,.05)' : 'transparent' }}>
                <input type="radio" checked={payMethod === m} onChange={() => setPayMethod(m)} style={{ accentColor: 'var(--gold)' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{m === 'stripe' ? 'Carte bancaire (Stripe)' : 'FedaPay (Mobile Money)'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{m === 'stripe' ? 'Visa, Mastercard, Amex' : 'Orange Money, Moov, MTN…'}</div>
                </div>
              </label>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: 8 }}>
              Payer {total.toFixed(2)} € avec {payMethod === 'stripe' ? 'Stripe' : 'FedaPay'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function AccountScreen() {
  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>👤</div>
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32 }}>
        Gérez votre <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>compte</span>
      </h2>
      <p style={{ color: 'var(--ink-soft)', maxWidth: 400 }}>
        Accédez à votre espace client pour gérer vos commandes, essayages et profil.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/compte" className="btn btn-primary">Mon espace client</a>
        <a href="/connexion" className="btn btn-ghost">Se connecter</a>
      </div>
    </section>
  );
}


function TryOnPage({ wishlistIds, toggleWishlist, goProduct, onSelectWig }: {
  wishlistIds: string[];
  toggleWishlist: (id: string) => void;
  goProduct: (w: typeof WIGS[0]) => void;
  onSelectWig: (w: typeof WIGS[0]) => void;
}) {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 40px 120px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(48px, 6vw, 88px)', lineHeight: .97, letterSpacing: '-.025em', marginBottom: 24 }}>
          Essayez avant<br />
          <span className="italic" style={{ color: 'var(--gold-deep)' }}>d'acheter.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-soft)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
          Choisissez une perruque ci-dessous et lancez l'essayage. Basic instantané et gratuit.
        </p>
      </div>
      <div className="section-head" style={{ marginBottom: 32 }}>
        <div>
          <div className="section-eyebrow">Toute la collection · {WIGS.length} perruques</div>
          <h2>Choisissez votre <span className="italic" style={{ color: 'var(--gold-deep)' }}>couronne</span></h2>
        </div>
      </div>
      <div className="wig-grid">
        {WIGS.map((w) => (
          <div key={w.id} style={{ position: 'relative' }}>
            <WigCard wig={w} onClick={() => goProduct(w)} wishlisted={wishlistIds.includes(w.id)} onToggleWishlist={toggleWishlist} />
            <button
              onClick={() => onSelectWig(w)}
              style={{ position: 'absolute', bottom: 20, left: 16, right: 16, padding: '11px 0', background: 'var(--ink)', color: 'var(--bg-warm)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: 0, transition: 'opacity .2s', zIndex: 5 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
            >
              Essayer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TryOnModal({ wig, onClose, onAddToCart }: {
  wig: typeof WIGS[0];
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const [step, setStep] = useState<'mode' | 'result'>('mode');
  const [tryColor, setTryColor] = useState(wig.swatches[0] ?? 'var(--hair-1)');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="try-canvas">
          {step === 'mode' && (
            <div className="tryon-step" style={{ gap: 24, textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 34, color: 'white' }}>
                Essayage virtuel<br />
                <span style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>{wig.name}</span>
              </h3>
              <button className="btn btn-primary" onClick={() => setStep('result')}>
                Lancer l'essayage Basic
              </button>
            </div>
          )}
          {step === 'result' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 48 }}>
              <div style={{ position: 'relative', width: '68%', aspectRatio: '3/4' }}>
                <div className="try-face" />
                <div className="try-wig wavy" style={{ background: `radial-gradient(ellipse at 50% 30%, color-mix(in srgb, ${tryColor} 100%, white 25%) 0%, ${tryColor} 50%, color-mix(in srgb, ${tryColor} 100%, black 30%) 100%)` }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={() => {
                  onAddToCart({ id: wig.id, name: wig.name, cat: wig.cat, style: wig.style, price: wig.price, color: tryColor, shape: wig.shape, qty: 1 });
                  onClose();
                }}>
                  Ajouter au panier
                </button>
                <button className="btn btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,.2)' }} onClick={onClose}>Fermer</button>
              </div>
            </div>
          )}
        </div>
        <div className="try-side">
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}>Essayage virtuel</div>
            <h3 style={{ marginTop: 6 }}>{wig.name}</h3>
            <div className="sub">{wig.cat} · {wig.price} €</div>
          </div>
          {step === 'result' && (
            <div className="color-row">
              {wig.swatches.map((c) => (
                <div key={c} className={`color-chip ${tryColor === c ? 'active' : ''}`} style={{ background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${c} 100%, white 30%) 0%, ${c} 60%, color-mix(in srgb, ${c} 100%, black 30%) 100%)` }} onClick={() => setTryColor(c)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ElodiePanel({ onClose }: { onClose: () => void }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startConv = trpc.elodie.startConversation.useMutation();
  const sendMsg = trpc.elodie.sendMessage.useMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    try {
      // Démarre la conversation au premier message si pas encore initiée
      let convId = conversationId;
      if (!convId) {
        const conv = await startConv.mutateAsync(undefined);
        convId = conv.id;
        setConversationId(convId);
      }
      const res = await sendMsg.mutateAsync({ conversationId: convId as string, content: text });
      setMessages((prev) => [...prev, { id: res.id, role: 'assistant', content: res.content }]);
    } catch {
      setMessages((prev) => [...prev, { id: 'err-' + Date.now(), role: 'assistant', content: 'Une erreur est survenue. Réessayez.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="elodie-panel">
      <div className="elodie-head">
        <div className="elodie-avatar" />
        <div>
          <strong>Élodie</strong>
          <small>Styliste IA · répond en moyenne en 2s</small>
        </div>
        <button className="elodie-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="elodie-messages">
        <div className="msg bot">
          Bonjour, je suis <strong>Élodie</strong> ✨<br />
          Votre styliste personnelle Glory Hair. Comment puis-je vous accompagner aujourd'hui ?
        </div>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
            {m.content}
          </div>
        ))}
        {isLoading && (
          <div className="typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="elodie-input" onSubmit={handleSend}>
        <input
          placeholder="Écrivez à Élodie…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button className="elodie-send" type="submit" disabled={isLoading || !input.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
