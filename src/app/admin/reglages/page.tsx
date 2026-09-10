'use client';

/* Page Réglages — pas d'équivalent direct chez Sandy à ce stade (son
   /parametres couvre paiement/WhatsApp/légal/pixel, Phase D côté GHR).
   Ici : les feature flags (déjà en base depuis la migration 002, jamais
   exposée en admin avant) + la clé FedaPay (migration 006 — configurable
   depuis l'admin plutôt que figée dans .env.local, sur demande Fresnel).
   Vocabulaire de carte identique au reste de l'admin. */

import { useState } from 'react';
import { Check } from 'lucide-react';
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
          Le mode maintenance est actif : le site public redirige tous les visiteurs vers la page « en maintenance ». Seul l&apos;admin reste accessible.
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
    onSuccess: () => {
      void utils.admin.getPaymentSettings.invalidate();
      setFedaSecretInput('');
      setStripeSecretInput('');
      setStripeWebhookInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [fedaPublicKey, setFedaPublicKey] = useState('');
  const [fedaSecretInput, setFedaSecretInput] = useState('');
  const [fedaEnvironment, setFedaEnvironment] = useState<'live' | 'sandbox'>('live');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretInput, setStripeSecretInput] = useState('');
  const [stripeWebhookInput, setStripeWebhookInput] = useState('');
  const [saved, setSaved] = useState(false);

  // Recopie les réglages serveur dans le formulaire local à chaque nouvelle
  // donnée de requête (chargement initial + refetch après sauvegarde).
  // Ajustement pendant le rendu (plutôt que setState() dans un effet,
  // interdit par le React Compiler) : cf.
  // https://react.dev/learn/you-might-not-need-an-effect
  // #adjusting-some-state-when-a-prop-changes
  const [prevSettingsData, setPrevSettingsData] = useState(settingsQ.data);
  if (settingsQ.data !== prevSettingsData) {
    setPrevSettingsData(settingsQ.data);
    if (settingsQ.data) {
      setFedaPublicKey(settingsQ.data.fedapay_public_key);
      setFedaEnvironment(settingsQ.data.fedapay_environment);
      setStripePublicKey(settingsQ.data.stripe_publishable_key);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveM.mutate({
      fedapay_public_key: fedaPublicKey,
      fedapay_secret_key: fedaSecretInput || undefined,
      fedapay_environment: fedaEnvironment,
      stripe_publishable_key: stripePublicKey,
      stripe_secret_key: stripeSecretInput || undefined,
      stripe_webhook_secret: stripeWebhookInput || undefined,
    });
  }

  return (
    <section>
      <p className="eyebrow">Paiement</p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Clés FedaPay et Stripe branchées ici plutôt que figées dans les variables d&apos;environnement : modifiables sans redéploiement. Le client choisit son mode de paiement (carte, mobile money ou à la livraison) au moment du checkout.
      </p>

      <form onSubmit={handleSave} className="mt-4 flex max-w-xl flex-col gap-8 rounded-lg border border-hairline bg-surface p-6">
        <div className="flex flex-col gap-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">FedaPay (mobile money)</p>

          <div>
            <label htmlFor="fp-env" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Environnement</label>
            <div className="flex gap-2">
              {(['live', 'sandbox'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setFedaEnvironment(env)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${fedaEnvironment === env ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-muted hover:text-ink'}`}
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
              value={fedaPublicKey}
              onChange={(e) => setFedaPublicKey(e.target.value)}
              placeholder="pk_live_..."
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
            />
          </div>

          <div>
            <label htmlFor="fp-secret" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Clé secrète {settingsQ.data?.fedapay_secret_configured && <span className="normal-case text-faint">(déjà configurée : laisser vide pour la conserver)</span>}
            </label>
            <input
              id="fp-secret"
              type="password"
              value={fedaSecretInput}
              onChange={(e) => setFedaSecretInput(e.target.value)}
              placeholder={settingsQ.data?.fedapay_secret_configured ? '••••••••••••••••' : 'sk_live_...'}
              autoComplete="off"
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-hairline pt-6">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">Stripe (carte bancaire)</p>

          <div>
            <label htmlFor="sp-public" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Clé publiable</label>
            <input
              id="sp-public"
              type="text"
              value={stripePublicKey}
              onChange={(e) => setStripePublicKey(e.target.value)}
              placeholder="pk_live_... ou pk_test_..."
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
            />
          </div>

          <div>
            <label htmlFor="sp-secret" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Clé secrète {settingsQ.data?.stripe_secret_configured && <span className="normal-case text-faint">(déjà configurée : laisser vide pour la conserver)</span>}
            </label>
            <input
              id="sp-secret"
              type="password"
              value={stripeSecretInput}
              onChange={(e) => setStripeSecretInput(e.target.value)}
              placeholder={settingsQ.data?.stripe_secret_configured ? '••••••••••••••••' : 'sk_live_... ou sk_test_...'}
              autoComplete="off"
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
            />
          </div>

          <div>
            <label htmlFor="sp-webhook" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Secret webhook {settingsQ.data?.stripe_webhook_secret_configured && <span className="normal-case text-faint">(déjà configuré : laisser vide pour le conserver)</span>}
            </label>
            <input
              id="sp-webhook"
              type="password"
              value={stripeWebhookInput}
              onChange={(e) => setStripeWebhookInput(e.target.value)}
              placeholder={settingsQ.data?.stripe_webhook_secret_configured ? '••••••••••••••••' : 'whsec_...'}
              autoComplete="off"
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saveM.isPending}
          className="inline-flex w-fit items-center gap-2 self-start rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {saveM.isPending ? '…' : saved ? (<><Check size={16} strokeWidth={2.5} /> Enregistré</>) : 'Enregistrer'}
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
