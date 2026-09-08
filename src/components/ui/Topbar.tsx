const ITEMS = [
  'Livraison 48h France',
  '1 essai virtuel offert par appareil',
  'Retours sous 30 jours',
  '100% cheveux humains Remy',
];

export function Topbar() {
  return (
    <div
      className="sticky top-0 z-100 border-b"
      style={{ background: 'var(--bg-deepest)', borderColor: 'var(--border-hairline)' }}
    >
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-8 gap-y-1 px-5 py-2 text-center text-[11px] tracking-wide" style={{ color: 'var(--text-faint)' }}>
        {ITEMS.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
