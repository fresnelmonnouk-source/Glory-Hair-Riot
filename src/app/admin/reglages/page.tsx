'use client';

/* Page Réglages — pas d'équivalent direct chez Sandy à ce stade (son
   /parametres couvre paiement/WhatsApp/légal/pixel, Phase D côté GHR).
   Ici : les feature flags (déjà en base depuis la migration 002, jamais
   exposée en admin avant) + la clé FedaPay (migration 006 — configurable
   depuis l'admin plutôt que figée dans .env.local, sur demande Fresnel).
   Vocabulaire de carte identique au reste de l'admin. */

import { useEffect, useState } from 'react';
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
  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader title="Réglages" sub="Interrupteurs globaux et paiement" />
      <FeatureFlagsSection />
      <PaymentSettingsSection />
    </div>
  );
}

function FeatureFlagsSection() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listFlags.useQuery(undefined, { staleTime: 10_000 });
  const toggleM = trpc.admin.toggleFlag.useMutation({
    onSuccess: () => { void utils.admin.listFlags.invalidate(); },
  });

  const flags = listQ.data ?? [];
  const maintenanceOn = flags.find((f) => f.key === 'maintenance')?.enabled ?? false;

  return (
    <section>
      <p className="eyebrow">Interrupteurs</p>

      {maintenanceOn && (
        <div className="mt-4 rounded-sm border border-[color:var(--danger)] bg-app px-5 py-3.5 text-sm text-[color:var(--danger)]">
          Le mode maintenance est actif — le site public redirige tous les visiteurs vers la page « en maintenance ». Seul l&apos;admin reste accessible.
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
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
                  <ToggleSwitch
                    checked={f.enabled}
                    disabled={toggleM.isPending}
                    danger={isMaintenance}
                    onClick={() => toggleM.mutate({ key: f.key, enabled: !f.enabled })}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function PaymentSettingsSection() {
  const utils = trpc.useUtils();
  const settingsQ = trpc.admin.getPaymentSettings.useQuery(undefined, { staleTime: 10_000 });
  const saveM = trpc.admin.savePaymentSettings.useMutation({
    onSuccess: () => { void utils.admin.getPaymentSettings.invalidate(); setSecretInput(''); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const [publicKey, setPublicKey] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'sandbox'>('live');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQ.data) {
      setPublicKey(settingsQ.data.fedapay_public_key);
      setEnvironment(settingsQ.data.fedapay_environment);
    }
  }, [settingsQ.data]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveM.mutate({
      fedapay_public_key: publicKey,
      fedapay_secret_key: secretInput || undefined,
      fedapay_environment: environment,
    });
  }

  return (
    <section>
      <p className="eyebrow">Paiement · FedaPay</p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Clé FedaPay branchée ici plutôt que figée dans les variables d&apos;environnement — modifiable sans redéploiement.
      </p>

      <form onSubmit={handleSave} className="mt-4 flex max-w-xl flex-col gap-5 rounded-lg border border-hairline bg-surface p-6">
        <div>
          <label htmlFor="fp-env" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Environnement</label>
          <div className="flex gap-2">
            {(['live', 'sandbox'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${environment === env ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-muted hover:text-ink'}`}
              >
                {env === 'live' ? 'Production' : 'Test (sandbox)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="fp-public" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Clé publique</label>
          <input
            id="fp-public"
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="pk_live_..."
            className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="fp-secret" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Clé secrète {settingsQ.data?.fedapay_secret_configured && <span className="normal-case text-faint">(déjà configurée — laisser vide pour la conserver)</span>}
          </label>
          <input
            id="fp-secret"
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder={settingsQ.data?.fedapay_secret_configured ? '••••••••••••••••' : 'sk_live_...'}
            autoComplete="off"
            className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={saveM.isPending}
          className="self-start rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {saveM.isPending ? '…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </form>
    </section>
  );
}

function ToggleSwitch({ checked, disabled, danger, onClick }: { checked: boolean; disabled?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? (danger ? 'var(--danger)' : 'var(--accent)') : 'var(--surface-alt)' }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-[color:var(--on-accent)] transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
      />
    </button>
  );
}
