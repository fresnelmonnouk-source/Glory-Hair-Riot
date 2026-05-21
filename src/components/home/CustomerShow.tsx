const TESTIMONIALS = [
  {
    q: 'La qualité est',
    qEm: 'incroyable',
    qEnd: '. Je ne change plus.',
    author: 'Maryline K.',
    location: 'Paris · France',
    stars: '★★★★★',
    rotate: '-1deg',
    shadowColor: '#FF7A1A',
  },
  {
    q: 'L\'essayage virtuel m\'a',
    qEm: 'convaincue',
    qEnd: ' avant même la commande.',
    author: 'Aminata D.',
    location: 'Abidjan · CI',
    stars: '★★★★★',
    rotate: '1.2deg',
    shadowColor: '#D4FF3E',
  },
  {
    q: 'Livraison rapide,',
    qEm: 'perruque parfaite',
    qEnd: '. Que demander de plus ?',
    author: 'Sophie M.',
    location: 'Lyon · France',
    stars: '★★★★★',
    rotate: '-1.4deg',
    shadowColor: '#F5E55E',
  },
];

export function CustomerShow() {
  return (
    <section className="relative px-8 py-20 border-b-2 border-dashed border-orange overflow-hidden">
      {/* Head */}
      <div className="max-w-7xl mx-auto flex justify-between items-end flex-wrap gap-4 mb-8">
        <h2
          className="font-['Anton'] text-paper uppercase leading-[.85]"
          style={{ fontSize: 'clamp(64px, 9vw, 140px)' }}
        >
          Elles ont{' '}
          <span
            className="bg-pink text-ink px-[0.08em] inline-block"
            style={{ transform: 'rotate(-2deg)' }}
          >
            osé.
          </span>
          <br />
          <em
            className="font-['Yeseva_One'] text-orange not-italic"
            style={{ fontStyle: 'italic', fontSize: '0.85em' }}
          >
            À toi.
          </em>
        </h2>
        <p
          className="font-['Caveat'] font-bold text-lime text-[28px] leading-tight max-w-xs"
          style={{ transform: 'rotate(-3deg)' }}
        >
          12 000+ avis<br />5 étoiles
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-[1.4fr_1fr] gap-8 items-start">
        {/* Left — collage */}
        <div
          className="relative bg-paper border-2 border-ink p-4"
          style={{ transform: 'rotate(-1deg)', boxShadow: '8px 8px 0 #D4FF3E' }}
        >
          {/* Tape */}
          <div
            className="absolute top-[-14px] h-7 bg-lime/50"
            style={{ left: '30%', width: 140, transform: 'rotate(-3deg)' }}
          />
          {/* Photo placeholder */}
          <div
            className="w-full aspect-[4/3] bg-forest-light flex items-center justify-center"
          >
            <div className="text-center">
              <p className="font-['Permanent_Marker'] text-paper/30 text-2xl">Photos clients</p>
              <p className="font-['Special_Elite'] text-paper/20 text-xs tracking-widest mt-1">
                À venir
              </p>
            </div>
          </div>
          {/* Bottom stamp */}
          <div
            className="absolute bottom-[-14px] right-6 bg-orange text-ink font-['Rubik_Mono_One'] text-[10px] tracking-[0.1em] uppercase px-3 py-2 border-2 border-ink"
            style={{ transform: 'rotate(-4deg)' }}
          >
            VRAIES CLIENTES
          </div>
        </div>

        {/* Right — testimonials */}
        <div className="flex flex-col gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-paper text-ink p-5 border-2 border-ink"
              style={{
                transform: `rotate(${t.rotate})`,
                boxShadow: `4px 4px 0 ${t.shadowColor}`,
              }}
            >
              <p className="font-['Permanent_Marker'] text-xl leading-tight">
                {t.q}{' '}
                <em className="font-['Yeseva_One'] text-orange not-italic" style={{ fontStyle: 'italic' }}>
                  {t.qEm}
                </em>
                {t.qEnd}
              </p>
              <div className="font-['Special_Elite'] text-xs tracking-[0.06em] mt-2 text-[#5e6a64] flex justify-between items-center">
                <span>— {t.author} · {t.location}</span>
                <span className="text-orange tracking-[0.04em]">{t.stars}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
