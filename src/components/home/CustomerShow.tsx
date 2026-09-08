import { ButtonLink } from '@/components/ui/Button';

const TESTIMONIALS = [
  { quote: "Le lace est invisible, j'ai eu 3 compliments le 1er jour.", author: 'Naomi', location: 'Paris' },
  { quote: "Essayage virtuel bluffant. J'ai testé 6 modèles avant de choisir.", author: 'Maïmouna', location: 'Lyon' },
  { quote: 'Livré en 48h, qualité au top. Je recommande les yeux fermés.', author: 'Aïcha', location: 'Marseille' },
];

export function CustomerShow() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-[clamp(32px,5vw,52px)]" style={{ color: 'var(--text-primary)' }}>
          Vraies clientes, <em style={{ color: 'var(--accent)' }}>vrais cheveux.</em>
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Taguez @gloryhair pour apparaître</p>
      </div>

      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-start md:gap-16">
        <div className="overflow-hidden rounded-sm" style={{ aspectRatio: '4/5', background: 'var(--surface)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/customer-show.jpg"
            alt="Clientes Glory Hair"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex flex-col gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="rounded-sm border p-6" style={{ borderColor: 'var(--border-card)', background: 'var(--surface)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>“{t.quote}”</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{t.author} · {t.location}</span>
                <span className="text-xs" style={{ color: 'var(--accent-hi)' }} aria-label="5 étoiles sur 5">★★★★★</span>
              </div>
            </div>
          ))}

          <ButtonLink href="/avis" variant="outline" className="mt-1 self-start">
            Voir tous les avis (12 482)
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
