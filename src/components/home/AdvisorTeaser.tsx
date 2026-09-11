import Link from 'next/link';
import { WIG_BY_ID } from '@/lib/wigs-data';
import type { Locale } from '@/i18n/config';

/* Port structurel 1:1 de la section "LE CONSEILLER" de sandy-stylish home
   page.tsx (2 col : texte+CTA / mockup conversation) — mappé sur Élodie,
   l'équivalent GloryHairRiot du conseiller IA Sandy Stylish. */

export function AdvisorTeaser({ lang }: { lang: Locale }) {
  const preview = WIG_BY_ID['ginger'];

  return (
    <section className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <p className="eyebrow">Conseil</p>
          <h2 className="display mt-4 max-w-[440px] text-4xl text-ink md:text-5xl">
            Élodie trouve votre perruque idéale.
          </h2>
          <p className="mt-5 max-w-[420px] leading-relaxed text-muted">
            Décrivez ce que vous cherchez : texture, longueur, occasion, et Élodie vous
            recommande les pièces du catalogue qui correspondent vraiment.
          </p>
          <Link
            href={`/${lang}/elodie`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            Discuter avec Élodie
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="rounded-lg border border-hairline bg-surface/60 p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <div className="self-start rounded-full border border-line px-4 py-2 text-sm text-muted">
              Je cherche une perruque bouclée pour l&apos;été
            </div>
            <div className="self-end rounded-full px-4 py-2 text-sm text-on-accent" style={{ background: 'var(--peach)' }}>
              La Ginger devrait vous plaire : wavy, teinte gingembre, lace front HD.
            </div>
            {preview && (
              <div className="mt-2 rounded-md border border-line bg-app p-4">
                <p className="eyebrow">Suggestion</p>
                <p className="mt-2 font-display text-lg text-ink">{preview.name}</p>
                <p className="text-xs text-faint">{preview.style} · {preview.tone}</p>
                <p className="mt-1 text-sm text-accent">{preview.price}€</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
