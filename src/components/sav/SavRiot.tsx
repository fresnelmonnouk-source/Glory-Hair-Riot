'use client';

/**
 * Page SAV RIOT — port fidèle <section class="sav"> Riot.html (2817-2904)
 * + CSS 165-225.
 *
 * Composant client : 6 FAQ <details>/<summary> avec rotation alternée +
 * 3 help-cards (suivi commande, contact, atelier).
 */

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQ: FaqItem[] = [
  {
    q: '★ Quelle perruque pour mon visage ?',
    a: (
      <>
        Demande à <b>Élodie</b>, notre styliste IA. Décris ta forme de visage, ton style et ton budget — elle te recommande la perruque idéale en 12s.
        Tu peux aussi tester en direct avec l&apos;<Link href="/essayage" style={{ textDecoration: 'underline', color: 'inherit' }}>essayage virtuel</Link>.
      </>
    ),
  },
  {
    q: "★ Comment fonctionne l'essayage virtuel ?",
    a: (
      <>
        Tu actives ta caméra ou tu envoies une photo. Notre IA (Gemini, OpenAI en backup) génère une image photo-réaliste où tu portes la perruque, en ~5 secondes.
        <br /><br />
        <b>1 essai gratuit</b> par appareil (limite anti-abus IP + 30j sliding). Crée un compte pour gagner <b>+2 essais Premium</b> offerts (3 au total) + récupère 1 essai bonus tous les 100 pts Glory Club gagnés.
        Au-delà : <b>4,99€</b> par essai Premium.
      </>
    ),
  },
  {
    q: '★ Quel délai de livraison ?',
    a: (
      <>
        <b>France métropole</b> : 48h, livraison offerte. <b>Europe</b> : 3-5 jours ouvrés. <b>International</b> : 5-7 jours.
        Numéro de suivi envoyé par mail dans les 12h après commande.
      </>
    ),
  },
  {
    q: '★ Puis-je retourner une perruque ?',
    a: (
      <>
        Oui — <b>30 jours</b> pour changer d&apos;avis, retour offert en France.
        La perruque doit être dans son emballage d&apos;origine, non portée, non lavée. Échange ou remboursement intégral.
      </>
    ),
  },
  {
    q: '★ Comment entretenir ma perruque ?',
    a: (
      <>
        Lavage doux toutes les <b>6 semaines</b> avec un shampoing sans sulfate.
        Sécher à l&apos;air libre, jamais au sèche-cheveux brûlant. Ranger sur un porte-perruque pour préserver le brushing.
      </>
    ),
  },
  {
    q: '★ La garantie couvre quoi ?',
    a: (
      <>
        <b>12 mois</b> sur la qualité des cheveux et de la calotte. Sont exclus : usure normale, coloration maison, coupes non-pro. En cas de souci, on remplace la pièce gratuitement.
      </>
    ),
  },
];

// ─── Component ──────────────────────────────────────

