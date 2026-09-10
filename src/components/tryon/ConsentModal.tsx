'use client';

/* ConsentModal — Essai Live
 * Réhabillage dans le langage Sandy Stylish (modale de confirmation
 * portée de compte/logout-button.tsx : rounded-lg border-hairline
 * bg-surface, boutons outline/accent). Conforme à systeme.md §9.6 RGPD :
 *   "Votre photo est transmise à Google/OpenAI pour la génération."
 *   Pas d'entraînement modèle (T&C provider).
 *   Droit à l'oubli sur demande.
 */

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onDecline}
    >
      <div
        className="w-full max-w-[520px] rounded-lg border border-hairline bg-surface p-7 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">RGPD</p>
        <h2 id="consent-title" className="display mt-2 text-2xl text-ink md:text-3xl">
          On envoie votre photo à une IA.
        </h2>

        <p className="mt-4 leading-relaxed text-muted">
          Pour générer le rendu photo-réaliste, votre photo et la perruque choisie sont
          transmises à <b className="text-ink">Google Gemini</b> (ou <b className="text-ink">OpenAI</b> en
          backup automatique). Vous validez, ou vous passez votre chemin.
        </p>

        <div className="mt-5 rounded-sm border border-hairline bg-app p-4 text-sm leading-relaxed">
          <p className="font-display text-base text-ink">Ce qu&apos;on fait</p>
          <ul className="mt-2 list-none space-y-1 p-0 text-muted">
            <li>→ Envoi sécurisé (HTTPS) au serveur Glory Hair</li>
            <li>→ Appel API Gemini ou OpenAI côté serveur</li>
            <li>→ Image résultat retournée au navigateur</li>
          </ul>

          <p className="mt-4 font-display text-base text-ink">Ce qu&apos;on ne fait pas</p>
          <ul className="mt-2 list-none space-y-1 p-0 text-muted">
            <li>→ Votre photo ne sert pas à entraîner les IA (T&amp;C provider)</li>
            <li>→ Pas de stockage long terme sans votre accord</li>
            <li>→ Pas de revente, pas de partage</li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-faint">
          Droit à l&apos;oubli : vous pouvez demander la suppression à tout moment depuis
          votre compte (ou par email hello@gloryhair.fr).
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-sm border border-line px-5 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]"
          >
            Non merci
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-[1.4] rounded-sm bg-accent px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            J&apos;accepte · lancer l&apos;essai
          </button>
        </div>
      </div>
    </div>
  );
}
