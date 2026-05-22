'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useCartStore } from '@/stores/cart.store';

export default function MerciPage() {
  return (
    <Suspense fallback={null}>
      <MerciContent />
    </Suspense>
  );
}

function MerciContent() {
  const params = useSearchParams();
  const ref = params?.get('ref') ?? 'GH-XXXX';
  const clear = useCartStore((s) => s.clear);

  // Vider le panier après confirmation (stub — Phase 5 : confirmer via webhook avant)
  useEffect(() => { clear(); }, [clear]);

  return (
    <section style={{
      padding: '120px 32px',
      minHeight: '70vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', gap: 28,
    }}>
      <div style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14, letterSpacing: '0.12em',
        color: '#D4FF3E', border: '3px solid #D4FF3E',
        padding: '8px 16px', transform: 'rotate(-3deg)',
      }}>
        ★ COMMANDE CONFIRMÉE
      </div>

      <h1 style={{
        fontFamily: 'var(--font-anton),Impact,sans-serif',
        fontSize: 'clamp(72px,9vw,140px)',
        lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
      }}>
        Merci{' '}
        <em style={{
          fontFamily: 'var(--font-yeseva-one),serif',
          fontStyle: 'italic', color: '#FF7A1A',
        }}>
          beauté.
        </em>
      </h1>

      <p style={{
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 17, lineHeight: 1.5, color: '#F4ECD8',
        maxWidth: 520,
      }}>
        Ta commande{' '}
        <b style={{
          background: '#D4FF3E', color: '#0A0A0A',
          padding: '2px 8px', fontWeight: 400,
          fontFamily: 'var(--font-rubik-mono-one),monospace',
        }}>#{ref}</b>{' '}
        est partie en atelier. Tu vas recevoir un mail de confirmation dans quelques minutes.
        Livraison sous 48h en France métropolitaine.
      </p>

      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        border: '3px solid #0A0A0A', padding: 24,
        transform: 'rotate(-1deg)',
        boxShadow: '6px 6px 0 #D4FF3E',
        maxWidth: 480,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 24, marginBottom: 12,
        }}>
          ★ Bonus Glory Club
        </h3>
        <p style={{
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 14, lineHeight: 1.5,
        }}>
          Tu viens de débloquer <b style={{ background: '#FF7A1A', color: '#0A0A0A', padding: '0 4px' }}>+50 points</b>{' '}
          + tes <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px' }}>2 essais Premium</b>{' '}
          dès la création de ton compte.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/connexion" className="btn-bold">→ Activer mon compte</Link>
        <Link href="/catalogue" className="btn-bold outline">Continuer mes achats</Link>
      </div>
    </section>
  );
}
