'use client';

/**
 * Page marketing /essayage — vitrine du module IA.
 * Port fidèle de la section .tryon de Riot.html (lignes 1164-1361 + 2291-2398).
 *
 * Cette page N'EST PAS l'application. Elle présente le produit Essai Live
 * et redirige vers /essayage/live via les CTAs.
 *
 * Le quota est partagé via src/lib/quota.ts (localStorage anon, futur DB pour comptes).
 */

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { readQuota, getLiveCtaHref, getLiveCtaLabel, QUOTA_LIMIT_ANON, QUOTA_LIMIT_LOGGED, type QuotaState } from '@/lib/quota';

// ─── Pip (port .tryon-quota .pip) ─────────────────────

function Pip({ used }: { used: boolean }) {
  return (
    <span
      aria-label={used ? 'essai utilisé' : 'essai restant'}
      style={{
        width: 18, height: 18, borderRadius: '50%',
        border: '2px solid #D4FF3E',
        background: used ? '#D4FF3E' : 'transparent',
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
      }}
    >
      {used && (
        <span aria-hidden style={{
          position: 'absolute', inset: 3,
          background: '#0A0A0A', borderRadius: '50%',
          display: 'block',
        }} />
      )}
    </span>
  );
}

// Boutons : on utilise la classe .btn-bold de riot.css (hover lift + active press).

// ─── Composant principal ──────────────────────────────

export function TryonMarketing() {
  // TODO Phase 5 : trpc.auth.getSession pour passer mode='logged'
  const isLoggedIn = false;
  const mode = isLoggedIn ? 'logged' : 'anon';

  const limit = mode === 'logged' ? QUOTA_LIMIT_LOGGED : QUOTA_LIMIT_ANON;
  const [quota, setQuota] = useState<QuotaState>({
    count: 0, limit, remaining: limit, resetAt: null, mode,
  });
  useEffect(() => { setQuota(readQuota(mode)); }, [mode]);

  return (
    <section style={{
      background: '#0A0A0A',
      color: '#F4ECD8',
      padding: '80px 32px',
      borderBottom: '3px solid #D4FF3E',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scanline overlay (port .tryon::before) */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(212,255,62,.06) 3px 4px)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 24, marginBottom: 40,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(80px,12vw,180px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          Essai
          <br />
          <span style={{
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '0 0.08em', display: 'inline-block',
            transform: 'rotate(-1deg)',
          }}>
            LIVE.
          </span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-caveat),cursive',
          fontWeight: 700, color: '#D4FF3E',
          fontSize: 32, lineHeight: 1.1,
          transform: 'rotate(-3deg)', maxWidth: 300,
        }}>
          → 2 essais offerts
          <br />par appareil ✨
          <br />5 avec un compte !
        </p>
      </div>

      {/* Shell : camera + side info */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20,
        border: '3px solid #F4ECD8',
        background: 'rgba(255,255,255,.03)',
      }}>
        <CameraMock />
        <SidePanel quota={quota} mode={mode} limit={limit} />
      </div>
    </section>
  );
}

// ─── Side panel ───────────────────────────────────────

