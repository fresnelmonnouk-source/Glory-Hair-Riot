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

export default function AdminProduitsPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listProducts.useQuery({ limit: 50 }, { staleTime: 30_000 });
  const updateM = trpc.admin.updateProduct.useMutation({
    onSuccess: () => { void utils.admin.listProducts.invalidate(); },
  });

  const [editing, setEditing] = useState<Record<string, EditingPatch>>({});

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

  const items = listQ.data ?? [];

  return (
    <div>
      <AdminPageHeader title="Produits" sub={`${items.length} perruque${items.length > 1 ? 's' : ''}`} />

      <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
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
                      <td className="px-4 py-4 text-sm text-muted">{p.category ?? '—'}</td>
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
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={!dirty || updateM.isPending}
                          onClick={() => save(p.id)}
                          className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)] disabled:cursor-not-allowed disabled:text-faint disabled:opacity-60"
                        >
                          {updateM.isPending ? '…' : 'Enregistrer'}
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
    </div>
  );
}
