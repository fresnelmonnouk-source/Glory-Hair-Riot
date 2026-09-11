'use client';

/* /sav/contact — formulaire de contact réel (avant : /sav/[...slug] redirigeait
   toutes les sous-routes SAV vers la FAQ, "contact" n'avait jamais de vraie
   page ni de vrai formulaire). Next.js priorise ce segment littéral sur le
   catch-all /sav/[...slug], aucune modification nécessaire de ce côté.
   POST /api/contact (REST, comme /api/newsletter — formulaire public sans
   session) → table `messages` (migration 014) + email admin. */

import { useState } from 'react';
import Link from 'next/link';
import { IconBadge } from '@/components/auth/ui';
import { useLang } from '@/i18n/client';

const INPUT_CLASS =
  'w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-[color:var(--accent)] focus:outline-none';

export default function ContactPage() {
  const lang = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, company }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.userMessage ?? 'Erreur. Réessayez.');
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau.');
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <section className="mx-auto max-w-[560px] px-6 py-16 text-center">
        <IconBadge icon="mail" />
        <h1 className="display mt-6 text-3xl text-ink">Message envoyé.</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Merci, <b className="text-ink">{name}</b> — nous vous répondons sous 24h ouvrées à {email}.
        </p>
        <Link href={`/${lang}/sav`} className="mt-8 inline-flex rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          Retour au SAV
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[560px] px-6 py-12 md:py-16">
      <p className="eyebrow">SAV</p>
      <h1 className="display mt-4 text-4xl text-ink">Nous contacter.</h1>
      <p className="mt-4 leading-relaxed text-muted">Une question, un souci avec votre commande ? Écrivez-nous, nous répondons sous 24h ouvrées.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <input
          type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)}
          className="absolute left-[-9999px]" aria-hidden="true"
        />
        <div className="grid grid-cols-2 gap-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" aria-label="Nom" className={INPUT_CLASS} autoComplete="name" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre email" aria-label="Email" className={INPUT_CLASS} autoComplete="email" />
        </div>
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" aria-label="Sujet" className={INPUT_CLASS} />
        <textarea
          required minLength={10} rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre message" aria-label="Message" className={INPUT_CLASS}
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-sm bg-accent px-6 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {submitting ? 'Envoi…' : 'Envoyer le message'}
        </button>
      </form>
    </section>
  );
}
