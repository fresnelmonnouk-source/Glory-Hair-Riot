/* Port structurel 1:1 de sandy-stylish/src/components/admin/ui.tsx (OrderStatusPill) */

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_TONE: Record<string, string> = {
  pending: 'border-hairline text-muted',
  paid: 'border-[color:var(--border-accent)] text-accent',
  shipped: 'border-[color:var(--info)]/50 text-[color:var(--info)]',
  delivered: 'border-[color:var(--success)]/50 text-[color:var(--success)]',
  cancelled: 'border-[color:var(--danger)]/50 text-[color:var(--danger)]',
};

export function OrderStatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'border-hairline text-muted';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
