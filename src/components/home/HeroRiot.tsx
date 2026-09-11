import Link from 'next/link';
import type { Locale } from '@/i18n/config';

/* Port structurel 1:1 du HERO de sandy-stylish/src/app/(site)/[lang]/page.tsx
   (grid 2 col, eyebrow + display h1 + CTA primaire+lien texte, 2 plaques
   photo superposées à droite) — photos wigs au lieu de bijoux/parfum. */

export function HeroRiot({ lang }: { lang: Locale }) {
  return (
    <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
      <div>
        <p className="eyebrow">Été 2026 · Nouvelle collection</p>
        <h1 className="display mt-6 text-[2rem] leading-[1.06] text-ink sm:text-[2.75rem] md:text-[68px]">
          Votre beauté,
          <br />
          votre couronne.
        </h1>
        <p className="mt-8 max-w-[440px] leading-relaxed text-muted">
          6 perruques en cheveux humains 100% Remy, et un essayage virtuel photo-réaliste
          par IA, sans overlay 3D approximatif.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href={`/${lang}/essayage`}
            className="inline-flex items-center gap-2 rounded-[2px] bg-accent px-7 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            Essayer en direct
            <span aria-hidden>→</span>
          </Link>
          <Link
            href={`/${lang}/catalogue`}
            className="text-sm text-ink underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 transition-colors hover:text-accent"
          >
            Voir le catalogue
          </Link>
        </div>
      </div>

      <div aria-hidden className="relative hidden h-[540px] md:block">
        <div className="absolute right-0 top-0 h-[470px] w-[66%] overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ginger.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 h-[300px] w-[44%] overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/bordeaux.jpg" alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
