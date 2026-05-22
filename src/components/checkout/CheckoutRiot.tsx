'use client';

/**
 * Page Checkout RIOT — 3 étapes (Adresse → Livraison → Paiement).
 *
 * Riot.html n'a pas de section .checkout (le flow est implicite après .cart).
 * Design propre dans le langage RIOT : paper cards rotatives, stepper inclinés,
 * boutons .btn-bold, résumé sticky.
 *
 * État local (useState) pour les 3 étapes. Pas de back-end branché (stub).
 * TODO Phase 5 : POST Stripe Checkout Session + redirection PaymentIntent.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { WIG_BY_ID } from '@/lib/wigs-data';

const TVA_RATE = 0.20;

type Step = 1 | 2 | 3;
type ShippingMode = 'standard' | 'express' | 'atelier';
type PaymentMode = 'stripe' | 'fedapay';

interface Address {
  email: string;
  prenom: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  telephone: string;
}

const SHIPPING_OPTIONS: { id: ShippingMode; label: string; eta: string; price: number; note?: string }[] = [
  { id: 'standard', label: 'Standard',       eta: '48h',   price: 0,    note: 'France métropolitaine' },
  { id: 'express',  label: 'Express',        eta: '24h',   price: 9.99, note: 'Avant 13h, livré le lendemain' },
  { id: 'atelier',  label: 'Atelier Paris 9', eta: '— sur RDV', price: 0,    note: 'Retrait + pose offerte (Glory Club Gold)' },
];

const PAYMENT_OPTIONS: { id: PaymentMode; label: string; sub: string; badge: string }[] = [
  { id: 'stripe',  label: 'Carte bancaire', sub: 'Visa · Mastercard · CB · Amex',     badge: 'EUR · 🔒 Stripe' },
  { id: 'fedapay', label: 'Mobile Money',   sub: 'MTN · Moov · Wave (Afrique de l\'Ouest)', badge: 'XOF / EUR · FedaPay' },
];

export function CheckoutRiot() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());

  const [step, setStep] = useState<Step>(1);
  const [address, setAddress] = useState<Address>({
    email: '', prenom: '', nom: '', adresse: '', ville: '', codePostal: '', pays: 'France', telephone: '',
  });
  const [shipping, setShipping] = useState<ShippingMode>('standard');
  const [payment, setPayment] = useState<PaymentMode>('stripe');
  const [paying, setPaying] = useState(false);

  // Redirection si cart vide (uniquement côté client, après hydration)
  useEffect(() => {
    if (items.length === 0) router.replace('/panier');
  }, [items.length, router]);

  const shippingPrice = SHIPPING_OPTIONS.find(s => s.id === shipping)?.price ?? 0;
  const total = subtotal + shippingPrice;
  const tva = Math.round((total * TVA_RATE / (1 + TVA_RATE)) * 100) / 100;
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

  // Validation étape 1
  const addressValid = useMemo(() => {
    return Boolean(
      address.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) &&
      address.prenom.trim() && address.nom.trim() &&
      address.adresse.trim() && address.ville.trim() &&
      address.codePostal.trim() && address.pays.trim()
    );
  }, [address]);

  const [payError, setPayError] = useState<string | null>(null);

  async function goPay() {
    setPaying(true);
    setPayError(null);
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            wig_slug: i.wig_id,                    // côté client wig_id = slug
            variant_id: null,                       // pas encore branché aux wig_variants
            quantity: i.quantity,
            price_at_added: i.price_at_added,      // €
          })),
          address,
          shipping,
          payment_method: payment,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
        if (r.status === 401) {
          // Pas logged → redirige connexion avec retour sur checkout
          router.push('/connexion?redirect=/checkout');
          return;
        }
        setPayError(json.userMessage ?? 'Erreur. Réessaie.');
        setPaying(false);
        return;
      }
      router.push(`/merci?ref=${json.ref}`);
    } catch {
      setPayError('Connexion impossible. Vérifie ton réseau.');
      setPaying(false);
    }
  }

  if (items.length === 0) {
    return (
      <section style={{ padding: 'clamp(60px, 12vw, 120px) clamp(16px, 4vw, 32px)', textAlign: 'center', minHeight: '60vh' }}>
        <p style={{
          fontFamily: 'var(--font-vt323),monospace',
          fontSize: 22, color: '#F4ECD8', opacity: 0.6,
        }}>
          Redirection vers ton sac…
        </p>
      </section>
    );
  }

  return (
    <section className="container-pad" style={{
      padding: 'clamp(36px, 6vw, 60px) clamp(16px, 4vw, 32px) clamp(60px, 10vw, 96px)',
      borderBottom: '3px solid #D4FF3E',
    }}>
      {/* Head */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: '3px dashed #D4FF3E', paddingBottom: 28, marginBottom: 32,
        flexWrap: 'wrap', gap: 18,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(64px,8vw,120px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          CHECK
          <br />
          <span style={{
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '0 0.08em', display: 'inline-block',
            transform: 'rotate(-1deg)',
          }}>
            OUT.
          </span>
        </h2>
        <Link href="/panier" style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 13, color: '#D4FF3E', textDecoration: 'none',
          letterSpacing: '0.06em',
        }}>
          ← Modifier mon sac
        </Link>
      </div>

      {/* Stepper */}
      <Stepper step={step} setStep={setStep} addressValid={addressValid} />

      {/* Grid : form (gauche) + récap (droite) */}
      <div
        className="row-grid row-15-1"
        style={{ gap: 'clamp(24px, 3vw, 40px)', alignItems: 'start', marginTop: 40 }}
      >
        <div>
          {step === 1 && (
            <StepAddress
              address={address}
              setAddress={setAddress}
              valid={addressValid}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepShipping
              shipping={shipping}
              setShipping={setShipping}
              onPrev={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepPayment
              payment={payment}
              setPayment={setPayment}
              total={total}
              paying={paying}
              onPrev={() => setStep(2)}
              onPay={goPay}
              error={payError}
            />
          )}
        </div>

        <Summary
          totalQty={totalQty}
          subtotal={subtotal}
          shippingLabel={SHIPPING_OPTIONS.find(s => s.id === shipping)!.label}
          shippingPrice={shippingPrice}
          tva={tva}
          total={total}
          itemNames={items.map((i) => {
            const wig = WIG_BY_ID[i.wig_id];
            return `${wig?.name ?? i.name ?? 'Item'} × ${i.quantity}`;
          })}
        />
      </div>
    </section>
  );
}

