'use client';

/* Page Promos — remplace le stub catch-all pour /admin/promos (routage
   Next.js : segment littéral prioritaire sur [...slug]). Vocabulaire visuel
   identique au reste de l'admin (cf. produits/page.tsx, contenu/page.tsx) :
   cartes rounded-lg border-hairline bg-surface, bouton principal bg-accent,
   labels eyebrow/uppercase tracking-wide, table + pills de statut.

   Table `discount_codes` créée par la migration 001 (existante) ; la policy
   d'écriture admin (discount_codes_admin_all) arrive avec la migration 009,
   à coller manuellement par Fresnel dans le Dashboard Supabase — tant que
   ce n'est pas fait, la création/modification échoue silencieusement et la
   liste ne montre que les codes publiquement visibles (actifs + dans leur
   fenêtre de validité), cf. rapport de la tâche.

   Suppression : un code avec current_uses > 0 est référencé par des
   commandes réelles (discount_cents figé au moment de l'achat) — le
   supprimer casserait l'historique. deleteDiscountCode désactive à la
   place (même logique de prudence que la suppression de produit ailleurs
   dans ce projet) ; le bouton reflète ce comportement. */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

type DiscountType = 'percentage' | 'fixed';

interface FormState {
  code: string;
  discountType: DiscountType;
  discountValue: string; // % direct, ou € (converti en centimes au submit)
  maxUses: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  active: true,
};

const INPUT_CLASS =
  'w-full rounded-sm border border-input bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60';
const LABEL_CLASS = 'mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted';

function formatValue(discountType: string, discountValue: number): string {
  return discountType === 'percentage' ? `${discountValue}%` : `${(discountValue / 100).toFixed(2)}€`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function AdminPromosPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.discounts.listDiscountCodes.useQuery(undefined, { staleTime: 10_000 });

  const createM = trpc.discounts.createDiscountCode.useMutation({
    onSuccess: () => {
      void utils.discounts.listDiscountCodes.invalidate();
      setForm(EMPTY_FORM);
    },
  });
  const updateM = trpc.discounts.updateDiscountCode.useMutation({
    onSuccess: () => { void utils.discounts.listDiscountCodes.invalidate(); },
  });
  const deleteM = trpc.discounts.deleteDiscountCode.useMutation({
    onSuccess: () => { void utils.discounts.listDiscountCodes.invalidate(); setConfirmingId(null); },
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.discountValue);
    if (!form.code.trim() || !Number.isFinite(value) || value <= 0 || createM.isPending) return;

    createM.mutate({
      code: form.code.trim(),
      discountType: form.discountType,
      discountValue: form.discountType === 'percentage' ? Math.round(value) : Math.round(value * 100),
      maxUses: form.maxUses.trim() ? Math.max(1, Math.round(Number(form.maxUses))) : null,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      active: form.active,
    });
  }

  function handleDelete(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    deleteM.mutate({ id });
  }

  const items = listQ.data ?? [];

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader title="Promos" sub="Codes de réduction : création, activation, historique d'usage" />

      <section>
        <p className="eyebrow">Nouveau code</p>
        <form onSubmit={handleCreate} className="mt-4 flex max-w-2xl flex-col gap-5 rounded-lg border border-hairline bg-surface p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-code" className={LABEL_CLASS}>Code</label>
              <input
                id="promo-code"
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="Ex. GLORY20"
                disabled={createM.isPending}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="promo-type" className={LABEL_CLASS}>Type</label>
              <select
                id="promo-type"
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value as DiscountType)}
                disabled={createM.isPending}
                className={INPUT_CLASS}
              >
                <option value="percentage" className="bg-app text-ink">Pourcentage</option>
                <option value="fixed" className="bg-app text-ink">Montant fixe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-value" className={LABEL_CLASS}>
                Valeur {form.discountType === 'percentage' ? '(%)' : '(€)'}
              </label>
              <input
                id="promo-value"
                type="number"
                min={1}
                max={form.discountType === 'percentage' ? 100 : undefined}
                step={form.discountType === 'percentage' ? 1 : 0.01}
                value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value)}
                placeholder={form.discountType === 'percentage' ? '20' : '15'}
                disabled={createM.isPending}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="promo-max" className={LABEL_CLASS}>Utilisations max (optionnel)</label>
              <input
                id="promo-max"
                type="number"
                min={1}
                step={1}
                value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                placeholder="Illimité"
                disabled={createM.isPending}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-from" className={LABEL_CLASS}>Valide à partir de (optionnel)</label>
              <input
                id="promo-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => set('validFrom', e.target.value)}
                disabled={createM.isPending}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="promo-until" className={LABEL_CLASS}>Valide jusqu&apos;au (optionnel)</label>
              <input
                id="promo-until"
                type="date"
                value={form.validUntil}
                onChange={(e) => set('validUntil', e.target.value)}
                disabled={createM.isPending}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
              disabled={createM.isPending}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Actif dès la création
          </label>

          {createM.error && <p className="text-sm text-[color:var(--danger)]">{createM.error.message}</p>}

          <button
            type="submit"
            disabled={createM.isPending || !form.code.trim() || !form.discountValue}
            className="inline-flex w-fit items-center gap-2 self-start rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createM.isPending ? 'Création…' : 'Créer le code'}
          </button>
        </form>
      </section>

      <section>
        <p className="eyebrow">Codes ({items.length})</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-6 py-4 font-normal">Code</th>
                  <th className="px-4 py-4 font-normal">Valeur</th>
                  <th className="px-4 py-4 font-normal">Utilisations</th>
                  <th className="px-4 py-4 font-normal">Validité</th>
                  <th className="px-4 py-4 font-normal">Statut</th>
                  <th className="px-6 py-4 text-right font-normal" />
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-muted">Aucun code promo. Crée le premier ci-dessus.</td></tr>
                ) : (
                  items.map((d) => {
                    const exhausted = d.max_uses != null && d.current_uses >= d.max_uses;
                    return (
                      <tr key={d.id} className="border-b border-hairline last:border-0">
                        <td className="px-6 py-4">
                          <div className="font-display text-lg text-ink">{d.code}</div>
                          <div className="mt-0.5 text-xs text-faint">{d.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-ink tabular-nums">{formatValue(d.discount_type, d.discount_value)}</td>
                        <td className="px-4 py-4 text-sm tabular-nums">
                          <span className={exhausted ? 'text-[color:var(--danger)]' : 'text-muted'}>
                            {d.current_uses}{d.max_uses != null ? ` / ${d.max_uses}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {d.valid_from || d.valid_until ? `${formatDate(d.valid_from)} → ${formatDate(d.valid_until)}` : 'Sans limite'}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => updateM.mutate({ id: d.id, patch: { active: !d.active } })}
                            disabled={updateM.isPending}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${d.active ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint hover:text-ink'}`}
                          >
                            {d.active ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            disabled={deleteM.isPending}
                            className={`text-sm transition-colors disabled:opacity-60 ${confirmingId === d.id ? 'text-[color:var(--danger)]' : 'text-faint hover:text-ink'}`}
                          >
                            {confirmingId === d.id
                              ? 'Confirmer ?'
                              : d.current_uses > 0 ? 'Désactiver' : 'Supprimer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