function SidePanel({ quota, mode, limit }: { quota: QuotaState; mode: 'anon' | 'logged'; limit: number }) {
  return (
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
          <span style={{
            background: '#FF7A1A', color: '#0A0A0A',
            padding: '0 0.1em', display: 'inline-block',
          }}>
            temps réel.
          </span>
        </h3>
      </div>

      {/* Premium card — gradient orange→lime */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,122,26,.18) 0%, rgba(212,255,62,.08) 100%)',
        border: '3px solid #D4FF3E',
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Badge IA HD (à l'intérieur, top: 14) */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: '#FF7A1A', color: '#0A0A0A',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 10, letterSpacing: '0.12em',
          padding: '4px 10px', border: '2px solid #0A0A0A',
          transform: 'rotate(4deg)',
        }}>★ IA HD</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: '#FF7A1A', color: '#0A0A0A',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 20,
            border: '2px solid #0A0A0A', flexShrink: 0,
          }}>▶</div>
          <div>
            <h4 style={{
              fontFamily: 'var(--font-anton),Impact,sans-serif',
              fontSize: 28, lineHeight: 0.95,
              textTransform: 'uppercase', color: '#F4ECD8',
              letterSpacing: '-0.005em',
            }}>
              Essai Premium
            </h4>
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
          fontSize: 13, lineHeight: 1.5, color: '#F4ECD8',
        }}>
          Rendu{' '}
          <b style={{ background: '#D4FF3E', color: '#0A0A0A', padding: '0 4px', fontWeight: 400 }}>photo-réaliste</b>
          , IA générative, temps réel. Tu vois ta vraie tête, avec la vraie perruque. Pas un filtre cheap.
        </p>

        {/* Quota box (port .tryon-quota) */}
        <div style={{
          marginTop: 14, padding: 14,
          border: '2px dashed #F4ECD8',
          background: 'rgba(255,255,255,.04)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {Array.from({ length: quota.limit }).map((_, i) => (
              <Pip key={i} used={i < quota.count} />
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12, lineHeight: 1.35,
            color: '#F4ECD8', letterSpacing: '0.02em',
          }}>
            <b style={{
              color: '#D4FF3E',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 14, fontWeight: 400,
              display: 'inline',
            }}>
              {quota.remaining > 0
                ? `${quota.remaining} essai${quota.remaining > 1 ? 's' : ''} restant${quota.remaining > 1 ? 's' : ''}`
                : 'Quota épuisé'}
            </b>
            <small style={{
              color: '#5E6A64', display: 'block',
              fontSize: 11, marginTop: 2,
            }}>
              {mode === 'anon'
                ? `${limit} essais offerts par appareil · sans création de compte`
                : `${limit} essais Premium · re-créditables avec tes points Glory Club`}
            </small>
          </div>
        </div>
      </div>

      {/* Signup CTA (anon only) — paper-yellow + tape orange */}
      {mode === 'anon' && (
        <div style={{
          background: '#F5E55E', color: '#0A0A0A',
          border: '3px solid #0A0A0A', padding: '16px 18px',
          position: 'relative',
          transform: 'rotate(-0.6deg)',
          boxShadow: '5px 5px 0 #FF7A1A',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: -12, left: 24,
            width: 100, height: 22,
            background: 'rgba(255,122,26,.7)',
            borderLeft: '1px dashed rgba(0,0,0,.3)',
            borderRight: '1px dashed rgba(0,0,0,.3)',
            transform: 'rotate(-3deg)',
          }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
          }}>
            <span style={{
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 20, color: '#FF7A1A',
            }}>★</span>
            <b style={{
              fontFamily: 'var(--font-permanent-marker),cursive',
              fontSize: 18, color: '#0A0A0A', display: 'block',
            }}>
              Crée ton compte, gagne{' '}
              <span style={{
                background: '#FF7A1A', color: '#0A0A0A',
                fontFamily: 'var(--font-rubik-mono-one),monospace',
                fontSize: 11, letterSpacing: '0.1em',
                padding: '2px 8px', border: '2px solid #0A0A0A',
              }}>+3 essais</span>
              {' '}en plus
            </b>
          </div>
          <p style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12, lineHeight: 1.45, marginTop: 4, color: '#0A0A0A',
          }}>
            Soit <b>5 essais Premium offerts</b> au total. Plus ton historique gardé, ta wishlist sauvée et l&apos;accès au Glory Club (points fidélité).
          </p>
          <Link
            href="/connexion"
            className="btn-bold full"
            style={{ marginTop: 10 }}
          >
            → Créer mon compte
          </Link>
        </div>
      )}

      {/* Anti-fraud notice avec ★ lime */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        marginTop: 10,
        fontFamily: 'var(--font-special-elite),monospace',
        fontSize: 11, lineHeight: 1.4, color: '#5E6A64',
        letterSpacing: '0.04em',
      }}>
        <span aria-hidden style={{
          color: '#D4FF3E',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 14, lineHeight: 1, marginTop: 1,
        }}>★</span>
        <span>
          Limite par adresse IP &amp; empreinte appareil — pour rester gratuit pour tout le monde, on bloque les essais en boucle. Si tu rencontres un blocage légitime, contacte le SAV.
        </span>
      </div>

      {/* Ajustements — boîte bordée */}
      <div style={{ border: '3px solid #F4ECD8', padding: 18 }}>
        <h4 style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          color: '#D4FF3E', fontSize: 18, marginBottom: 10,
          transform: 'rotate(-2deg)', display: 'inline-block',
        }}>
          // Ajustements
        </h4>
        {[
          { label: 'Avant',   width: 60 },
          { label: 'Latéral', width: 50 },
          { label: 'Taille',  width: 72 },
          { label: 'Densité', width: 80 },
        ].map((adj) => (
          <div key={adj.label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '6px 0',
            fontFamily: 'var(--font-vt323),monospace', fontSize: 18, color: '#F4ECD8',
          }}>
            <label style={{
              width: 80, color: '#5E6A64',
              fontFamily: 'var(--font-special-elite),monospace',
              fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>{adj.label}</label>
            <div style={{
              flex: 1, height: 6,
              background: 'rgba(255,255,255,.15)',
              position: 'relative',
              border: '2px solid #F4ECD8',
            }}>
              <i style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                background: '#D4FF3E', width: `${adj.width}%`, display: 'block',
              }} />
            </div>
            <span style={{
              width: 36, textAlign: 'right',
              color: '#D4FF3E', fontSize: 20,
            }}>{adj.width}</span>
          </div>
        ))}
      </div>

      {/* Main CTA — dynamique selon quota */}
      <Link
        href={getLiveCtaHref(quota)}
        className="btn-bold orange full"
        style={{ marginTop: 8 }}
      >
        {getLiveCtaLabel(quota)}
      </Link>
    </div>
  );
}