// ═══ Stepper ════════════════════════════════════════

function Stepper({ step, setStep, addressValid }: {
  step: Step; setStep: (s: Step) => void; addressValid: boolean;
}) {
  const STEPS: { id: Step; label: string }[] = [
    { id: 1, label: 'ADRESSE' },
    { id: 2, label: 'LIVRAISON' },
    { id: 3, label: 'PAIEMENT' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
      {STEPS.map((s, i) => {
        const isCurrent = s.id === step;
        const isDone = s.id < step;
        const isFuture = s.id > step;
        const canClick = !isFuture || (s.id === 2 && addressValid) || (s.id === 3 && addressValid && step >= 2);
        const bg = isCurrent ? '#D4FF3E' : isDone ? '#FF7A1A' : 'transparent';
        const color = isCurrent || isDone ? '#0A0A0A' : '#F4ECD8';
        const border = isFuture ? '3px solid #F4ECD8' : '3px solid #0A0A0A';
        const rotate = isCurrent ? 'rotate(-1deg)' : 'rotate(0deg)';

        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && setStep(s.id)}
              style={{
                background: bg, color, border,
                padding: '10px 18px',
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: canClick ? 'pointer' : 'not-allowed',
                transform: rotate,
                boxShadow: isCurrent ? '4px 4px 0 #FF7A1A' : 'none',
              }}
            >
              {isDone ? '✓' : `0${s.id}`} {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span aria-hidden style={{
                width: 30, height: 3,
                background: isDone ? '#FF7A1A' : '#5E6A64',
                opacity: isDone ? 1 : 0.4,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══ Step 1 — Adresse ════════════════════════════════

function StepAddress({ address, setAddress, valid, onNext }: {
  address: Address; setAddress: (a: Address) => void; valid: boolean; onNext: () => void;
}) {
  function set<K extends keyof Address>(key: K, value: Address[K]) {
    setAddress({ ...address, [key]: value });
  }
  return (
    <FormCard title="Adresse de livraison" rotate="-0.5deg" shadow="#D4FF3E">
      <form onSubmit={(e) => { e.preventDefault(); if (valid) onNext(); }}>
        <Field label="Email" required>
          <input type="email" required value={address.email} onChange={(e) => set('email', e.target.value)}
            placeholder="ton@adresse.email" style={inputStyle} autoComplete="email" />
        </Field>
        <Row>
          <Field label="Prénom" required>
            <input type="text" required value={address.prenom} onChange={(e) => set('prenom', e.target.value)}
              style={inputStyle} autoComplete="given-name" />
          </Field>
          <Field label="Nom" required>
            <input type="text" required value={address.nom} onChange={(e) => set('nom', e.target.value)}
              style={inputStyle} autoComplete="family-name" />
          </Field>
        </Row>
        <Field label="Adresse" required>
          <input type="text" required value={address.adresse} onChange={(e) => set('adresse', e.target.value)}
            placeholder="N° et rue" style={inputStyle} autoComplete="street-address" />
        </Field>
        <Row>
          <Field label="Code postal" required>
            <input type="text" required value={address.codePostal} onChange={(e) => set('codePostal', e.target.value)}
              style={inputStyle} autoComplete="postal-code" />
          </Field>
          <Field label="Ville" required>
            <input type="text" required value={address.ville} onChange={(e) => set('ville', e.target.value)}
              style={inputStyle} autoComplete="address-level2" />
          </Field>
        </Row>
        <Row>
          <Field label="Pays" required>
            <select value={address.pays} onChange={(e) => set('pays', e.target.value)} style={inputStyle}>
              {['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'Togo', 'Maroc'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Téléphone">
            <input type="tel" value={address.telephone} onChange={(e) => set('telephone', e.target.value)}
              placeholder="+33 6 12 34 56 78" style={inputStyle} autoComplete="tel" />
          </Field>
        </Row>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={!valid} className="btn-bold orange"
            style={!valid ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
            → ÉTAPE 02 · LIVRAISON
          </button>
        </div>
      </form>
    </FormCard>
  );
}

// ═══ Step 2 — Livraison ══════════════════════════════

function StepShipping({ shipping, setShipping, onPrev, onNext }: {
  shipping: ShippingMode; setShipping: (s: ShippingMode) => void;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <FormCard title="Mode de livraison" rotate="0.5deg" shadow="#FF7A1A">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SHIPPING_OPTIONS.map((opt) => {
          const active = shipping === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setShipping(opt.id)}
              aria-pressed={active}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center',
                padding: 16, cursor: 'pointer', textAlign: 'left',
                background: active ? '#0E1B14' : '#F4ECD8',
                color: active ? '#F4ECD8' : '#0A0A0A',
                border: '3px solid #0A0A0A',
                boxShadow: active ? '4px 4px 0 #D4FF3E' : 'none',
                transform: active ? 'rotate(-0.5deg)' : 'rotate(0deg)',
                transition: 'all .15s',
              }}
            >
              <span aria-hidden style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '3px solid ' + (active ? '#D4FF3E' : '#0A0A0A'),
                background: active ? '#D4FF3E' : 'transparent',
                position: 'relative',
              }}>
                {active && <span style={{
                  position: 'absolute', inset: 3, background: '#0A0A0A', borderRadius: '50%',
                }} />}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-permanent-marker),cursive',
                  fontSize: 22, lineHeight: 1.1,
                }}>
                  {opt.label} <em style={{
                    fontFamily: 'var(--font-yeseva-one),serif',
                    fontStyle: 'italic', color: active ? '#D4FF3E' : '#FF7A1A',
                  }}>{opt.eta}</em>
                </div>
                {opt.note && (
                  <div style={{
                    fontFamily: 'var(--font-special-elite),monospace',
                    fontSize: 12, opacity: 0.7, marginTop: 4,
                  }}>
                    {opt.note}
                  </div>
                )}
              </div>
              <div style={{
                background: opt.price === 0 ? '#D4FF3E' : '#FF7A1A',
                color: '#0A0A0A', padding: '6px 12px',
                fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 14,
                transform: 'rotate(-2deg)', display: 'inline-block',
              }}>
                {opt.price === 0 ? '★ GRATUITE' : `+${opt.price.toFixed(2).replace('.', ',')}€`}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={onPrev} className="btn-bold outline">← Retour</button>
        <button type="button" onClick={onNext} className="btn-bold orange">→ ÉTAPE 03 · PAIEMENT</button>
      </div>
    </FormCard>
  );
}

// ═══ Step 3 — Paiement ═══════════════════════════════

function StepPayment({ payment, setPayment, total, paying, onPrev, onPay, error }: {
  payment: PaymentMode; setPayment: (p: PaymentMode) => void;
  total: number; paying: boolean;
  onPrev: () => void; onPay: () => void;
  error?: string | null;
}) {
  return (
    <FormCard title="Mode de paiement" rotate="-0.3deg" shadow="#FF4D8D">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PAYMENT_OPTIONS.map((opt) => {
          const active = payment === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPayment(opt.id)}
              aria-pressed={active}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center',
                padding: 16, cursor: 'pointer', textAlign: 'left',
                background: active ? '#0E1B14' : '#F4ECD8',
                color: active ? '#F4ECD8' : '#0A0A0A',
                border: '3px solid #0A0A0A',
                boxShadow: active ? '4px 4px 0 #D4FF3E' : 'none',
                transform: active ? 'rotate(-0.5deg)' : 'rotate(0deg)',
                transition: 'all .15s',
              }}
            >
              <span aria-hidden style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '3px solid ' + (active ? '#D4FF3E' : '#0A0A0A'),
                background: active ? '#D4FF3E' : 'transparent',
                position: 'relative',
              }}>
                {active && <span style={{
                  position: 'absolute', inset: 3, background: '#0A0A0A', borderRadius: '50%',
                }} />}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-permanent-marker),cursive',
                  fontSize: 22, lineHeight: 1.1,
                }}>
                  {opt.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-special-elite),monospace',
                  fontSize: 12, opacity: 0.7, marginTop: 4,
                }}>
                  {opt.sub}
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 10, letterSpacing: '0.1em',
                padding: '4px 8px', border: '2px solid currentColor',
                opacity: 0.8,
              }}>
                {opt.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info legal */}
      <div style={{
        marginTop: 16,
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 11, color: '#5E6A64', lineHeight: 1.4,
      }}>
        ★ Mode MVP : paiement Stripe pas encore branché. La commande est créée
        en base sans transaction réelle. (Phase 5.5 : intégration Stripe Checkout.)
      </div>

      {error && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: '#0A0A0A', color: '#FF4D8D',
          border: '2px solid #FF4D8D',
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 13, lineHeight: 1.4,
        }}>
          ★ {error}
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={onPrev} className="btn-bold outline" disabled={paying}>← Retour</button>
        <button type="button" onClick={onPay} className="btn-bold orange" disabled={paying}
          style={paying ? { opacity: 0.6, cursor: 'wait' } : undefined}>
          {paying ? '⏳ Traitement…' : `→ CONFIRMER ${total.toFixed(2).replace('.', ',')}€`}
        </button>
      </div>
    </FormCard>
  );
}

