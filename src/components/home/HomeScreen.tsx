'use client';

import { useRef, useState, useEffect } from 'react';
import { Orb } from '@/components/shared/Orb';
import { WigCard } from '@/components/shared/WigCard';
import { ValueStrip } from '@/components/shared/ValueStrip';
import { WIGS } from '@/lib/wigs-data';
import type { Route } from '@/types/app';

interface HomeScreenProps {
  setRoute: (r: Route) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onGoProduct: (wig: typeof WIGS[0]) => void;
  onOpenChat: () => void;
}

const HERO_ORBS = [
  { top: '15%', left: '50%', transform: 'translateX(-50%)', depth: 12, size: 340, color: 'var(--hair-2)', shape: 'long', delay: '0s' },
  { top: '8%', left: '5%', depth: 20, size: 130, color: 'var(--hair-4)', shape: 'curly', delay: '1.5s' },
  { top: '12%', right: '5%', depth: 18, size: 120, color: 'var(--hair-1)', shape: 'wavy', delay: '0.8s' },
  { bottom: '15%', left: '8%', depth: 25, size: 100, color: 'var(--hair-5)', shape: 'wavy', delay: '2.2s' },
  { bottom: '20%', right: '8%', depth: 15, size: 110, color: 'var(--hair-3)', shape: 'curly', delay: '0.4s' },
] as const;

export function HomeScreen({ setRoute, wishlistIds, onToggleWishlist, onGoProduct, onOpenChat }: HomeScreenProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      setMouse({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const px = (depth: number) => `translate3d(${mouse.x * depth}px, ${mouse.y * depth}px, 0)`;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">
              <span className="pulse" />
              Nouvelle collection · Été 2026
            </div>
            <h1>
              Votre beauté,<br />
              <span className="italic">votre couronne.</span>
            </h1>
            <p className="hero-sub">
              Perruques premium en cheveux humains. Essayage hybride : Basic gratuit
              en 1 seconde, ou Premium photo-réaliste par IA — 1er essai offert.
              Conseils d'Élodie 24h/24.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => setRoute('catalog')}>
                Découvrir le catalogue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </button>
              <button className="btn btn-ghost" onClick={() => setRoute('tryon')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                Essayer en direct
              </button>
            </div>
            <div className="hero-stats">
              {[
                { num: '87k', suffix: '+', lbl: 'Essayages virtuels' },
                { num: '4.9', suffix: '★', lbl: 'Sur 12k+ avis' },
                { num: '48', suffix: 'h', lbl: 'Livraison France' },
              ].map(({ num, suffix, lbl }) => (
                <div key={lbl}>
                  <div className="stat-num">
                    {num}<span className="italic">{suffix}</span>
                  </div>
                  <div className="stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-stage" ref={stageRef}>
            <div className="stage-floor" />
            {HERO_ORBS.map((orb, i) => (
              <div
                key={i}
                className="wig-float"
                style={{
                  top: (orb as any).top,
                  left: (orb as any).left,
                  right: (orb as any).right,
                  bottom: (orb as any).bottom,
                  transform: `${(orb as any).transform ?? ''} ${px(orb.depth)}`.trim(),
                  width: orb.size,
                  height: orb.size,
                  animationDelay: orb.delay,
                }}
              >
                <Orb color={orb.color} shape={orb.shape as any} />
              </div>
            ))}

            <div className="glass" style={{ position: 'absolute', top: '52%', right: '0%', padding: '14px 18px', borderRadius: 18, transform: px(30), display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-light), var(--gold-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>IA Face Mesh</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>468 points · temps réel</div>
              </div>
            </div>

            <div className="glass" style={{ position: 'absolute', top: '70%', left: '0%', padding: '12px 16px', borderRadius: 18, transform: px(22), fontSize: 13 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Aura Lace 18"</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginTop: 2 }}>289 €</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ─────────────────────────────────────────────── */}
      <ValueStrip />

      {/* ── Best-sellers ────────────────────────────────────────── */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">Best-sellers</div>
            <h2>Couronnes de la <span className="italic" style={{ color: 'var(--gold-deep)' }}>saison</span></h2>
          </div>
          <button className="btn btn-ghost" onClick={() => setRoute('catalog')}>
            Voir tout
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-6-7 7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="wig-grid">
          {WIGS.slice(0, 4).map((w) => (
            <WigCard
              key={w.id}
              wig={w}
              onClick={() => onGoProduct(w)}
              wishlisted={wishlistIds.includes(w.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* ── Élodie Tease ────────────────────────────────────────── */}
      <section className="elodie-card">
        <div className="elodie-card-inner">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'rgba(255,255,255,.1)', borderRadius: 999, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, background: '#6cd964', borderRadius: '50%' }} />
              Élodie · en ligne
            </div>
            <h3>Une styliste IA<br />à votre <span className="italic">écoute</span>.</h3>
            <p>
              Forme du visage, occasion, budget — Élodie analyse vos critères et
              recommande la perruque idéale. Réponse instantanée, 24h/24, et un suivi
              personnalisé jusqu'à la livraison.
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={onOpenChat}>
                Parler à Élodie
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-6-7 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="elodie-preview">
            <div className="msg user" style={{ maxWidth: '85%', alignSelf: 'flex-end' }}>
              Je cherche une perruque ondulée pour le quotidien, vers 250€ ?
            </div>
            <div className="msg bot" style={{ maxWidth: '90%' }}>
              Bien sûr ! Pour un look quotidien naturel, je vous recommande la <strong>Velours 16"</strong> — body wave, très confortable.
              <div className="product-pill">
                <Orb color="var(--hair-2)" shape="wavy" />
                <div>
                  <div className="pp-name">Velours 16"</div>
                  <div className="pp-price">259 € · 4 coloris</div>
                </div>
              </div>
            </div>
            <div className="quick-replies">
              <button className="qr">Voir la fiche</button>
              <button className="qr">Autres options</button>
              <button className="qr">Lancer l'essayage</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="foot">
        <div className="display">
          Votre beauté, <span className="italic">votre couronne.</span>
        </div>
        <div>Glory Hair · Maison de perruques · © 2026</div>
      </footer>
    </>
  );
}
