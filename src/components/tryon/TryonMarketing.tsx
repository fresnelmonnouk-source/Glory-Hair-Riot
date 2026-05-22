'use client';

/**
 * Page marketing /essayage — vitrine du module IA.
 * Port fidèle de la section .tryon de Riot.html (lignes 2291-2398).
 *
 * Cette page N'EST PAS l'application. Elle présente le produit Essai Live
 * et redirige vers /essayage/live via les CTAs.
 *
 * Le quota est partagé via src/lib/quota.ts (localStorage anon, futur DB pour comptes).
 */

import Link from 'next/link';
import { CSSProperties, useEffect, useState } from 'react';
import { readQuota, getLiveCtaHref, getLiveCtaLabel, QUOTA_LIMIT_ANON, QUOTA_LIMIT_LOGGED, type QuotaState } from '@/lib/quota';

// ─── Helpers UI ───────────────────────────────────────

function Pips({ used, total }: { used: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isUsed = i < used;
        return (
          <span
            key={i}
            aria-label={isUsed ? 'essai utilisé' : 'essai restant'}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '3px solid #D4FF3E',
              background: isUsed ? '#D4FF3E' : 'transparent',
              position: 'relative',
              display: 'inline-block',
              ...(isUsed && {
                boxShadow: 'inset 0 0 0 2px #0A0A0A',
              }),
            }}
          />
        );
      })}
    </div>
  );
}

const BTN_BOLD: CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),sans-serif',
  fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
  border: '3px solid #0A0A0A', padding: '16px 26px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  textDecoration: 'none', cursor: 'pointer',
  background: '#D4FF3E', color: '#0A0A0A',
  boxShadow: '6px 6px 0 #FF7A1A',
};

const BTN_ORANGE: CSSProperties = {
  ...BTN_BOLD,
  background: '#FF7A1A',
  boxShadow: '6px 6px 0 #D4FF3E',
};

// ─── Composant principal ──────────────────────────────

