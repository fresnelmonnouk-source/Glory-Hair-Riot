import Link from 'next/link';

const TESTIMONIALS = [
  {
    parts: ['Le lace est ', 'invisible', ", j'ai eu 3 compliments le 1er jour."],
    author: 'Naomi', location: 'Paris',
    rotate: '-1deg', shadow: '#FF7A1A',
  },
  {
    parts: ['Essayage virtuel ', 'bluffant', '. J\'ai testé 6 modèles avant de choisir.'],
    author: 'Maïmouna', location: 'Lyon',
    rotate: '1.2deg', shadow: '#D4FF3E',
  },
  {
    parts: ['Livré en 48h, qualité ', 'au top', '. Je recommande les yeux fermés.'],
    author: 'Aïcha', location: 'Marseille',
    rotate: '-0.8deg', shadow: '#FF4D8D',
  },
];

export function CustomerShow() {
  return (
    <section
      className="container-pad"
      style={{
        padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 32px)',
        borderBottom: '3px dashed #D4FF3E',
        overflow: 'hidden',
        position: 'relative',
      }}
    >

      {/* Heading row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(40px, 9vw, 140px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          VRAIES{' '}
          <span style={{
            background: '#FF4D8D',
            color: '#0A0A0A',
            padding: '0 0.08em',
            display: 'inline-block',
            transform: 'rotate(-2deg)',
          }}>
            filles,
          </span>
          <br />
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', fontWeight: 400, textTransform: 'none',
            color: '#FF7A1A',
          }}>
            vrais
          </em>{' '}cheveux.
        </h2>

        <p style={{
          fontFamily: 'var(--font-caveat),cursive',
          fontWeight: 700, color: '#D4FF3E', fontSize: 28,
          lineHeight: 1.2, maxWidth: 200, transform: 'rotate(-3deg)',
        }}>
          → taggez @gloryhair<br />pour apparaître !
        </p>
      </div>

      <div
        className="row-grid row-15-1"
        style={{ gap: 32, alignItems: 'start' }}
      >

        {/* Left — collage */}
        <div style={{
          position: 'relative',
          background: '#F4ECD8', border: '3px solid #0A0A0A',
          padding: 12, transform: 'rotate(-1deg)',
          boxShadow: '8px 8px 0 #D4FF3E',
        }}>
          {/* Tape */}
          <span aria-hidden style={{
            position: 'absolute', top: -14, left: '30%',
            width: 140, height: 28,
            background: 'rgba(212,255,62,.5)',
            transform: 'rotate(-3deg)', display: 'block',
          }} />

          {/* Customer show photo */}
          <div style={{ width: '100%', aspectRatio: '4/3', background: '#1A2E1F', overflow: 'hidden', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/customer-show.jpg"
              alt="Clientes Glory Hair — Customer Show"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>

          {/* stamp-go */}
          <div style={{
            position: 'absolute', bottom: -14, right: 24,
            background: '#FF7A1A', color: '#0A0A0A',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 12px', border: '2px solid #0A0A0A',
            transform: 'rotate(-4deg)',
          }}>
            #GLORYHAIRGANG
          </div>
        </div>

        {/* Right — testimonials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: '#F4ECD8', color: '#0A0A0A',
              padding: 18, border: '3px solid #0A0A0A',
              transform: `rotate(${t.rotate})`,
              boxShadow: `4px 4px 0 ${t.shadow}`,
            }}>
              <p style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 18, lineHeight: 1.3 }}>
                {t.parts[0]}
                <em style={{ fontFamily: 'var(--font-yeseva-one),serif', fontStyle: 'italic', color: '#FF7A1A' }}>
                  {t.parts[1]}
                </em>
                {t.parts[2]}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, letterSpacing: '0.06em', color: '#5e6a64' }}>
                  — {t.author} · {t.location}
                </span>
                <span style={{ color: '#FF7A1A', fontSize: 14, letterSpacing: '0.1em' }} aria-label="5 étoiles sur 5">
                  ★★★★★
                </span>
              </div>
            </div>
          ))}

          <Link
            href="/avis"
            style={{
              fontFamily: 'var(--font-rubik-mono-one),sans-serif',
              fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase',
              border: '3px solid #0A0A0A', padding: '14px 22px',
              background: '#FF7A1A', color: '#0A0A0A',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              textDecoration: 'none', boxShadow: '6px 6px 0 #0A0A0A',
              marginTop: 8, alignSelf: 'flex-start',
            }}
          >
            → Voir tous les avis (12 482)
          </Link>
        </div>
      </div>
    </section>
  );
}