// ─── Camera mockup — port fidèle .tryon-cam ───────────

function CameraMock() {
  return (
    <div style={{
      position: 'relative',
      aspectRatio: '1/1',
      overflow: 'hidden',
      borderRight: '3px solid #F4ECD8',
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
    }}>
      {/* Face silhouette */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '55%', aspectRatio: '3/4',
        borderRadius: '45% 45% 35% 35% / 55% 55% 45% 45%',
        background: 'radial-gradient(ellipse at 50% 35%, #d4a888 0%, #b8896a 40%, #8c624a 80%, #5a3a26 100%)',
        boxShadow: 'inset 0 -30px 60px rgba(0,0,0,.4)',
        filter: 'grayscale(.3) contrast(1.1)',
      }}>
        <span aria-hidden style={{
          position: 'absolute', top: '42%', left: '25%',
          width: '14%', height: '4%',
          background: '#1a0f08', borderRadius: '50%',
          boxShadow: '60px 0 #1a0f08',
        }} />
        <span aria-hidden style={{
          position: 'absolute', top: '70%', left: '38%',
          width: '24%', height: '5%',
          background: 'linear-gradient(180deg, #8c4a3a 0%, #6c2e22 100%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Wig overlay */}
      <div style={{
        position: 'absolute', top: '18%', left: '50%',
        transform: 'translateX(-50%)',
        width: '46%', height: '38%',
        borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
        background: 'radial-gradient(ellipse at 50% 30%, #6b4a26 0%, #3a1d10 60%, #1a0f08 100%)',
        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,.6))',
      }} />

      {/* Scanline + vignette overlay (port .tryon-cam::after) */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `
          repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,.04) 2px 3px),
          radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,.5) 100%)
        `,
        pointerEvents: 'none',
        animation: 'scan 4s linear infinite',
      }} />

      {/* REC — centré top */}
      <div style={{
        position: 'absolute', top: 18, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-vt323),monospace',
        fontSize: 18, color: '#FF7A1A',
        display: 'flex', gap: 8, alignItems: 'center',
        letterSpacing: '0.06em', zIndex: 3,
      }}>
        <span aria-hidden style={{
          width: 10, height: 10, background: '#FF7A1A',
          borderRadius: '50%',
          animation: 'pulse 1.2s infinite',
        }} />
        ● REC · LIVE
      </div>

      {/* HUD top-left */}
      <div style={{
        position: 'absolute', top: 18, left: 60,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: '#D4FF3E', zIndex: 3,
      }}>FPS 60</div>

      {/* HUD bottom-right */}
      <div style={{
        position: 'absolute', bottom: 18, right: 60,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: '#D4FF3E', zIndex: 3,
      }}>LAT 12ms</div>

      {/* HUD bottom-left */}
      <div style={{
        position: 'absolute', bottom: 18, left: 60,
        fontFamily: 'var(--font-vt323),monospace', fontSize: 18,
        color: '#F4ECD8', opacity: 0.7, zIndex: 3,
      }}>468 pts · OK</div>

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
