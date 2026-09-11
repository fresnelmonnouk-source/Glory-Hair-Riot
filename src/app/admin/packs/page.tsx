'use client';

/* Page Packs admin — remplace le stub catch-all pour /admin/packs
   (routage Next.js : segment littéral prioritaire sur [...slug]). Gap #8 de
   l'audit de parité vs Sandy Stylish (packs/bundles, `pack_items` +
   CRUD admin, migration 015). Port du principe de Sandy : un pack est un
   produit comme un autre (ici : wigs.is_pack=true), prix fixé par l'admin
   (jamais calculé depuis les composants), stock indépendant. `pack_items`
   n'est qu'un manifeste de composition affiché sur la fiche produit.

   Une seule page (formulaire + liste), pas de sous-routes /nouveau et
   /[id]/editer comme Sandy — même complexité fonctionnelle, moins de
   fichiers, cohérent avec /admin/messages et /admin/reglages. */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const INPUT_CLASS = 'w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function AdminPacksPage() {
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const packsQ = trpc.admin.listPacks.useQuery(undefined, { staleTime: 10_000 });
  const candidatesQ = trpc.admin.listPackableProducts.useQuery();
  const itemsQ = trpc.admin.getPackItems.useQuery({ packId: editingId ?? '' }, { enabled: !!editingId });

  const invalidateAll = () => {
    void utils.admin.listPacks.invalidate();
    void utils.admin.getPackItems.invalidate();
  };

  const createM = trpc.admin.createProduct.useMutation();
  const updateM = trpc.admin.updateProduct.useMutation();
  const deleteM = trpc.admin.deleteProduct.useMutation({ onSuccess: invalidateAll });
  const setItemsM = trpc.admin.setPackItems.useMutation({ onSuccess: invalidateAll });

  if (packsQ.error) {
    return (
      <div>
        <AdminPageHeader title="Packs" sub="Lots de produits à prix fixe" />
        <div className="mt-8 rounded-lg border border-hairline bg-app p-8 text-center">
          <p className="text-sm text-muted">
            Impossible de charger les packs — la migration <code className="text-ink">015_packs.sql</code> n&apos;a probablement pas encore été appliquée.
          </p>
          <p className="mt-2 text-xs text-faint">{packsQ.error.message}</p>
        </div>
      </div>
    );
  }

  const packs = packsQ.data ?? [];
  const candidates = candidatesQ.data ?? [];

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce pack ?')) return;
    await deleteM.mutateAsync({ productId: id });
    if (editingId === id) setFormOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader title="Packs" sub={`${packs.length} pack${packs.length > 1 ? 's' : ''} · lots à prix fixe`} />
        <button
          type="button"
          onClick={openCreate}
          className="rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
        >
          + Nouveau pack
        </button>
      </div>

      {formOpen && (
        <PackForm
          packId={editingId}
          initial={editingId ? (packs.find((p) => p.id === editingId) as PackRow | undefined) : undefined}
          initialItems={editingId ? ((itemsQ.data ?? []) as unknown as PackItemRow[]) : []}
          candidates={candidates as CandidateRow[]}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); invalidateAll(); }}
          createM={createM}
          updateM={updateM}
          setItemsM={setItemsM}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-6 py-4 font-normal">Pack</th>
                <th className="px-4 py-4 font-normal">Prix</th>
                <th className="px-4 py-4 font-normal">Stock</th>
                <th className="px-4 py-4 font-normal">Statut</th>
                <th className="px-6 py-4 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {packsQ.isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
              ) : packs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Aucun pack créé pour l&apos;instant.</td></tr>
              ) : (
                packs.map((p) => (
                  <tr key={p.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4 text-sm text-ink">{p.name}</td>
                    <td className="px-4 py-4 text-sm text-muted tabular-nums">{(p.base_price / 100).toFixed(2)}€</td>
                    <td className="px-4 py-4 text-sm text-muted tabular-nums">{p.stock_quantity}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${p.active ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint'}`}>
                        {p.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => openEdit(p.id)} className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)]">Éditer</button>
                        <button type="button" onClick={() => handleDelete(p.id)} className="text-sm text-faint transition-colors hover:text-[color:var(--danger)]">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface PackRow { id: string; slug: string; name: string; base_price: number; stock_quantity: number; active: boolean }
interface PackItemRow { wig_id: string; quantity: number; wigs: { name: string; slug: string }[] | null }
interface CandidateRow { id: string; slug: string; name: string }

function PackForm({
  packId, initial, initialItems, candidates, onClose, onSaved, createM, updateM, setItemsM,
}: {
  packId: string | null;
  initial?: PackRow;
  initialItems: PackItemRow[];
  candidates: CandidateRow[];
  onClose: () => void;
  onSaved: () => void;
  createM: ReturnType<typeof trpc.admin.createProduct.useMutation>;
  updateM: ReturnType<typeof trpc.admin.updateProduct.useMutation>;
  setItemsM: ReturnType<typeof trpc.admin.setPackItems.useMutation>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [price, setPrice] = useState(initial ? (initial.base_price / 100).toString() : '');
  const [stock, setStock] = useState(initial?.stock_quantity.toString() ?? '0');
  const [active, setActive] = useState(initial?.active ?? true);
  const [selected, setSelected] = useState<Map<string, number>>(
    new Map(initialItems.map((it) => [it.wig_id, it.quantity])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function toggleCandidate(id: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, 1);
      return next;
    });
  }

  function setQuantity(id: string, qty: number) {
    setSelected((prev) => new Map(prev).set(id, Math.max(1, qty)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceCents = Math.round(parseFloat(price) * 100);
    if (!name.trim() || !slug.trim() || !priceCents || priceCents < 1) {
      setError('Nom, slug et prix (> 0) sont requis.');
      return;
    }

    setSaving(true);
    try {
      let id = packId;
      if (id) {
        await updateM.mutateAsync({ productId: id, patch: { name, base_price: priceCents, stock_quantity: parseInt(stock, 10) || 0, active } });
      } else {
        const created = await createM.mutateAsync({
          slug, name, base_price: priceCents, category: 'Pack',
          stock_quantity: parseInt(stock, 10) || 0, active, is_pack: true,
        });
        id = created.id;
      }
      await setItemsM.mutateAsync({
        packId: id!,
        items: [...selected.entries()].map(([wigId, quantity]) => ({ wigId, quantity })),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-hairline bg-surface p-6">
      <p className="eyebrow">{packId ? 'Éditer le pack' : 'Nouveau pack'}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Nom</label>
          <input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Pack Entretien Complet" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Slug</label>
          <input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} placeholder="pack-entretien-complet" className={INPUT_CLASS} disabled={!!packId} />
        </div>
        <div>
          <label className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Prix (€)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0.01" placeholder="99.00" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Stock</label>
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" step="1" min="0" className={INPUT_CLASS} />
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Actif (visible sur la boutique)
      </label>

      <div>
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Contenu du pack</p>
        <div className="max-h-64 overflow-y-auto rounded-sm border border-hairline">
          {candidates.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Aucun produit disponible.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {candidates.map((c) => {
                const qty = selected.get(c.id);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <label className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-ink">
                      <input type="checkbox" checked={qty !== undefined} onChange={() => toggleCandidate(c.id)} />
                      <span className="truncate">{c.name}</span>
                    </label>
                    {qty !== undefined && (
                      <input
                        type="number" min="1" value={qty}
                        onChange={(e) => setQuantity(c.id, parseInt(e.target.value, 10) || 1)}
                        className="w-16 rounded-sm border border-input bg-transparent px-2 py-1 text-sm text-ink"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
        >
          {saving ? '…' : (<><Check size={16} strokeWidth={2.5} /> Enregistrer</>)}
        </button>
        <button type="button" onClick={onClose} className="rounded-sm border border-line px-6 py-3 text-sm text-muted transition-colors hover:text-ink">
          Annuler
        </button>
      </div>
    </form>
  );
}