export function TryonMarketing() {
  // TODO Phase 5 : passer mode='logged' quand trpc.auth.getSession retourne un user
  const isLoggedIn = false;
  const mode = isLoggedIn ? 'logged' : 'anon';

  const [quota, setQuota] = useState<QuotaState>(() => readQuota(mode));
  useEffect(() => { setQuota(readQuota(mode)); }, [mode]);

  return (
    <section
      style={{
        padding: '80px 32px 96px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid #FF7A1A',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(72px,11vw,180px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          Essai
          <br />
          <span style={{
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '0 0.08em', display: 'inline-block',
            transform: 'rotate(-1deg)',
            boxShadow: '8px 8px 0 #FF7A1A',
          }}>
            LIVE.
          </span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-caveat),cursive',
          fontWeight: 700, color: '#D4FF3E', fontSize: 28,
          lineHeight: 1.2, maxWidth: 280, transform: 'rotate(-3deg)',
        }}>
          → 2 essais offerts
          <br />par appareil ✨
          <br />5 avec un compte !
        </p>
      </div>

      {/* Shell : camera + side info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 0,
        background: '#142A1F',
        border: '4px solid #0A0A0A',
        boxShadow: '10px 10px 0 #D4FF3E',
        overflow: 'hidden',
      }}>
        {/* ── Cam mock ── */}
        <CameraMock />

        {/* ── Side panel ── */}
        <div style={{ padding: '30px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 12, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#5E6A64',
            }}>
              // Essai photo-réaliste IA
            </div>
            <h3 style={{
              fontFamily: 'var(--font-anton),Impact,sans-serif',
              fontSize: 42, lineHeight: 0.9,
              textTransform: 'uppercase', color: '#F4ECD8',
              marginTop: 6,
            }}>
              Premium ·{' '}
              <span style={{ background: '#FF7A1A', color: '#0A0A0A', padding: '0 0.1em', display: 'inline-block' }}>
                temps réel.
              </span>
            </h3>
          </div>

          {/* Premium card */}
          <div style={{
            background: '#0A0A0A',
            border: '3px solid #D4FF3E',
            padding: '20px 18px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -12, right: 14,
              background: '#D4FF3E', color: '#0A0A0A',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 10, letterSpacing: '0.12em', padding: '4px 10px',
              border: '2px solid #0A0A0A', transform: 'rotate(4deg)',
            }}>★ IA HD</div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#FF7A1A', color: '#0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 20,
                border: '2px solid #0A0A0A',
              }}>▶</div>
              <div>
                <h4 style={{
                  fontFamily: 'var(--font-permanent-marker),cursive',
                  color: '#F4ECD8', fontSize: 22, lineHeight: 1,
                }}>Essai Premium</h4>
                <div style={{
                  fontFamily: 'var(--font-special-elite),monospace',
                  fontSize: 11, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#5E6A64', marginTop: 4,
                }}>
                  // Tarif normal · 4,99€
                </div>
              </div>
            </div>

            <p style={{
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 13, lineHeight: 1.5, color: 'rgba(244,236,216,.8)',
            }}>
              Rendu{' '}
              <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px', fontWeight: 400 }}>photo-réaliste</b>
              , IA générative, temps réel. Tu vois ta vraie tête, avec la vraie perruque. Pas un filtre cheap.
            </p>

            {/* Quota display */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '2px dashed rgba(212,255,62,.3)' }}>
              <Pips used={quota.count} total={quota.limit} />
              <div style={{ marginTop: 10 }}>
                <div style={{
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 14, color: '#D4FF3E',
                }}>
                  {quota.remaining > 0 ? (
                    <>
                      <b>{quota.remaining}</b> essai{quota.remaining > 1 ? 's' : ''} restant{quota.remaining > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>Quota épuisé</>
                  )}
                </div>
                <small style={{
                  fontFamily: 'var(--font-special-elite),monospace',
                  fontSize: 11, color: 'rgba(244,236,216,.5)', display: 'block', marginTop: 4,
                }}>
                  {mode === 'anon'
                    ? `${QUOTA_LIMIT_ANON} essais offerts par appareil · sans création de compte`
                    : `${QUOTA_LIMIT_LOGGED} essais Premium · re-créditables avec tes points Glory Club`}
                </small>
              </div>
            </div>
          </div>

          {/* Signup CTA (anon only) */}
          {mode === 'anon' && (
            <div style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: 18, position: 'relative',
              border: '3px solid #0A0A0A', transform: 'rotate(-0.5deg)',
              boxShadow: '4px 4px 0 #D4FF3E',
            }}>
              <span aria-hidden style={{
                position: 'absolute', top: -12, left: 30,
                width: 90, height: 20, background: 'rgba(245,229,94,.7)',
                transform: 'rotate(-3deg)', display: 'block',
              }} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18,
              }}>
                <span style={{ color: '#FF7A1A' }}>★</span>
                <b>Crée ton compte, gagne{' '}
                  <span style={{ background: '#D4FF3E', padding: '0 4px' }}>+3 essais</span>{' '}
                en plus
                </b>
              </div>
              <p style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 13, lineHeight: 1.5, marginTop: 8,
              }}>
                Soit <b>5 essais Premium offerts</b> au total. Plus ton historique gardé, ta wishlist sauvée et l&apos;accès au Glory Club (points fidélité).
              </p>
              <Link
                href="/connexion"
                style={{ ...BTN_BOLD, width: '100%', marginTop: 12 }}
              >
                → Créer mon compte
              </Link>
            </div>
          )}

          {/* Anti-fraude notice */}
          <div style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12, lineHeight: 1.5, color: 'rgba(244,236,216,.5)',
            padding: '12px 14px', border: '2px dashed rgba(244,236,216,.2)',
          }}>
            Limite par adresse IP &amp; empreinte appareil — pour rester gratuit pour tout le monde, on bloque les essais en boucle. Si tu rencontres un blocage légitime, contacte le SAV.
          </div>

          {/* Adjustments mockup */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-permanent-marker),cursive',
              color: '#D4FF3E', fontSize: 18, marginBottom: 10,
              transform: 'rotate(-2deg)', display: 'inline-block',
            }}>
              // Ajustements
            </h4>
            {[
              { label: 'Avant',    width: 60 },
              { label: 'Latéral',  width: 50 },
              { label: 'Taille',   width: 72 },
              { label: 'Densité',  width: 80 },
            ].map((adj) => (
              <div key={adj.label} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '6px 0', fontFamily: 'var(--font-vt323),monospace', fontSize: 18, color: '#F4ECD8',
              }}>
                <label style={{
                  width: 80, color: '#5E6A64',
                  fontFamily: 'var(--font-special-elite),monospace',
                  fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>{adj.label}</label>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.15)', position: 'relative', border: '2px solid #F4ECD8' }}>
                  <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: '#D4FF3E', width: `${adj.width}%`, display: 'block' }} />
                </div>
                <span style={{ width: 36, textAlign: 'right', color: '#D4FF3E', fontSize: 20 }}>{adj.width}</span>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <Link
            href={getLiveCtaHref(quota)}
            style={{ ...BTN_ORANGE, width: '100%', marginTop: 8 }}
          >
            {getLiveCtaLabel(quota)}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Camera mockup component ──────────────────────────

