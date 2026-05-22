'use client';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <AdminPageHeader
        title="Produits"
        accent="duits"
        sub={`// ${items.length} perruque${items.length > 1 ? 's' : ''}`}
      />

      <div style={{
        background: '#F4ECD8', color: '#0A0A0A',
        border: '3px solid #0A0A0A', padding: 18,
        boxShadow: '4px 4px 0 #FF7A1A',
      }}>
        {listQ.isLoading ? (
          <div style={emptyStyle}>Chargement…</div>
        ) : items.length === 0 ? (
          <div style={emptyStyle}>Aucun produit.</div>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-special-elite),monospace', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px dashed #0A0A0A' }}>
                <Th>Nom</Th>
                <Th>Cat.</Th>
                <Th align="right">Prix (€)</Th>
                <Th align="right">Stock</Th>
                <Th align="right">Ventes</Th>
                <Th>Flags</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const dirty = !!editing[p.id] && Object.keys(editing[p.id] ?? {}).length > 0;
                const priceEuros = (editing[p.id]?.base_price ?? p.base_price) / 100;
                const stock = editing[p.id]?.stock_quantity ?? p.stock_quantity;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)' }}>
                    <Td label="Nom">
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#5E6A64' }}>/{p.slug}</div>
                    </Td>
                    <Td label="Catégorie">{p.category ?? '—'}</Td>
                    <Td align="right" label="Prix (€)">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={Math.round(priceEuros)}
                        onChange={(e) => setField(p.id, { base_price: Math.max(0, Math.round(Number(e.target.value)) * 100) })}
                        style={inputStyle}
                      />
                    </Td>
                    <Td align="right" label="Stock">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={stock}
                        onChange={(e) => setField(p.id, { stock_quantity: Math.max(0, Math.round(Number(e.target.value))) })}
                        style={{
                          ...inputStyle,
                          background: stock === 0 ? '#FFD3D3' : '#FAF7F0',
                        }}
                      />
                    </Td>
                    <Td align="right" label="Ventes">
                      <span style={{ fontFamily: 'var(--font-rubik-mono-one),monospace' }}>
                        {p.sales.units}
                      </span>
                    </Td>
                    <Td label="Flags">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => updateM.mutate({ productId: p.id, patch: { active: !p.active } })}
                          style={{
                            ...flagBtn,
                            background: p.active ? '#D4FF3E' : '#F4ECD8',
                          }}
                        >
                          {p.active ? 'ACTIF' : 'INACTIF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateM.mutate({ productId: p.id, patch: { featured: !p.featured } })}
                          style={{
                            ...flagBtn,
                            background: p.featured ? '#FF7A1A' : '#F4ECD8',
                          }}
                        >
                          {p.featured ? '★ TOP' : 'TOP'}
                        </button>
                      </div>
                    </Td>
                    <Td align="right" label="Actions">
                      <button
                        type="button"
                        disabled={!dirty || updateM.isPending}
                        onClick={() => save(p.id)}
                        style={{
                          ...miniBtn,
                          opacity: dirty ? 1 : 0.4,
                          cursor: dirty ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {updateM.isPending ? '…' : 'Save'}
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      textAlign: align ?? 'left',
      padding: '10px 8px',
      fontFamily: 'var(--font-rubik-mono-one),monospace',
      fontSize: 10, letterSpacing: '0.1em',
      color: '#5E6A64', textTransform: 'uppercase',
    }}>{children}</th>
  );
}
function Td({ children, align, label }: { children: React.ReactNode; align?: 'left' | 'right'; label?: string }) {
  return <td data-label={label} style={{ textAlign: align ?? 'left', padding: '10px 8px', verticalAlign: 'middle' }}>{children}</td>;
}
const emptyStyle: React.CSSProperties = {
  textAlign: 'center', padding: '40px 0',
  fontFamily: 'var(--font-special-elite),monospace', color: '#5E6A64',
};
const inputStyle: React.CSSProperties = {
  width: 80,
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 13,
  padding: '4px 6px',
  background: '#FAF7F0',
  border: '2px solid #0A0A0A',
  textAlign: 'right',
};
const miniBtn: React.CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 10, letterSpacing: '0.06em',
  padding: '4px 10px',
  background: '#D4FF3E', color: '#0A0A0A',
  border: '2px solid #0A0A0A',
};
const flagBtn: React.CSSProperties = {
  fontFamily: 'var(--font-rubik-mono-one),monospace',
  fontSize: 9, letterSpacing: '0.08em',
  padding: '3px 8px',
  color: '#0A0A0A',
  border: '2px solid #0A0A0A',
  cursor: 'pointer',
};
