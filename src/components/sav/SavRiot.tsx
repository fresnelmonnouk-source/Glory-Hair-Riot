'use client';

/* Réhabillage dans le langage Sandy Stylish (aucun équivalent chez Sandy).
   FAQ en accordéon + cartes d'aide, même vocabulaire que le reste du site
   (rounded-lg border-hairline bg-app). Logique et contenu inchangés. */

import Link from 'next/link';
import { useState } from 'react';

interface FaqItem { q: string; a: React.ReactNode }

const FAQ: FaqItem[] = [
  {
    q: 'Quelle perruque pour mon visage ?',
    a: (
      <>
        Demandez à <b>Élodie</b>, notre styliste IA. Décrivez votre forme de visage, votre
        style et votre budget : elle vous recommande la perruque idéale en quelques
        secondes. Vous pouvez aussi tester en direct avec l&apos;
        <Link href="/essayage" className="underline">essayage virtuel</Link>.
      </>
    ),
  },
  {
    q: "Comment fonctionne l'essayage virtuel ?",
    a: (
      <>
        Vous activez votre caméra ou envoyez une photo. Notre IA (Gemini, OpenAI en backup)
        génère une image photo-réaliste où vous portez la perruque, en ~5 secondes.
        <br /><br />
        <b>1 essai gratuit</b> par appareil (limite anti-abus IP + 30j glissants). Créez un
        compte pour gagner <b>+2 essais Premium</b> offerts (3 au total) + récupérez 1 essai
        bonus tous les 100 pts Glory Club gagnés. Au-delà : <b>4,99€</b> par essai Premium.
      </>
    ),
  },
  {
    q: 'Quel délai de livraison ?',
    a: (
      <>
        <b>France métropole</b> : 48h, livraison offerte. <b>Europe</b> : 3-5 jours ouvrés.
        <b> International</b> : 5-7 jours. Numéro de suivi envoyé par mail dans les 12h après
        commande.
      </>
    ),
  },
  {
    q: 'Puis-je retourner une perruque ?',
    a: (
      <>
        Oui, <b>30 jours</b> pour changer d&apos;avis, retour offert en France. La perruque
        doit être dans son emballage d&apos;origine, non portée, non lavée. Échange ou
        remboursement intégral.
      </>
    ),
  },
  {
    q: 'Comment entretenir ma perruque ?',
    a: (
      <>
        Lavage doux toutes les <b>6 semaines</b> avec un shampoing sans sulfate. Séchage à
        l&apos;air libre, jamais au sèche-cheveux brûlant. Rangement sur un porte-perruque
        pour préserver le brushing.
      </>
    ),
  },
  {
    q: 'La garantie couvre quoi ?',
    a: (
      <>
        <b>12 mois</b> sur la qualité des cheveux et de la calotte. Sont exclus : usure
        normale, coloration maison, coupes non-pro. En cas de souci, la pièce est remplacée
        gratuitement.
      </>
    ),
  },
];

export function SavRiot() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8">
        <h1 className="display text-4xl text-ink md:text-5xl">Aide &amp; SAV</h1>
        <p className="text-sm text-faint">Une question ? On répond en 12h.</p>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => <FaqDetails key={i} item={item} defaultOpen={i === 0} />)}
        </div>

        <div className="flex flex-col gap-6">
          <TrackOrderCard />
          <ContactCard />
          <AtelierCard />
        </div>
      </div>
    </section>
  );
}

function FaqDetails({ item, defaultOpen }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-hairline bg-app">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-lg text-ink">{item.q}</span>
        <span aria-hidden className="shrink-0 text-lg text-accent transition-transform" style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
      </button>
      {open && <div className="border-t border-hairline px-5 py-4 text-sm leading-relaxed text-muted">{item.a}</div>}
    </div>
  );
}

function HelpCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-app p-6">
      <p className="eyebrow">{title}</p>
      {children}
    </div>
  );
}

function TrackOrderCard() {
  const [num, setNum] = useState('');
  const [result, setResult] = useState<string | null>(null);

  function track(e: React.FormEvent) {
    e.preventDefault();
    if (!num.trim()) return;
    setResult(`Commande ${num.toUpperCase()} introuvable. Vérifiez le numéro ou contactez le SAV.`);
    setTimeout(() => setResult(null), 6000);
  }

  return (
    <HelpCard title="Suivi de commande">
      <p className="mt-3 text-sm text-muted">Entrez votre numéro de commande pour voir où en est votre colis.</p>
      <form onSubmit={track} className="mt-3 flex gap-2">
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="GH-14XXXX"
          aria-label="Numéro de commande"
          className="flex-1 rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-faint"
        />
        <button type="submit" className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi">
          →
        </button>
      </form>
      {result && <p className="mt-2 text-xs text-danger">{result}</p>}
    </HelpCard>
  );
}

function ContactCard() {
  return (
    <HelpCard title="Nous contacter">
      <div className="mt-3 space-y-1">
        <InfoRow k="Mail" v="hello@gloryhair.fr" href="mailto:hello@gloryhair.fr" />
        <InfoRow k="Tél" v="+33 1 45 22 18 90" href="tel:+33145221890" />
        <InfoRow k="WhatsApp" v="+33 6 78 12 34 56" href="https://wa.me/33678123456" external />
        <InfoRow k="Élodie" v="Chat 24/7" href="/elodie" />
      </div>
    </HelpCard>
  );
}

function AtelierCard() {
  return (
    <HelpCard title="Atelier Paris 9">
      <p className="mt-3 text-sm text-muted">Sur rendez-vous, du mardi au samedi.</p>
      <div className="mt-3 space-y-1">
        <InfoRow k="Adresse" v="12 rue Notre-Dame-de-Lorette, 75009" />
        <InfoRow k="Métro" v="Saint-Georges (L12)" />
        <InfoRow k="RDV" v="Prendre RDV" href="mailto:hello@gloryhair.fr?subject=RDV%20Atelier%20Paris%209" />
      </div>
    </HelpCard>
  );
}

function InfoRow({ k, v, href, external }: { k: string; v: string; href?: string; external?: boolean }) {
  const value = href ? (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="text-ink underline underline-offset-2">
      {v}
    </a>
  ) : <span className="text-ink">{v}</span>;

  return (
    <div className="flex items-center gap-3 border-t border-hairline py-2 text-sm first:border-t-0">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-faint">{k}</span>
      {value}
    </div>
  );
}