function CameraMock() {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #0E1B14 0%, #1A2E1F 100%)',
      aspectRatio: '4/5',
      minHeight: 480,
      overflow: 'hidden',
      borderRight: '4px solid #0A0A0A',
    }}>
      {/* REC pill */}
      <div style={{
        position: 'absolute', top: 18, left: 18, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#0A0A0A', color: '#FF7A1A',
        padding: '6px 12px', border: '2px solid #FF7A1A',
        fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 11, letterSpacing: '0.1em',
      }}>
        <span aria-hidden style={{
          width: 10, height: 10, background: '#FF7A1A', borderRadius: '50%',
          animation: 'pulse 1.2s infinite',
        }} />
        REC · LIVE
      </div>

      {/* HUD top-left */}
      <div style={{
        position: 'absolute', top: 18, left: 160,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: '#D4FF3E', zIndex: 3,
      }}>
        FPS 60
      </div>

      {/* HUD bottom-right */}
      <div style={{
        position: 'absolute', bottom: 18, right: 18,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: '#D4FF3E', zIndex: 3,
      }}>
        LAT 12ms
      </div>

      {/* HUD bottom-left */}
      <div style={{
        position: 'absolute', bottom: 18, left: 18,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: 'rgba(244,236,216,.7)', zIndex: 3,
      }}>
        IA · OK
      </div>

      {/* Face silhouette */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translateX(-50%)',
        width: '60%', aspectRatio: '3/4',
        background: 'linear-gradient(180deg, #6c4a3a 0%, #4c3024 100%)',
        borderRadius: '50% 50% 45% 45%',
        boxShadow: 'inset 0 -20px 40px rgba(0,0,0,.4)',
      }}>
        {/* Eyes */}
        <span aria-hidden style={{
          position: 'absolute', top: '42%', left: '25%',
          width: '14%', height: '4%', background: '#1a0f08',
          borderRadius: '50%', boxShadow: '60px 0 #1a0f08',
        }} />
        {/* Mouth */}
        <span aria-hidden style={{
          position: 'absolute', top: '70%', left: '38%',
          width: '24%', height: '5%',
          background: 'linear-gradient(180deg, #8c4a3a 0%, #6c2e22 100%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Wig overlay */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%', right: '20%', height: '32%',
        background: 'linear-gradient(180deg, #3a1d10 0%, #5a3a1e 50%, transparent 100%)',
        borderRadius: '50% 50% 30% 30%',
        opacity: 0.92,
      }} />

      {/* Scanline overlay */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(212,255,62,.08) 50%, transparent 100%)',
        animation: 'scan 4s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Corners */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
        const base: CSSProperties = {
          position: 'absolute', width: 32, height: 32,
          border: '3px solid #D4FF3E', zIndex: 3,
        };
        const placements: Record<typeof pos, CSSProperties> = {
          tl: { top: 14, left: 14, borderRight: 0, borderBottom: 0 },
          tr: { top: 14, right: 14, borderLeft: 0, borderBottom: 0 },
          bl: { bottom: 14, left: 14, borderRight: 0, borderTop: 0 },
          br: { bottom: 14, right: 14, borderLeft: 0, borderTop: 0 },
        };
        return <span key={pos} aria-hidden style={{ ...base, ...placements[pos] }} />;
      })}
    </div>
  );
}
