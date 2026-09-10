'use client';

/* Port structurel 1:1 de sandy-stylish/.../admin/produits/page.tsx (h1 display +
   table rounded-lg border-hairline bg-surface). Sandy a un CRUD complet (créer/
   éditer/supprimer, filtres publié/brouillon/archivé, upload IA) ; GloryHairRiot
   n'a que l'édition inline (prix/stock) + toggle actif/top sur un catalogue figé
   (wigs-data.ts) — fonctionnalité réelle conservée à l'identique, stylée avec
   le même vocabulaire de table et de pill (actif/inactif) que Sandy. */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

type EditingPatch = {
  base_price?: number;
  stock_quantity?: number;
};

/** Kebab-case ASCII, sans accents — même logique que slugifyTitle côté serveur (admin.ts). */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const emptyForm = {
  name: '',
  slug: '',
  category: '',
  priceEuros: '',
  stock_quantity: '0',
  active: true,
};

export default function AdminProduitsPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listProducts.useQuery({ limit: 50 }, { staleTime: 30_000 });
  const updateM = trpc.admin.updateProduct.useMutation({
    onSuccess: () => { void utils.admin.listProducts.invalidate(); },
  });
  const createM = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      void utils.admin.listProducts.invalidate();
      setForm(emptyForm);
      setSlugTouched(false);
      setFormOpen(false);
    },
  });
  const deleteM = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => { void utils.admin.listProducts.invalidate(); setConfirmingId(null); },
    onError: () => { setConfirmingId(null); },
  });

  const [editing, setEditing] = useState<Record<string, EditingPatch>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  function setField(id: string, patch: EditingPatch) {
    setEditing((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  }
  function save(id: string) {
    const patch = editing[id];
    if (!patch || Object.keys(patch).length === 0) return;
    updateM.mutate({ productId: id, patch }, {
      onSuccess: () => setEditing((s) => { const c = { ...s }; delete c[id]; return c; }),
    });
  }

  function handleDelete(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    deleteM.mutate({ productId: id });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const priceEuros = Number(form.priceEuros);
    if (!form.name.trim() || !form.slug.trim() || !form.category.trim() || !(priceEuros > 0) || createM.isPending) return;
    createM.mutate({
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      base_price: Math.round(priceEuros * 100),
      stock_quantity: Math.max(0, Math.round(Number(form.stock_quantity) || 0)),
      active: form.active,
    });
  }

  const items = listQ.data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Produits"
        sub={`${items.length} perruque${items.length > 1 ? 's' : ''}`}
        actions={
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            {formOpen ? 'Annuler' : '+ Nouveau produit'}
          </button>
        }
      />

      {formOpen && (
        <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-hairline bg-surface p-6">
          <p className="eyebrow">Nouveau produit</p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-name" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Nom
              </label>
              <input
                id="new-name"
                type="text"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                }}
                placeholder="Ex. Miel 18&quot;"
                disabled={createM.isPending}
                className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="new-slug" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Slug
              </label>
              <input
                id="new-slug"
                type="text"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                placeholder="miel-18"
                disabled={createM.isPending}
                className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="new-category" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Catégorie
              </label>
              <input
                id="new-category"
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ex. Wavy, Straight, Body Wave"
                disabled={createM.isPending}
                className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="new-price" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Prix (€)
                </label>
                <input
                  id="new-price"
                  type="number"
                  min={0}
                  step={1}
                  value={form.priceEuros}
                  onChange={(e) => setForm((f) => ({ ...f, priceEuros: e.target.value }))}
                  placeholder="199"
                  disabled={createM.isPending}
                  className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="new-stock" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Stock
                </label>
                <input
                  id="new-stock"
                  type="number"
                  min={0}
                  step={1}
                  value={form.stock_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                  disabled={createM.isPending}
                  className="w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <label className="mt-5 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              disabled={createM.isPending}
              className="h-4 w-4 accent-[color:var(--accent)]"
            />
            Actif dès la création (visible dans le catalogue public)
          </label>

          {createM.error && (
            <p className="mt-4 text-sm text-[color:var(--danger)]">{createM.error.message}</p>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={createM.isPending || !form.name.trim() || !form.slug.trim() || !form.category.trim() || !(Number(form.priceEuros) > 0)}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createM.isPending ? 'Création…' : 'Créer le produit'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-6 py-4 font-normal">Produit</th>
                <th className="px-4 py-4 font-normal">Catégorie</th>
                <th className="px-4 py-4 font-normal">Prix</th>
                <th className="px-4 py-4 font-normal">Stock</th>
                <th className="px-4 py-4 text-right font-normal">Ventes</th>
                <th className="px-4 py-4 font-normal">Statut</th>
                <th className="px-6 py-4 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">Aucun produit.</td></tr>
              ) : (
                items.map((p) => {
                  const dirty = !!editing[p.id] && Object.keys(editing[p.id] ?? {}).length > 0;
                  const priceEuros = (editing[p.id]?.base_price ?? p.base_price) / 100;
                  const stock = editing[p.id]?.stock_quantity ?? p.stock_quantity;
                  return (
                    <tr key={p.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-4">
                        <div className="font-display text-lg text-ink">{p.name}</div>
                        <div className="mt-0.5 text-xs text-faint">/{p.slug}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">{p.category ?? 'n/a'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-ink">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={Math.round(priceEuros)}
                            onChange={(e) => setField(p.id, { base_price: Math.max(0, Math.round(Number(e.target.value)) * 100) })}
                            className="w-20 rounded-sm border border-input bg-transparent px-2 py-1.5 text-right text-sm text-ink outline-none focus:border-[color:var(--accent)]"
                          />
                          <span className="text-faint">€</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={stock}
                          onChange={(e) => setField(p.id, { stock_quantity: Math.max(0, Math.round(Number(e.target.value))) })}
                          className={`w-16 rounded-sm border px-2 py-1.5 text-right text-sm outline-none focus:border-[color:var(--accent)] ${stock === 0 ? 'border-[color:var(--danger)] text-[color:var(--danger)]' : 'border-input text-ink'}`}
                        />
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-muted tabular-nums">{p.sales.units}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => updateM.mutate({ productId: p.id, patch: { active: !p.active } })}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${p.active ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint hover:text-ink'}`}
                          >
                            {p.active ? 'Actif' : 'Inactif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateM.mutate({ productId: p.id, patch: { featured: !p.featured } })}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${p.featured ? 'border-[color:var(--border-accent)] text-accent' : 'border-hairline text-faint hover:text-ink'}`}
                          >
                            Top
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            type="button"
                            disabled={!dirty || updateM.isPending}
                            onClick={() => save(p.id)}
                            className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)] disabled:cursor-not-allowed disabled:text-faint disabled:opacity-60"
                          >
                            {updateM.isPending ? '…' : 'Enregistrer'}
                          </button>
                          <button
                            type="button"
                            disabled={deleteM.isPending}
                            onClick={() => handleDelete(p.id)}
                            className={`text-sm transition-colors disabled:opacity-60 ${confirmingId === p.id ? 'text-[color:var(--danger)]' : 'text-faint hover:text-ink'}`}
                          >
                            {deleteM.isPending && confirmingId === p.id ? '…' : confirmingId === p.id ? 'Confirmer ?' : 'Supprimer'}
                          </button>
                        </div>
                        {deleteM.error && confirmingId === null && deleteM.variables?.productId === p.id && (
                          <p className="mt-2 max-w-[220px] text-right text-xs text-[color:var(--danger)]">{deleteM.error.message}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
