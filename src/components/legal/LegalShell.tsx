import type { ReactNode } from 'react';

/* Coquille partagée par les 3 pages légales (mentions légales, CGV,
   confidentialité) — même vocabulaire visuel que l'article de magazine
   (max-w-[760px], eyebrow+display, paragraphes espacés). Les sections
   elles-mêmes (h2/p/ul) viennent de chaque page comme enfants simples :
   sélecteurs Tailwind sur les enfants directs plutôt que d'imposer un
   sous-composant par bloc, pour rester du HTML sémantique ordinaire. */
export function LegalShell({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px] px-6 py-12 md:px-11 md:py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-3 text-3xl text-ink md:text-4xl">{title}</h1>
      <p className="mt-2 text-xs text-faint">{updated}</p>
      <div className="mt-8 [&>h2]:mt-10 [&>h2]:font-display [&>h2]:text-xl [&>h2]:text-ink [&>h2:first-of-type]:mt-0 [&>p]:mt-4 [&>p]:leading-relaxed [&>p]:text-muted [&>ul]:mt-4 [&>ul]:list-disc [&>ul]:space-y-1.5 [&>ul]:pl-5 [&>ul]:leading-relaxed [&>ul]:text-muted">
        {children}
      </div>
    </article>
  );
}

/** Valeur d'un champ d'identité légale, ou bandeau "à compléter" si absent (jamais de valeur inventée). */
export function LegalField({ value, missingLabel }: { value: string | null; missingLabel: string }) {
  if (value) return <>{value}</>;
  return <span className="italic text-faint">{missingLabel}</span>;
}
