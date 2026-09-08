'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

/* Port structurel 1:1 de sandy-stylish/src/components/site-footer.tsx
   (grid-cols-[1.4fr_repeat(4,1fr)], colonnes eyebrow, bas de page légal) —
   1ère colonne = newsletter (fonctionnalité existante GloryHairRiot,
   Sandy n'en a pas) au lieu du seul texte de marque. */

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Boutique',
    links: [
      { label: 'Catalogue', href: '/catalogue' },
      { label: 'Nouveautés', href: '/catalogue?filtre=nouveautes' },
      { label: 'Conseil Élodie', href: '/elodie' },
    ],
  },
  {
    title: 'La maison',
    links: [
      { label: 'Notre histoire', href: '/sav/atelier' },
      { label: 'Livraison', href: '/sav/livraison' },
      { label: 'Contact', href: '/sav/contact' },
      { label: 'Magazine', href: '/magazine' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { label: "Centre d'aide", href: '/sav' },
      { label: 'FAQ', href: '/sav' },
      { label: 'Essayage virtuel', href: '/essayage' },
      { label: 'Retours', href: '/sav/retours' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Commandes', href: '/compte' },
      { label: 'Favoris', href: '/compte?tab=souhaits' },
      { label: 'Admin', href: '/admin' },
    ],
  },
];

const LEGAL: { label: string; href: string }[] = [
  { label: 'Mentions légales', href: '/sav' },
  { label: 'CGU / CGV', href: '/sav' },
  { label: 'Confidentialité', href: '/sav' },
];

export function FooterRiot() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        setError(json.userMessage ?? 'Erreur. Réessaie.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Connexion impossible. Vérifie ton réseau.');
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
            <p className="font-logo text-2xl tracking-[0.02em] text-ink">Glory Hair</p>
            <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-faint">
              Perruques cheveux humains 100% Remy, tirées à la main dans notre atelier Paris 9.
            </p>
            {submitted ? (
              <p className="mt-4 text-sm text-accent">Inscrit·e ! Merci — à très vite.</p>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 flex max-w-[280px] border-b border-line">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@adresse.email"
                  required
                  aria-label="Adresse email"
                  className="flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-faint"
                />
                <button type="submit" disabled={submitting} className="text-sm text-accent">
                  {submitting ? '…' : "S'inscrire"}
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
          <p>© {year} Glory Hair. Tous droits réservés.</p>
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
