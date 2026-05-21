'use client';

import { Orb } from '@/components/shared/Orb';

const ARTICLES = [
  { t: "5 textures pour l'été", c: 'Tendances', i: 'var(--hair-4)', s: 'curly' },
  { t: 'Trouver sa morphologie', c: 'Guide',    i: 'var(--hair-2)', s: 'wavy' },
  { t: "L'entretien d'une lace front", c: 'Soin', i: 'var(--hair-1)', s: 'long' },
];

export function JournalPage() {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-eyebrow">Journal</div>
          <h2>Conseils &amp; <span className="italic" style={{ color: 'var(--gold-deep)' }}>inspirations</span></h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {ARTICLES.map((p) => (
          <article key={p.t} style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 24, border: '1px solid var(--line-soft)' }}>
            <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'var(--bg-warm)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '60%' }}>
                <Orb color={p.i} shape={p.s as any} />
              </div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 6 }}>{p.c}</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, letterSpacing: '-.01em' }}>{p.t}</h3>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>5 min de lecture</div>
          </article>
        ))}
      </div>
    </section>
  );
}