export function SavRiot() {
  return (
    <section className="container-pad" style={{
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
      borderBottom: '3px solid #FF4D8D',
    }}>
      {/* Head */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 24,
        borderBottom: '3px dashed #FF7A1A',
        paddingBottom: 28, marginBottom: 32,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(44px, 9vw, 140px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          AIDE &amp;{' '}
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', textTransform: 'none', color: '#FF7A1A',
          }}>
            SAV
          </em>
          <span style={{
            background: '#D4FF3E', color: '#0A0A0A',
            padding: '0 0.08em', display: 'inline-block',
            transform: 'rotate(-1deg)',
          }}>.</span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-caveat),cursive',
          fontWeight: 700, color: '#D4FF3E', fontSize: 28,
          lineHeight: 1.1, transform: 'rotate(-3deg)', maxWidth: 280,
        }}>
          → tu cherches quelque chose ?
          <br />On répond en 12h ✨
        </p>
      </div>

      {/* Grid : FAQ + help cards */}
      <div
        className="row-grid row-15-1"
        style={{ gap: 32, alignItems: 'start' }}
      >
        {/* FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQ.map((item, i) => (
            <FaqDetails key={i} item={item} index={i} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Help side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TrackOrderCard />
          <ContactCard />
          <AtelierCard />
        </div>
      </div>
    </section>
  );
}

// ─── FAQ details ────────────────────────────────────

function FaqDetails({ item, index, defaultOpen }: {
  item: FaqItem; index: number; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const rotations = ['-0.5deg', '0.5deg', '-0.5deg', '0.5deg', '-0.5deg', '0.5deg'];
  const shadows = ['#D4FF3E', '#FF7A1A', '#F5E55E', '#FF4D8D', '#D4FF3E', '#FF7A1A'];

  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A',
      transform: `rotate(${rotations[index % rotations.length]})`,
      boxShadow: `4px 4px 0 ${shadows[index % shadows.length]}`,
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%', textAlign: 'left',
          background: 'transparent',
          border: 0,
          padding: '18px 22px',
          fontFamily: 'var(--font-permanent-marker),cursive',
          fontSize: 20, lineHeight: 1.3,
          color: '#0A0A0A',
          cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
          borderBottom: open ? '2px dashed #0A0A0A' : 0,
        }}
      >
        <span style={{ flex: 1 }}>{item.q}</span>
        <span aria-hidden style={{
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 24,
          color: '#FF7A1A',
          width: 24, height: 24, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'transform .2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          +
        </span>
      </button>
      {open && (
        <div style={{
          padding: '14px 22px 20px',
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 14, lineHeight: 1.55,
          color: '#0A0A0A',
        }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

// ─── Help cards ─────────────────────────────────────

function TrackOrderCard() {
  const [num, setNum] = useState('');
  const [result, setResult] = useState<string | null>(null);

  function track(e: React.FormEvent) {
    e.preventDefault();
    if (!num.trim()) return;
    // Stub : pas de backend tracking pour l'instant
    setResult(`Commande ${num.toUpperCase()} introuvable. Vérifie le numéro ou contacte le SAV.`);
    setTimeout(() => setResult(null), 6000);
  }

  return (
    <HelpCard tape="rgba(255,122,26,.7)" shadow="#FF7A1A" rotate="1deg">
      <h4 style={cardH4Style}>★ Suivi de commande</h4>
      <p style={leadStyle}>
        Entre ton numéro de commande pour voir où en est ton colis.
      </p>
      <form onSubmit={track} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="GH-14XXXX"
          aria-label="Numéro de commande"
          style={{
            flex: 1, border: '3px solid #0A0A0A',
            padding: '10px 12px',
            fontFamily: 'var(--font-special-elite),monospace', fontSize: 13,
            background: '#F4ECD8', color: '#0A0A0A',
            outline: 'none',
          }}
        />
        <button type="submit" style={{
          background: '#0A0A0A', color: '#D4FF3E',
          padding: '10px 14px',
          fontFamily: 'var(--font-rubik-mono-one),monospace',
          fontSize: 11, letterSpacing: '0.1em',
          border: '3px solid #0A0A0A', cursor: 'pointer',
        }}>
          →
        </button>
      </form>
      {result && (
        <div style={{
          marginTop: 10,
          fontFamily: 'var(--font-special-elite),monospace',
          fontSize: 11, color: '#FF3D00',
        }}>
          {result}
        </div>
      )}
    </HelpCard>
  );
}

function ContactCard() {
  return (
    <HelpCard tape="rgba(212,255,62,.7)" shadow="#D4FF3E" rotate="-1deg">
      <h4 style={cardH4Style}>★ Nous contacter</h4>
      <InfoRow k="MAIL" v="hello@maison-glory.fr" href="mailto:hello@maison-glory.fr" />
      <InfoRow k="TEL" v="+33 1 45 22 18 90" href="tel:+33145221890" />
      <InfoRow k="WHATSAPP" v="+33 6 78 12 34 56" href="https://wa.me/33678123456" external />
      <InfoRow k="ÉLODIE" v="Chat 24/7" href="/elodie" />
    </HelpCard>
  );
}

function AtelierCard() {
  return (
    <HelpCard tape="repeating-linear-gradient(45deg, rgba(212,255,62,.7) 0 8px, rgba(212,255,62,.4) 8px 16px)" shadow="#FF4D8D" rotate="1.2deg">
      <h4 style={cardH4Style}>★ Atelier Paris 9</h4>
      <p style={leadStyle}>
        Sur rendez-vous, du mardi au samedi.
      </p>
      <InfoRow k="ADR" v="12 rue Notre-Dame-de-Lorette, 75009" />
      <InfoRow k="MÉTRO" v="Saint-Georges (L12)" />
      <InfoRow k="RDV" v="Prendre RDV" href="mailto:hello@maison-glory.fr?subject=RDV%20Atelier%20Paris%209" />
    </HelpCard>
  );
}

// ─── Helpers ────────────────────────────────────────

function HelpCard({ children, tape, shadow, rotate }: {
  children: React.ReactNode; tape: string; shadow: string; rotate: string;
}) {
  return (
    <div style={{
      background: '#F4ECD8', color: '#0A0A0A',
      border: '3px solid #0A0A0A',
      padding: 22,
      position: 'relative',
      transform: `rotate(${rotate})`,
      boxShadow: `6px 6px 0 ${shadow}`,
    }}>
      <span aria-hidden style={{
        position: 'absolute', top: -14, left: 24,
        width: 100, height: 22,
        background: tape,
        borderLeft: '1px dashed rgba(0,0,0,.3)',
        borderRight: '1px dashed rgba(0,0,0,.3)',
        transform: 'rotate(-3deg)',
      }} />
      {children}
    </div>
  );
}

function InfoRow({ k, v, href, external }: {
  k: string; v: string; href?: string; external?: boolean;
}) {
  const value = href ? (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ color: '#0A0A0A', textDecoration: 'underline' }}
    >
      {v}
    </a>
  ) : v;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      fontFamily: 'var(--font-special-elite),monospace',
      fontSize: 14,
      borderTop: '2px dashed #0A0A0A',
    }}>
      <b style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        background: '#0A0A0A', color: '#D4FF3E',
        padding: '3px 8px', fontSize: 10, letterSpacing: '0.1em',
        flexShrink: 0, minWidth: 64, textAlign: 'center',
      }}>
        {k}
      </b>
      <span>{value}</span>
    </div>
  );
}

const cardH4Style: CSSProperties = {
  fontFamily: 'var(--font-permanent-marker),cursive',
  fontSize: 22, marginBottom: 6, color: '#0A0A0A',
};

const leadStyle: CSSProperties = {
  fontFamily: 'var(--font-special-elite),monospace',
  fontSize: 13, color: '#5E6A64',
  marginBottom: 4, lineHeight: 1.5,
};
