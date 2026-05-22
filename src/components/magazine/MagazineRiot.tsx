'use client';

/**
 * Page Magazine RIOT — éditorial Issue N°01.
 *
 * Riot.html n'a pas de section magazine dédiée (le lien Magazine du nav pointe
 * vers feature-prod). Cette page est construite dans le langage RIOT (zine
 * éditorial) en utilisant les composants existants : cover ginger + édito +
 * grille des 6 wigs comme articles + colophon.
 *
 * 'use client' : handlers hover sur ArticleCard.
 */

import Link from 'next/link';
import { WIGS, type Wig } from '@/lib/wigs-data';

export function MagazineRiot() {
  return (
    <>
      {/* ═══ Hero éditorial : COVER ISSUE N°01 ═══ */}
      <section style={{
        padding: '80px 32px 40px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '3px solid #FF7A1A',
      }}>
        {/* Stamp coin haut */}
        <div style={{
          position: 'absolute', top: 30, right: 32,
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 14, letterSpacing: '0.1em',
          border: '3px solid #FF7A1A', color: '#FF7A1A',
          padding: '8px 14px',
          transform: 'rotate(8deg)',
          background: 'rgba(14,27,20,.5)', zIndex: 5,
        }}>
          ISSUE N°01 · ÉTÉ 2026
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 60, alignItems: 'start',
        }}>
          {/* Édito */}
          <div>
            <div style={{
              display: 'inline-block',
              background: '#D4FF3E', color: '#0A0A0A',
              padding: '8px 14px',
              fontFamily: 'var(--font-rubik-mono-one),monospace',
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              transform: 'rotate(-2deg)', marginBottom: 24,
              border: '2px solid #0A0A0A',
              boxShadow: '3px 3px 0 #FF7A1A',
            }}>
              ★ MAGAZINE · ÉDITO
            </div>

            <h1 style={{
              fontFamily: 'var(--font-anton),Impact,sans-serif',
              fontSize: 'clamp(80px,12vw,200px)',
              lineHeight: 0.82, letterSpacing: '-0.01em',
              textTransform: 'uppercase', color: '#F4ECD8',
            }}>
              ISSUE
              <br />
              <span style={{
                background: '#D4FF3E', color: '#0A0A0A',
                padding: '0 0.08em', display: 'inline-block',
                transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #FF7A1A',
              }}>
                N°01.
              </span>
            </h1>

            <p style={{
              fontFamily: 'var(--font-special-elite),monospace',
              color: '#F4ECD8', fontSize: 17, lineHeight: 1.5,
              maxWidth: 520, marginTop: 28,
            }}>
              6 perruques. 6 attitudes. 6 portraits de filles qui ne demandent la permission à personne.
              Tirées brin par brin dans notre atelier Paris 9, photographiées sans filtre, collées sur des polaroids,
              déchirées avec amour. Voici Glory Hair{' '}
              <em style={{
                fontFamily: 'var(--font-yeseva-one),serif',
                fontStyle: 'italic', color: '#FF7A1A',
              }}>by RHD Empire</em>, version Été 2026.
            </p>

            <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/catalogue" className="btn-bold">→ Voir le catalogue</Link>
              <Link href="/essayage" className="btn-bold orange">▶ Essayer une perruque</Link>
            </div>

            <div style={{
              marginTop: 36,
              fontFamily: 'var(--font-caveat),cursive',
              fontWeight: 700, color: '#D4FF3E', fontSize: 28,
              lineHeight: 1.1, transform: 'rotate(-3deg)',
              maxWidth: 320,
            }}>
              → 64 pages, lues en 6 minutes ✨
            </div>
          </div>

          {/* Cover Ginger (polaroïd géant) */}
          <div style={{ position: 'relative', minHeight: 640 }}>
            <CoverPolaroid />
          </div>
        </div>
      </section>

      {/* ═══ Sommaire ═══ */}
      <section style={{
        padding: '60px 32px 40px',
        borderBottom: '3px dashed #D4FF3E',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 40, flexWrap: 'wrap', gap: 24,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(56px,8vw,120px)',
            lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
          }}>
            Au{' '}
            <span style={{
              background: '#FF7A1A', color: '#0A0A0A',
              padding: '0 0.08em', display: 'inline-block',
              transform: 'rotate(-1deg)',
            }}>
              sommaire.
            </span>
          </h2>
          <p style={{
            fontFamily: 'var(--font-caveat),cursive',
            fontWeight: 700, color: '#FF7A1A', fontSize: 28,
            lineHeight: 1.1, transform: 'rotate(2deg)', maxWidth: 280,
          }}>
            → 6 articles &<br />une équipe punk
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 28,
        }}>
          {WIGS.map((wig, i) => (
            <ArticleCard key={wig.id} wig={wig} index={i} />
          ))}
        </div>
      </section>

      {/* ═══ Colophon mag ═══ */}
      <section style={{
        padding: '60px 32px 80px',
      }}>
        <div style={{
          background: '#F4ECD8', color: '#0A0A0A',
          border: '3px solid #0A0A0A',
          padding: '32px 28px',
          transform: 'rotate(-0.6deg)',
          boxShadow: '8px 8px 0 #D4FF3E',
          maxWidth: 900, margin: '0 auto',
          position: 'relative',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: -14, left: 30,
            width: 140, height: 24,
            background: 'rgba(255,122,26,.7)',
            borderLeft: '1px dashed rgba(0,0,0,.3)',
            borderRight: '1px dashed rgba(0,0,0,.3)',
            transform: 'rotate(-3deg)',
          }} />

          <h3 style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 'clamp(40px,5vw,72px)',
            lineHeight: 0.9, textTransform: 'uppercase',
            marginBottom: 18, color: '#0A0A0A',
          }}>
            La{' '}
            <em style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic', color: '#FF7A1A',
            }}>
              rédac&apos;
            </em>
            .
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24, marginTop: 18,
          }}>
            {[
              { role: 'DIR. ARTISTIQUE',  name: 'Olivia M.',  bio: 'Couleurs, layouts, déchirements — c\'est elle.' },
              { role: 'PHOTOGRAPHE',      name: 'Naomi A.',   bio: 'Lumière naturelle, pas de retouche.' },
              { role: 'STYLISTE IA',      name: 'Élodie',     bio: 'Forme de visage, occasion, budget — 24/7.' },
              { role: 'ATELIER PARIS 9',  name: '12 NDL',     bio: 'Nœud, lavage, brushing — Sandra & Léna.' },
            ].map((p, i) => (
              <div key={p.role} style={{
                fontFamily: 'var(--font-special-elite),monospace',
                fontSize: 13, lineHeight: 1.5,
                transform: i % 2 === 0 ? 'rotate(-0.6deg)' : 'rotate(0.6deg)',
              }}>
                <div style={{
                  display: 'inline-block',
                  background: '#0A0A0A', color: '#D4FF3E',
                  fontFamily: 'var(--font-rubik-mono-one),monospace',
                  fontSize: 10, letterSpacing: '0.12em',
                  padding: '3px 8px', marginBottom: 6,
                }}>
                  {p.role}
                </div>
                <div style={{
                  fontFamily: 'var(--font-permanent-marker),cursive',
                  fontSize: 22, lineHeight: 1, color: '#0A0A0A',
                }}>
                  {p.name}
                </div>
                <div style={{ color: '#5E6A64', marginTop: 6 }}>
                  {p.bio}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, paddingTop: 20,
            borderTop: '3px dashed #0A0A0A',
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            fontFamily: 'var(--font-vt323),monospace', fontSize: 16,
            color: '#5E6A64', letterSpacing: '0.04em',
          }}>
            <span>★ ISSUE N°01 · VOL.I · ÉTÉ 2026 · 64 PAGES</span>
            <span>NEXT : ISSUE N°02 · AUTOMNE 2026</span>
          </div>
        </div>
      </section>
    </>
  );
}

