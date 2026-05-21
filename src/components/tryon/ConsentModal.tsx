'use client';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-md w-full p-8 border border-line-soft">
        <h2 className="text-2xl font-serif font-normal mb-4">
          Essayage virtuel
        </h2>

        <p className="text-ink-soft mb-6 leading-relaxed">
          L'essayage virtuel utilise votre caméra pour simuler l'apparence des
          perruques. <strong>Vos images ne sont jamais envoyées</strong> — tout
          le traitement se fait localement sur votre appareil, en conformité
          avec le RGPD.
        </p>

        <div className="bg-bg-warm rounded p-4 mb-6 text-sm text-ink-soft space-y-2">
          <p>
            <strong>Ce que nous faisons :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Analyse locale de votre visage (caméra)</li>
            <li>Simulation des perruques en temps réel</li>
            <li>Stockage optionnel du snapshot</li>
          </ul>
          <p className="mt-3">
            <strong>Ce que nous ne faisons pas :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Envoyer vos vidéos</li>
            <li>Stocker vos images sans permission</li>
            <li>Partager vos données</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-3 rounded-lg border border-line-soft hover:bg-bg-deep transition-colors font-semibold"
          >
            Refuser
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 rounded-lg bg-gold text-white hover:shadow-lg transition-all font-semibold"
          >
            J'accepte
          </button>
        </div>

        <p className="text-xs text-ink-mute text-center mt-4">
          Vous pouvez modifier vos préférences de caméra dans les paramètres de
          votre navigateur.
        </p>
      </div>
    </div>
  );
}
