import Link from 'next/link';

const STATS: { value: string; label: string }[] = [
  { value: '~5s', label: 'Latence de l’essayage IA' },
  { value: '2', label: 'IA en secours automatique' },
  { value: '48h', label: 'Livraison France' },
  { value: '6', label: 'Pièces Issue N°01' },
];

const GALLERY: { src: string; alt: string }[] = [
  { src: '/images/ginger.jpg', alt: 'Perruque Ginger N°03' },
  { src: '/images/argent.jpg', alt: 'Perruque Argent N°05' },
  { src: '/images/velours.jpg', alt: 'Perruque Velours N°01' },
  { src: '/images/bordeaux.jpg', alt: 'Perruque Bordeaux N°04' },
];

export function HeroRiot() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-20 pt-16 md:pt-24">
      <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <p className="eyebrow mb-6">Été 2026 · Nouvelle collection</p>

          <h1 className="display text-[clamp(40px,6vw,68px)]" style={{ color: 'var(--text-primary)' }}>
            Votre beauté,<br />
            <em style={{ color: 'var(--accent)' }}>votre couronne.</em>
          </h1>

          <p className="mt-7 max-w-[460px] text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            6 perruques en cheveux humains 100% Remy, et un essayage virtuel photo-réaliste par IA
            — pas d&apos;overlay 3D approximatif. 1 essai gratuit par appareil, +2 essais offerts à
            l&apos;inscription.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/catalogue"
              className="rounded-sm px-6 py-3 text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              Voir le catalogue
            </Link>
            <Link
              href="/essayage"
              className="rounded-sm border px-6 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            >
              Essayer en direct
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GALLERY.map((img) => (
            <div key={img.src} className="overflow-hidden rounded-sm" style={{ aspectRatio: '4/5', background: 'var(--surface)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-sm border md:grid-cols-4" style={{ borderColor: 'var(--border-hairline)', background: 'var(--border-hairline)' }}>
        {STATS.map((s) => (
          <div key={s.label} className="px-6 py-6" style={{ background: 'var(--bg-body)' }}>
            <div className="display text-3xl" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
