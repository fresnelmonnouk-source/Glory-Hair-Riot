'use client';

import { Orb } from '@/components/shared/Orb';
import type { CartItem, Route } from '@/types/app';

interface CartScreenProps {
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  setRoute: (r: Route) => void;
}

export function CartScreen({ cartItems, setCartItems, setRoute }: CartScreenProps) {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 150 ? 0 : 9.9;
  const total = subtotal + shipping;

  const updateQty = (id: string, delta: number) => {
    setCartItems(
      cartItems
        .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (id: string) => setCartItems(cartItems.filter((i) => i.id !== id));

  if (cartItems.length === 0) {
    return (
      <section className="section" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mute)" strokeWidth="1.4">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 36, marginBottom: 10 }}>
            Votre panier est <span className="italic" style={{ color: 'var(--gold-deep)' }}>vide.</span>
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>Explorez notre catalogue et trouvez votre couronne.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setRoute('catalog')}>
          Découvrir le catalogue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-6-7 7 7-7 7" />
          </svg>
        </button>
      </section>
    );
  }

  return (
    <section className="section">
      <div style={{ marginBottom: 40 }}>
        <div className="section-eyebrow">Votre panier</div>
        <h2 style={{ fontSize: 'clamp(36px,4vw,56px)', letterSpacing: '-.02em' }}>
          {cartItems.length} article{cartItems.length > 1 ? 's' : ''}{' '}
          <span className="italic" style={{ color: 'var(--gold-deep)' }}>sélectionné{cartItems.length > 1 ? 's' : ''}</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cartItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: 20, padding: 20, background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-soft)', alignItems: 'center' }}>
              <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 16, background: 'var(--bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '80%' }}>
                  <Orb color={item.color} shape={item.shape} showShadow={false} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-warm)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>{item.cat}</span>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '-.01em' }}>{item.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 3 }}>{item.style} · Taille M</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink-soft)' }}>−</button>
                <span style={{ width: 24, textAlign: 'center', fontWeight: 500 }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ink-soft)' }}>+</button>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 22 }}>{item.price * item.qty} €</div>
                {item.qty > 1 && <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{item.price} € × {item.qty}</div>}
              </div>

              <button onClick={() => remove(item.id)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div style={{ position: 'sticky', top: 100, background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: 32, border: '1px solid var(--line-soft)', boxShadow: 'var(--sh-2)' }}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 26, marginBottom: 24 }}>Récapitulatif</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Sous-total</span><span>{subtotal} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Livraison</span>
              <span style={{ color: shipping === 0 ? '#3a7a32' : 'var(--ink)' }}>{shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)} €`}</span>
            </div>
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 500 }}>Total</span>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 26 }}>{total.toFixed(2)} €</span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '18px' }} onClick={() => setRoute('checkout')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Passer la commande · {total.toFixed(2)} €
          </button>
        </div>
      </div>
    </section>
  );
}
