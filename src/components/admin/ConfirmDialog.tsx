'use client';

/* Boîte de confirmation stylée — remplace les `window.confirm()`/`alert()`
   natifs du navigateur utilisés jusqu'ici pour les actions admin sensibles
   (changement de rôle, annulation de commande, suppression, envoi en masse).
   Demande explicite de Fresnel (2026-09-13) après avoir vu l'écran natif du
   navigateur sur le changement de rôle. */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[440px] rounded-lg border border-hairline bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-medium text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-sm border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-sm px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? 'bg-[color:var(--danger)] text-white hover:opacity-90'
                : 'bg-accent text-on-accent hover:bg-accent-hi'
            }`}
          >
            {pending ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
