'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

/* Port structurel 1:1 de sandy-stylish/src/components/site-footer.tsx
   (grid-cols-[1.4fr_repeat(4,1fr)], colonnes eyebrow, bas de page légal) —
   1ère colonne = newsletter (fonctionnalité existante GloryHairRiot,
   Sandy n'en a pas) au lieu du seul texte de marque. `lang`/`dict` reçus
   depuis [lang]/layout.tsx (pattern Sandy, pas de context). */

export function FooterRiot({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Nom de marque admin-éditable (rebrand, Phase 2) — même pattern que
  // NavRiot : repli sur dict.brand tant que non configuré/chargé.
  const brandQ = trpc.siteSettings.getPublic.useQuery(undefined, { staleTime: 60_000 });
  const brandName = brandQ.data?.brand.name ?? dict.brand;

  const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: dict.footer.colBoutique,
      links: [
        { label: dict.nav.catalogue, href: `/${lang}/catalogue` },
        { label: dict.footer.nouveautes, href: `/${lang}/catalogue?filtre=nouveautes` },
        { label: dict.footer.conseilElodie, href: `/${lang}/elodie` },
      ],
    },
    {
      title: dict.footer.colMaison,
      links: [
        { label: dict.footer.notreHistoire, href: `/${lang}/sav/atelier` },
        { label: dict.footer.livraison, href: `/${lang}/sav/livraison` },
        { label: dict.footer.contact, href: `/${lang}/sav/contact` },
        { label: dict.nav.magazine, href: `/${lang}/magazine` },
      ],
    },
    {
      title: dict.footer.colAide,
      links: [
        { label: dict.footer.centreAide, href: `/${lang}/sav` },
        { label: dict.footer.faq, href: `/${lang}/sav` },
        { label: dict.footer.essayageVirtuel, href: `/${lang}/essayage` },
        { label: dict.footer.retours, href: `/${lang}/sav/retours` },
      ],
    },
    {
      title: dict.footer.colCompte,
      links: [
        { label: dict.footer.commandes, href: `/${lang}/compte` },
        { label: dict.nav.favoris, href: `/${lang}/compte?tab=souhaits` },
      ],
    },
  ];

  // TODO Phase 2c (rebrand) : pages légales réelles pas encore construites,
  // ces 3 liens restent sur /sav (FAQ) en attendant, comme avant cette
  // migration i18n — ne pas introduire de lien mort.
  const LEGAL: { label: string; href: string }[] = [
    { label: dict.footer.mentionsLegales, href: `/${lang}/sav` },
    { label: dict.footer.cgv, href: `/${lang}/sav` },
    { label: dict.footer.confidentialite, href: `/${lang}/sav` },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'footer' }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.userMessage ?? 'Erreur. Réessayez.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-inset">
      <div className="mx-auto max-w-[1180px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <p className="font-logo text-2xl tracking-[0.02em] text-ink">{brandName}</p>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-faint">
              {dict.footer.tagline}
            </p>
            {submitted ? (
              <p className="mt-4 text-sm text-accent">{dict.footer.inscrit}</p>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 flex max-w-[280px] border-b border-line">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.footer.emailPlaceholder}
                  required
                  aria-label={dict.footer.emailPlaceholder}
                  className="flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-faint"
                />
                <button type="submit" disabled={submitting} className="text-sm text-accent">
                  {submitting ? '…' : dict.footer.sInscrire}
                </button>
              </form>
            )}
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label + link.href}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-hairline pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {brandName}. {dict.footer.droitsReserves}</p>
          <ul className="flex flex-wrap gap-4">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-muted">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