// ═══ Summary récap ═══════════════════════════════════

function Summary({ totalQty, subtotal, shippingLabel, shippingPrice, tva, total, itemNames }: {
  totalQty: number;
  subtotal: number;
  shippingLabel: string;
  shippingPrice: number;
  tva: number;
  total: number;
  itemNames: string[];
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A', padding: 24,
      transform: 'rotate(0.8deg)',
      boxShadow: '6px 6px 0 #FF7A1A',
      position: 'sticky', top: 120,
    }}>
      <h3 style={{
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 26, color: '#0A0A0A', marginBottom: 14,
        position: 'relative',
      }}>
        Ton sac.
        <span aria-hidden style={{
          display: 'block', width: '50%', height: 4,
          background: '#0A0A0A', marginTop: 6, transform: 'rotate(-1deg)',
        }} />
      </h3>

      {/* Items list (compact) */}
      <ul style={{
        listStyle: 'none', margin: 0, padding: 0,
        fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
        marginBottom: 16, borderBottom: '2px dashed #0A0A0A', paddingBottom: 14,
      }}>
        {itemNames.map((n, i) => (
          <li key={i} style={{ padding: '4px 0' }}>
            <span style={{ color: '#FF7A1A', marginRight: 6 }}>★</span>{n}
          </li>
        ))}
        <li style={{
          marginTop: 6, fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 11, letterSpacing: '0.08em', color: '#5E6A64',
        }}>
          {totalQty} PIÈCE{totalQty > 1 ? 'S' : ''}
        </li>
      </ul>

      <SumRow label="Sous-total" value={`${subtotal.toFixed(2).replace('.', ',')} €`} />
      <SumRow
        label={`Livraison · ${shippingLabel}`}
        valueComponent={
          shippingPrice === 0
            ? <span style={{
                background: '#D4FF3E', color: '#0A0A0A',
                padding: '2px 8px',
                fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11,
              }}>★ GRATUITE</span>
            : <span>+{shippingPrice.toFixed(2).replace('.', ',')} €</span>
        }
      />
      <SumRow label="TVA incluse" value={`${tva.toFixed(2).replace('.', ',')} €`} />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '3px dashed #0A0A0A', marginTop: 8, paddingTop: 14,
        fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 22,
      }}>
        <span>TOTAL</span>
        <span style={{
          background: '#FF7A1A', color: '#0A0A0A',
          padding: '4px 10px', transform: 'rotate(-2deg)', display: 'inline-block',
        }}>
          {total.toFixed(2).replace('.', ',')}€
        </span>
      </div>

      <div style={{
        marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6,
      }}>
        {['★ SSL 256', '3D Secure', 'PCI-DSS L1'].map((s) => (
          <span key={s} style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 8px', border: '2px dashed #0A0A0A',
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══ Form primitives ═════════════════════════════════

function FormCard({ title, rotate, shadow, children }: {
  title: string; rotate: string; shadow: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A', padding: 28,
      transform: `rotate(${rotate})`,
      boxShadow: `6px 6px 0 ${shadow}`,
      position: 'relative',
    }}>
      <span aria-hidden style={{
        position: 'absolute', top: -14, left: 30,
        width: 120, height: 24,
        background: 'rgba(212,255,62,.7)',
        borderLeft: '1px dashed rgba(0,0,0,.3)',
        borderRight: '1px dashed rgba(0,0,0,.3)',
        transform: 'rotate(-3deg)',
      }} />
      <h3 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 32, lineHeight: 0.9, textTransform: 'uppercase',
        marginBottom: 20, color: '#0A0A0A',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#0A0A0A', display: 'block', marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#FF7A1A' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="row-grid row-2" style={{ gap: 12 }}>
      {children}
    </div>
  );
}

function SumRow({ label, value, valueComponent }: {
  label: string; value?: string; valueComponent?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
    }}>
      <span>{label}</span>
      <span>{valueComponent ?? value}</span>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  border: '2px solid #0A0A0A',
  background: '#F4ECD8',
  color: '#0A0A0A',
  padding: '10px 14px',
  fontFamily: 'var(--font-special-elite),monospace',
  fontSize: 14,
  outline: 'none',
};
