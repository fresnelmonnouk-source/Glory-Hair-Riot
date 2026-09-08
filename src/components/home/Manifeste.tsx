import Link from 'next/link';

export function Manifeste() {
  return (
    <section className="border-t" style={{ borderColor: 'var(--border-hairline)', background: 'var(--bg-canvas)' }}>
      <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:gap-16">
        <div className="overflow-hidden rounded-sm" style={{ aspectRatio: '4/5', background: 'var(--surface)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ginger.jpg"
            alt="Perruque Ginger — atelier Glory Hair"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div>
          <p className="eyebrow mb-6">Édito — la maison</p>

          <h2 className="display text-[clamp(32px,5vw,52px)]" style={{ color: 'var(--text-primary)' }}>
            Une couronne <em style={{ color: 'var(--accent)' }}>pour chaque visage.</em>
          </h2>

          <p className="mt-6 max-w-[480px] text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Glory Hair, c&apos;est 6 perruques tirées brin par brin dans notre atelier Paris 9.
            Pas de stock anonyme, pas de fibres synthétiques — cheveux humains Remy, calottes
            respirantes, lace front HD.
          </p>

          <p className="mt-4 max-w-[480px] text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Et un essayage virtuel qui marche pour de vrai : IA générative image-to-image (Gemini,
            OpenAI en secours), rendu photo-réaliste en ~5 secondes. 1 essai offert sans création
            de compte, +2 à l&apos;inscription. Vous testez avant d&apos;acheter — la moindre des choses.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/catalogue"
              className="rounded-sm px-6 py-3 text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              Voir le catalogue
            </Link>
            <Link href="/magazine" className="text-sm underline underline-offset-4" style={{ color: 'var(--text-primary)' }}>
              Lire le magazine
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