// ═══ Cover polaroïd (Ginger) ════════════════════════

function CoverPolaroid() {
  const ginger = WIGS.find((w) => w.id === 'ginger');
  if (!ginger) return null;

  return (
    <>
      {/* Main cover polaroïd */}
      <div style={{
        position: 'absolute', top: 0, left: 30,
        width: '80%',
        background: '#F4ECD8',
        padding: '18px 18px 70px',
        transform: 'rotate(-3deg)',
        boxShadow: '8px 10px 0 #0A0A0A',
        zIndex: 2,
      }}>
        <div style={{
          background: '#0A0A0A',
          aspectRatio: '4/5',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ginger.img}
            alt="Couverture Issue N°01 — Ginger 22″"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'contrast(1.05) saturate(1.05)',
            }}
          />
        </div>
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div style={{
            fontFamily: 'var(--font-permanent-marker),cursive',
            fontSize: 32, lineHeight: 1, color: '#0A0A0A',
          }}>
            COVER · N°01
          </div>
          <small style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12, color: '#5E6A64', letterSpacing: '0.06em',
          }}>
            GINGER · 22″
          </small>
        </div>
      </div>

      {/* Sticker prix */}
      <div style={{
        position: 'absolute', top: 40, right: 20,
        background: '#D4FF3E', color: '#0A0A0A',
        padding: '10px 16px', borderRadius: 999,
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 16, border: '2px solid #0A0A0A',
        transform: 'rotate(12deg)',
        boxShadow: '3px 3px 0 #0A0A0A',
        zIndex: 7,
      }}>
        ★ 6 PIÈCES
      </div>

      {/* Sticker punk */}
      <div style={{
        position: 'absolute', bottom: 40, left: -10,
        background: '#FF7A1A', color: '#0A0A0A',
        padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--font-permanent-marker),cursive',
        fontSize: 14, border: '2px solid #0A0A0A',
        transform: 'rotate(-12deg)',
        boxShadow: '2px 3px 0 #0A0A0A',
        zIndex: 7,
      }}>
        PUNK SINCE 2024
      </div>
    </>
  );
}

