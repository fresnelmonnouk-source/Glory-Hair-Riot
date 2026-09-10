'use client';

/* Page détail commande — n'existait pas avant (commandes/page.tsx ne faisait
   que lister). Vocabulaire visuel identique au reste de l'admin : cartes
   rounded-lg border-hairline bg-surface, eyebrow/display, OrderStatusPill
   déjà porté (components/admin/ui.tsx). Utilise la procédure orderDetails
   existante (corrigée : elle référençait des colonnes inexistantes — voir
   commentaire dans admin.ts) et setOrderStatus (déjà existante, inchangée). */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { OrderStatusPill } from '@/components/admin/ui';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};
const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  stripe: 'Carte bancaire (Stripe)',
  fedapay: 'Mobile money (FedaPay)',
  cod: 'Paiement à la livraison',
};
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  succeeded: 'Réglé',
  failed: 'Échoué',
};

type Person = { full_name: string | null; email: string; phone: string | null };
type Wig = { slug: string; name: string };
type OrderDetail = {
  id: string;
  user_id: string | null;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  shipping_method: string | null;
  tracking_number: string | null;
  delivery_name: string | null;
  delivery_street: string | null;
  delivery_city: string | null;
  delivery_postal_code: string | null;
  delivery_country: string | null;
  payment_method: string | null;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  fedapay_transaction_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  users: Person | Person[] | null;
  order_items: {
    id: string;
    wig_id: string;
    variant_id: string | null;
    quantity: number;
    unit_price_cents: number;
    wigs: Wig | Wig[] | null;
  }[];
};

