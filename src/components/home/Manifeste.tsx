import { BtnBold } from '@/components/ui/BtnBold';

export function Manifeste() {
  return (
    <section className="relative px-8 py-20 border-b-2 border-orange overflow-hidden">
      <div
        className="absolute top-8 left-[-40px] right-[-40px] font-['Rubik_Mono_One'] text-[42px] text-lime/[0.04] whitespace-nowrap tracking-[0.08em] pointer-events-none select-none"
        aria-hidden
      >
        GLORY GLORY GLORY GLORY GLORY GLORY GLORY
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-[1.1fr_1fr] gap-12 items-start relative">
        <div className="relative h-[480px]">
          <div
            className="absolute top-0 left-0 bg-paper text-ink p-6 z-[3] border-2 border-ink max-w-[280px]"
            style={{ transform: 'rotate(-2deg)', boxShadow: '6px 6px 0 #D4FF3E' }}
          >
            <p className="font-['Permanent_Marker'] text-xl leading-tight">
              « Pas une perruque,<br />une{' '}
              <span className="bg-orange px-1">attitude</span>.»
            </p>
            <small className="font-['Special_Elite'] text-xs tracking-wider block mt-3 text-[#5e6a64]">
              — Édito #01
            </small>
          </div>

          <div
            className="absolute top-20 right-0 bg-paper p-3 pb-10 w-[220px] z-[2]"
            style={{ transform: 'rotate(2deg)', filter: 'drop-shadow(4px 6px 0 rgba(0,0,0,.5))' }}
          >
            <div className="bg-[#1a1a1a] aspect-[3/4] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </div>
            <div className="absolute left-3 right-3 bottom-2 font-['Permanent_Marker'] text-base text-ink">
              Couv. N°01
            </div>
          </div>

          <div
            className="absolute bottom-16 left-8 bg-ink text-lime font-['Rubik_Mono_One'] text-[10px] tracking-[0.12em] uppercase p-3 border-2 border-lime z-[4]"
            style={{ transform: 'rotate(-3deg)' }}
          >
            <b className="block text-base leading-none mb-1">IA · 468 POINTS</b>
            TRACKING TEMPS RÉEL<br />
            FACE MESH HD
            <span className="block text-lime text-lg mt-1">↗</span>
          </div>

          <div
            className="absolute top-[-15px] right-[20%] bg-lime text-ink px-3 py-2 font-['Permanent_Marker'] text-xs border-2 border-ink rounded-full z-[7]"
            style={{ transform: 'rotate(-18deg)', boxShadow: '2px 3px 0 #0A0A0A' }}
          >
            ★ PUNK SINCE 2024
          </div>
        </div>

        <div>
          <div
            className="inline-block font-['Special_Elite'] text-[11px] tracking-[0.2em] uppercase bg-lime text-ink px-3 py-2 mb-5"
            style={{ transform: 'rotate(-2deg)' }}
          >
            ★ Édito #01 — la maison
          </div>

          <h2
            className="font-['Anton'] text-paper uppercase leading-[.85] mb-8"
            style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}
          >
            Une{' '}
            <span
              className="text-lime normal-case inline-block"
              style={{ fontFamily: 'var(--font-permanent-marker)', fontSize: '0.85em', transform: 'rotate(-2deg)' }}
            >
              couronne
            </span>
            <br />
            <span className="relative inline-block">
              pour chaque
              <span
                className="absolute h-2 bg-orange"
                style={{ left: '-2%', right: '-2%', top: '46%', transform: 'rotate(-1deg)' }}
              />
            </span>
            <br />
            <em className="not-italic text-paper" style={{ fontStyle: 'italic', fontFamily: 'var(--font-yeseva-one)' }}>
              visage.
            </em>
          </h2>

          <p className="font-['Special_Elite'] text-paper/80 text-base leading-relaxed mb-5">
            Glory Hair{' '}
            <em className="text-orange not-italic" style={{ fontStyle: 'italic', fontFamily: 'var(--font-yeseva-one)' }}>
              by RHD Empire
            </em>
            , c'est{' '}
            <span className="bg-[#F5E55E] text-ink px-1">32 perruques</span> tirées brin par brin dans
            notre atelier Paris 9. Pas de stock anonyme, pas de fibres synthétiques. Cheveux humains
            Remy, calottes respirantes, lace front HD.
          </p>

          <p className="font-['Special_Elite'] text-paper/80 text-base leading-relaxed mb-8">
            Et un essayage virtuel qui marche pour de vrai :{' '}
            <span className="bg-[#F5E55E] text-ink px-1">468 points faciaux</span>, IA temps réel,
            rendu photo-réaliste.{' '}
            <b className="bg-lime text-ink px-1">2 essais offerts</b> sans création de compte, ou{' '}
            <b className="bg-orange text-ink px-1">5 essais</b> à l'inscription. Vous testez avant
            d'acheter — la moindre des choses.
          </p>

          <div className="flex gap-4 flex-wrap">
            <BtnBold variant="lime" size="lg" href="/catalogue">→ Voir le catalogue</BtnBold>
            <BtnBold variant="ghost" size="lg" href="/catalogue">Lire le mag</BtnBold>
          </div>
        </div>
      </div>
    </section>
  );
}
