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
    <section style={{ padding: '80px 32px', borderBottom: '3px dashed #D4FF3E', overflow: 'hidden', position: 'relative' }}>

      {/* Heading row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <h2 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(64px,9vw,140px)',
          lineHeight: 0.85, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          VRAIES{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            filles,
            <span aria-hidden style={{
              position: 'absolute', left: '-4%', right: '-4%', top: '46%',
              height: 8, background: '#FF7A1A', transform: 'rotate(-2deg)', display: 'block',
            }} />
          </span>
          <br />
          <em style={{
            fontFamily: 'var(--font-yeseva-one),serif',
            fontStyle: 'italic', fontWeight: 400, textTransform: 'none',
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'start' }}>

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

          {/* Photo placeholder */}
          <div style={{ width: '100%', aspectRatio: '4/3', background: '#1A2E1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-permanent-marker),cursive', color: 'rgba(244,236,216,.3)', fontSize: 24 }}>Photos clients</p>
              <p style={{ fontFamily: 'var(--font-special-elite),monospace', color: 'rgba(244,236,216,.2)', fontSize: 11, letterSpacing: '0.12em', marginTop: 4 }}>À venir</p>
            </div>
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
              <div style={{ fontFamily: 'var(--font-special-elite),monospace', fontSize: 11, letterSpacing: '0.06em', marginTop: 8, color: '#5e6a64' }}>
                — {t.author} · {t.location}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
