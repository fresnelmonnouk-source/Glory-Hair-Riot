'use client';

/* Page Réglages — pas d'équivalent direct chez Sandy à ce stade (son
   /parametres couvre paiement/WhatsApp/légal/pixel, Phase D côté GHR).
   Ici : la seule chose réellement câblée aujourd'hui, les feature flags
   (table `feature_flags`, déjà en base depuis la migration 002, jamais
   exposée en admin jusqu'ici). Vocabulaire de carte identique au reste
   de l'admin. */

import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const FLAG_LABELS: Record<string, string> = {
  tryon: 'Essai virtuel IA',
  elodie: 'Chat Élodie IA',
  newsletter: 'Inscription newsletter',
  fidelite: 'Programme Glory Club',
  maintenance: 'Mode maintenance',
};

export default function AdminReglagesPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listFlags.useQuery(undefined, { staleTime: 10_000 });
  const toggleM = trpc.admin.toggleFlag.useMutation({
    onSuccess: () => { void utils.admin.listFlags.invalidate(); },
  });

  const flags = listQ.data ?? [];
  const maintenanceOn = flags.find((f) => f.key === 'maintenance')?.enabled ?? false;

  return (
    <div>
      <AdminPageHeader title="Réglages" sub="Interrupteurs globaux du site" />

      {maintenanceOn && (
        <div className="mt-8 rounded-sm border border-[color:var(--danger)] bg-app px-5 py-3.5 text-sm text-[color:var(--danger)]">
          Le mode maintenance est actif — le site public redirige tous les visiteurs vers la page « en maintenance ». Seul l&apos;admin reste accessible.
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface">
        {listQ.isLoading ? (
          <p className="px-6 py-10 text-center text-muted">Chargement…</p>
        ) : flags.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">Aucun réglage.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {flags.map((f) => {
              const isMaintenance = f.key === 'maintenance';
              return (
                <li key={f.key} className="flex items-center justify-between gap-6 px-6 py-5">
                  <div className="min-w-0">
                    <p className={`font-display text-lg ${isMaintenance ? 'text-[color:var(--danger)]' : 'text-ink'}`}>
                      {FLAG_LABELS[f.key] ?? f.key}
                    </p>
                    {f.description && <p className="mt-1 text-sm text-faint">{f.description}</p>}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={f.enabled}
                    disabled={toggleM.isPending}
                    onClick={() => toggleM.mutate({ key: f.key, enabled: !f.enabled })}
                    className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50"
                    style={{ background: f.enabled ? (isMaintenance ? 'var(--danger)' : 'var(--accent)') : 'var(--surface-alt)' }}
                  >
                    <span
                      className="absolute top-1 h-5 w-5 rounded-full bg-[color:var(--on-accent)] transition-transform"
                      style={{ transform: f.enabled ? 'translateX(22px)' : 'translateX(4px)' }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
