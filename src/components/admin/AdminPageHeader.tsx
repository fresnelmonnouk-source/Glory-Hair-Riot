/* Header standard des pages admin — aligné sur le h1 de
   sandy-stylish/src/app/(admin)/admin/(protected)/page.tsx. */
export function AdminPageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  accent?: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
      <div>
        <h1 className="display text-4xl text-ink md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-faint">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
