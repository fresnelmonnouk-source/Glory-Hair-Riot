import { BtnBold } from '@/components/ui/BtnBold';

function PolaroidFrame({
  caption,
  sub,
  posClass,
  tapeClass,
  bgColor = '#1a1a1a',
}: {
  caption: string;
  sub: string;
  posClass: string;
  tapeClass: string;
  bgColor?: string;
}) {
  return (
    <div
      className={`absolute bg-paper p-3 pb-12 ${posClass}`}
      style={{ filter: 'drop-shadow(4px 6px 0 rgba(0,0,0,.5))' }}
    >
      <div className={`absolute top-[-12px] h-7 w-28 z-10 ${tapeClass}`} />
      <div
        className="aspect-[3/4] relative overflow-hidden"
        style={{ background: bgColor, minWidth: 120 }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>
      <div className="absolute left-3 right-3 bottom-2 font-['Permanent_Marker'] text-lg text-ink leading-tight">
        {caption}
        <small className="block font-['Special_Elite'] text-[11px] tracking-[0.06em] mt-1 text-[#5e6a64]">
          {sub}
        </small>
      </div>
    </div>
  );
}

function StatCard({
  value,
  sup,
  label,
  rotate = '-1deg',
  shadowColor = '#D4FF3E',
}: {
  value: string;
  sup?: string;
  label: string;
  rotate?: string;
  shadowColor?: string;
}) {
  return (
    <div
      className="bg-paper text-ink p-4 pb-5 relative border-2 border-ink"
      style={{ transform: `rotate(${rotate})`, boxShadow: `4px 4px 0 ${shadowColor}` }}
    >
      <div className="font-['Rubik_Mono_One'] text-5xl leading-none tracking-tight">
        {value}
        {sup && <sup className="text-[0.5em]">{sup}</sup>}
      </div>
      <div className="font-['Special_Elite'] text-[11px] tracking-[0.06em] mt-2 text-[#5e6a64]">
        {label}
      </div>
    </div>
  );
}

export function HeroRiot() {
  return (
    <section className="relative px-8 pt-16 pb-20 overflow-hidden border-b-2 border-dashed border-lime">
      <div
        className="absolute top-8 right-8 z-10 font-['Rubik_Mono_One'] text-sm tracking-[0.1em] uppercase text-orange border-2 border-orange px-4 py-2"
        style={{ transform: 'rotate(8deg)', background: 'rgba(14,27,20,.5)' }}
      >
        RIOT · N°01
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-[1.1fr_.9fr] gap-12 items-start relative">
        <div>
          <div
            className="inline-block bg-orange text-ink font-['Rubik_Mono_One'] text-[11px] tracking-[0.18em] uppercase px-3 py-2 mb-6 border-2 border-ink"
            style={{ transform: 'rotate(-2deg)', boxShadow: '3px 3px 0 #D4FF3E' }}
          >
            ★ Été 2026 · Nouvelle collection
          </div>

          <h1
            className="font-['Anton'] text-paper uppercase leading-[.82] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(96px, 14vw, 220px)' }}
          >
            Votre<br />
            <span className="relative inline-block">
              beauté,
              <span
                className="absolute h-2 bg-orange"
                style={{ left: '-4%', right: '-4%', top: '46%', transform: 'rotate(-2deg)' }}
              />
            </span>
            <br />
            <em
              className="not-italic text-paper"
              style={{ fontStyle: 'italic', fontFamily: 'var(--font-yeseva-one)', fontSize: '0.9em' }}
            >
              votre
            </em>
            <br />
            <span
              className="bg-lime text-ink inline-block px-[0.1em]"
              style={{ transform: 'rotate(-1deg)', boxShadow: '6px 6px 0 #FF7A1A' }}
            >
              couronne!
            </span>
          </h1>

          <p className="font-['Special_Elite'] text-lg leading-relaxed max-w-xl text-paper mt-8">
            32 perruques en cheveux humains, photographiées, collées, déchirées — et un essayage
            virtuel <span className="bg-[#F5E55E] text-ink px-1">photo-réaliste IA</span>.{' '}
            <span className="line-through text-white/40 decoration-orange decoration-2">
              Pas de filtre cheap.
            </span>{' '}
            <b className="bg-lime text-ink px-1">2 essais gratuits</b> par appareil,
            ou <b className="bg-orange text-ink px-1">5 essais à l'inscription</b>.
          </p>

          <div className="mt-8 flex gap-4 flex-wrap items-center">
            <BtnBold variant="lime" size="lg" href="/catalogue">→ Voir le catalogue</BtnBold>
            <BtnBold variant="orange" size="lg" href="/essayage">▶ Essayer live</BtnBold>
          </div>
        </div>

        <div className="relative h-[640px]">
          <PolaroidFrame caption="Ginger" sub='22″ · cuivre flame' posClass="top-0 right-20 w-64 z-[3]" tapeClass="left-[60px] bg-lime/70" bgColor="#3d1f0a" />
          <PolaroidFrame caption="Argent" sub='10″ · pixie' posClass="top-28 left-0 w-[200px] z-[2]" tapeClass="left-10 bg-orange/60" bgColor="#2a2a2a" />
          <PolaroidFrame caption="Buns" sub='20″ · space curls' posClass="bottom-0 right-0 w-[220px] z-[4]" tapeClass="right-14 bg-[#F5E55E]/55" bgColor="#1a2a2a" />
          <PolaroidFrame caption="Bordeaux" sub='18″ · vin' posClass="bottom-14 left-10 w-40 z-[1]" tapeClass="left-8 bg-white/18" bgColor="#2a0a0a" />
          <div
            className="absolute top-[-20px] right-[240px] bg-lime text-ink px-3 py-2 font-['Permanent_Marker'] text-sm border-2 border-ink rounded-full z-[7]"
            style={{ transform: 'rotate(-12deg) translateX(-100px)', boxShadow: '2px 3px 0 #0A0A0A' }}
          >
            ★ Nouveau
          </div>
          <div
            className="absolute bottom-[180px] right-[220px] bg-orange text-ink px-3 py-2 font-['Permanent_Marker'] text-sm border-2 border-ink rounded-full z-[7]"
            style={{ transform: 'rotate(8deg)', boxShadow: '2px 3px 0 #0A0A0A' }}
          >
            -20%
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-4 gap-3">
        <StatCard value="87K" sup="+" label="// Essayages" rotate="-1deg" shadowColor="#D4FF3E" />
        <StatCard value="4,9★" label="// 12k avis" rotate="1.5deg" shadowColor="#FF7A1A" />
        <StatCard value="48h" label="// Livraison FR" rotate="-1.5deg" shadowColor="#F5E55E" />
        <StatCard value="32" label="// Pièces" rotate="1deg" shadowColor="#FF4D8D" />
      </div>
    </section>
  );
}
