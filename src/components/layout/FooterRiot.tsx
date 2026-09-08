'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const COLS: { title: string; links: Array<{ href: string; label: string }> }[] = [
  {
    title: 'Boutique',
    links: [
      { href: '/catalogue', label: 'Toutes les pièces' },
      { href: '/catalogue?filtre=nouveautes', label: 'Nouveautés' },
      { href: '/catalogue?filtre=best', label: 'Best-sellers' },
      { href: '/catalogue?filtre=limitees', label: 'Éditions limitées' },
      { href: '/sav/cartes-cadeau', label: 'Cartes cadeau' },
    ],
  },
  {
    title: 'Service',
    links: [
      { href: '/essayage', label: 'Essayage virtuel' },
      { href: '/elodie', label: 'Conseil Élodie' },
      { href: '/sav/livraison', label: 'Livraison 48h' },
      { href: '/sav/retours', label: 'Retours 30j' },
      { href: '/sav/garantie', label: 'Garantie 12 mois' },
    ],
  },
  {
    title: 'Maison',
    links: [
      { href: '/sav/atelier', label: 'Atelier Paris 9' },
      { href: '/maison', label: 'Notre histoire' },
      { href: '/magazine', label: 'Magazine' },
      { href: '/sav/presse', label: 'Presse' },
      { href: '/sav/contact', label: 'Contact' },
      { href: '/admin', label: 'Admin (équipe)' },
    ],
  },
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

  return (
    <footer style={{ background: 'var(--bg-deepest)', color: 'var(--text-primary)' }}>
      <div className="mx-auto max-w-[1180px] px-5 pb-8 pt-16">
        <div className="grid grid-cols-1 gap-10 border-b pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]" style={{ borderColor: 'var(--border-hairline)' }}>
          <div>
            <span className="font-logo text-2xl italic" style={{ color: 'var(--text-primary)' }}>Glory Hair</span>
            <p className="mt-4 max-w-[340px] text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Perruques cheveux humains 100% Remy, tirées à la main dans notre atelier Paris 9.
              Recevez nos nouveautés — un mail par mois, promis.
            </p>

            {submitted ? (
              <p className="mt-5 text-sm" style={{ color: 'var(--accent-hi)' }}>
                Inscrit·e ! Merci — à très vite.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 flex max-w-[380px] border" style={{ borderColor: 'var(--border-input)' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@adresse.email"
                  required
                  aria-label="Adresse email"
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 text-sm font-medium"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? '…' : "S'inscrire"}
                </button>
              </form>
            )}
            {error && (
              <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
            )}
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow mb-4" style={{ color: 'var(--text-faint)' }}>{col.title}</h4>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} style={{ color: 'var(--text-muted)' }} className="transition-colors hover:opacity-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-3 pt-6 text-xs" style={{ color: 'var(--text-faint)' }}>
          <span>Glory Hair · Paris · © {new Date().getFullYear()}</span>
          <span>FR / EN</span>
        </div>
      </div>
    </footer>
  );
}