function euros(cents: number | null | undefined) {
  return Math.round((cents ?? 0) / 100).toLocaleString('fr-FR');
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function AdminCommandeDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const utils = trpc.useUtils();
  const detailQ = trpc.admin.orderDetails.useQuery({ orderId }, { enabled: !!orderId });
  const setStatusM = trpc.admin.setOrderStatus.useMutation({
    onSuccess: () => {
      void utils.admin.orderDetails.invalidate({ orderId });
      void utils.admin.listOrders.invalidate();
      void utils.admin.kpis.invalidate();
    },
  });

  if (detailQ.isLoading) {
    return <p className="py-16 text-center text-muted">Chargement…</p>;
  }

  if (detailQ.error || !detailQ.data) {
    return (
      <div className="mx-auto mt-10 max-w-[480px] rounded-lg border border-hairline bg-app p-10 text-center">
        <p className="eyebrow">Introuvable</p>
        <h1 className="display mt-3 text-3xl text-ink">Commande introuvable</h1>
        <p className="mt-3 text-sm text-muted">{detailQ.error?.message ?? "Cette commande n'existe pas ou plus."}</p>
        <Link href="/admin/commandes" className="mt-6 inline-flex rounded-sm border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
          ← Commandes
        </Link>
      </div>
    );
  }

  const o = detailQ.data as unknown as OrderDetail;
  const client = one(o.users);
  const items = o.order_items ?? [];

  return (
    <div>
      <Link href="/admin/commandes" className="text-sm text-muted transition-colors hover:text-ink">
        ← Commandes
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Commande</p>
          <h1 className="display mt-1 text-4xl text-ink md:text-5xl">#{o.id.slice(0, 8).toUpperCase()}</h1>
          <p className="mt-2 text-sm text-faint">
            {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusPill status={o.status} />
          <select
            value={o.status}
            disabled={setStatusM.isPending}
            onChange={(e) => setStatusM.mutate({ orderId: o.id, status: e.target.value as (typeof STATUSES)[number] })}
            className="rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-ink outline-none disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>
      {setStatusM.error && (
        <p className="mt-3 text-sm text-[color:var(--danger)]">{setStatusM.error.message}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <p className="eyebrow">Articles</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                    <th className="px-6 py-4 font-normal">Produit</th>
                    <th className="px-4 py-4 text-right font-normal">Qté</th>
                    <th className="px-4 py-4 text-right font-normal">Prix unit.</th>
                    <th className="px-6 py-4 text-right font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-muted">Aucun article.</td></tr>
                  ) : (
                    items.map((it) => {
                      const wig = one(it.wigs);
                      return (
                        <tr key={it.id} className="border-b border-hairline last:border-0">
                          <td className="px-6 py-4">
                            <div className="font-display text-base text-ink">{wig?.name ?? 'Produit supprimé'}</div>
                            {wig?.slug && <div className="mt-0.5 text-xs text-faint">/{wig.slug}</div>}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-muted tabular-nums">{it.quantity}</td>
                          <td className="px-4 py-4 text-right text-sm text-muted tabular-nums">{euros(it.unit_price_cents)}€</td>
                          <td className="px-6 py-4 text-right text-sm text-ink tabular-nums">{euros(it.unit_price_cents * it.quantity)}€</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-hairline bg-surface p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="text-ink tabular-nums">{euros(o.subtotal_cents)}€</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd className="text-ink tabular-nums">{euros(o.shipping_cents)}€</dd></div>
              {o.discount_cents > 0 && (
                <div className="flex justify-between"><dt className="text-muted">Remise</dt><dd className="text-[color:var(--success)] tabular-nums">-{euros(o.discount_cents)}€</dd></div>
              )}
              <div className="flex justify-between border-t border-hairline pt-2 text-base"><dt className="text-ink">Total</dt><dd className="text-accent tabular-nums">{euros(o.total_cents)}€</dd></div>
            </dl>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="rounded-lg border border-hairline bg-surface p-6">
            <p className="eyebrow">Client</p>
            {client ? (
              <>
                <p className="mt-3 font-display text-lg text-ink">{client.full_name ?? 'n/a'}</p>
                <p className="mt-1 text-sm text-muted">{client.email}</p>
                {client.phone && <p className="mt-1 text-sm text-muted">{client.phone}</p>}
                {o.user_id && (
                  <Link href={`/admin/clients/${o.user_id}`} className="mt-3 inline-block text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)]">
                    Voir la fiche client
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-ink">Commande invitée (sans compte)</p>
                {o.guest_email && <p className="mt-1 text-sm text-muted">{o.guest_email}</p>}
                {o.guest_phone && <p className="mt-1 text-sm text-muted">{o.guest_phone}</p>}
              </>
            )}
          </div>

          <div className="rounded-lg border border-hairline bg-surface p-6">
            <p className="eyebrow">Livraison</p>
            <div className="mt-3 space-y-1 text-sm text-ink">
              <p>{o.delivery_name ?? 'n/a'}</p>
              <p className="text-muted">{o.delivery_street}</p>
              <p className="text-muted">{o.delivery_postal_code} {o.delivery_city}</p>
              <p className="text-muted">{o.delivery_country}</p>
            </div>
            {o.shipping_method && <p className="mt-3 text-xs uppercase tracking-[0.1em] text-faint">{o.shipping_method}</p>}
            {o.tracking_number && <p className="mt-1 text-sm text-muted">Suivi : {o.tracking_number}</p>}
          </div>

          <div className="rounded-lg border border-hairline bg-surface p-6">
            <p className="eyebrow">Paiement</p>
            <p className="mt-3 text-sm text-ink">{o.payment_method ? (PAYMENT_METHOD_LABEL[o.payment_method] ?? o.payment_method) : 'n/a'}</p>
            <p className="mt-1 text-sm text-muted">{PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status}</p>
            {o.stripe_payment_intent_id && <p className="mt-2 break-all text-xs text-faint">Stripe : {o.stripe_payment_intent_id}</p>}
            {o.fedapay_transaction_id && <p className="mt-2 break-all text-xs text-faint">FedaPay : {o.fedapay_transaction_id}</p>}
          </div>

          {o.notes && (
            <div className="rounded-lg border border-hairline bg-surface p-6">
              <p className="eyebrow">Notes</p>
              <p className="mt-3 text-sm text-muted">{o.notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