// ═══ Article card (1 wig = 1 article) ═══════════════

function ArticleCard({ wig, index }: { wig: Wig; index: number }) {
  const rotations = ['-1.2deg', '1.4deg', '-0.8deg', '1.6deg', '-1.5deg', '1.1deg'];
  const shadows = ['#D4FF3E', '#FF7A1A', '#F5E55E', '#FF4D8D', '#D4FF3E', '#FF7A1A'];
  const articles = [
    'Comment porter le copper sans rougir',
    'Body wave : l\'art du naturel travaillé',
    'Le moka, ce neutre qui n\'est pas neutre',
    'Plum profond : la couleur dont personne ne parle',
    'Argent : 8 façons de l\'assumer',
    'Blond doré : retour de hype',
  ];
  const titles: Record<string, string> = {
    velours: articles[1]!,
    mocha: articles[2]!,
    ginger: articles[0]!,
    bordeaux: articles[3]!,
    argent: articles[4]!,
    creme: articles[5]!,
  };
  const articleTitle = titles[wig.id] ?? articles[0]!;

  return (
    <Link
      href={`/perruque/${wig.id}`}
      style={{
        background: '#F4ECD8', color: '#0A0A0A',
        padding: 14,
        textDecoration: 'none',
        transform: `rotate(${rotations[index % rotations.length]})`,
        boxShadow: `5px 5px 0 ${shadows[index % shadows.length]}`,
        display: 'block',
        border: '3px solid #0A0A0A',
        position: 'relative',
        transition: 'transform .25s, box-shadow .25s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-6px)';
        e.currentTarget.style.boxShadow = `8px 10px 0 ${shadows[index % shadows.length]}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotations[index % rotations.length]})`;
        e.currentTarget.style.boxShadow = `5px 5px 0 ${shadows[index % shadows.length]}`;
      }}
    >
      {/* Numéro article */}
      <div style={{
        position: 'absolute', top: 8, right: 14,
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 14, letterSpacing: '0.06em',
        background: '#0A0A0A', color: '#D4FF3E',
        padding: '3px 8px', zIndex: 2,
      }}>
        ART.0{index + 1}
      </div>

      <div style={{
        background: '#0A0A0A',
        aspectRatio: '4/5',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wig.img}
          alt={wig.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>

      <div style={{ padding: '14px 4px 0' }}>
        <div style={{
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 10, letterSpacing: '0.12em',
          color: '#5E6A64', marginBottom: 4,
        }}>
          {wig.num.replace('N°', 'N°')} · {wig.tone.toUpperCase()}
        </div>
        <div style={{
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 22, lineHeight: 1.1,
          color: '#0A0A0A',
        }}>
          {articleTitle}
        </div>
        <div style={{
          marginTop: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-special-elite),monospace', fontSize: 12,
          color: '#5E6A64',
        }}>
          <span>★ {3 + (index % 3)} min de lecture</span>
          <span style={{
            background: '#FF7A1A', color: '#0A0A0A',
            padding: '2px 8px',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            transform: 'rotate(-2deg)',
          }}>
            LIRE →
          </span>
        </div>
      </div>
    </Link>
  );
}
