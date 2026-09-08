/* Port structurel 1:1 de sandy-stylish/src/components/site/reassurance-bar.tsx */

type Item = { t: string; d: string; icon: 'truck' | 'shield' | 'camera' | 'chat' };

function Icon({ name }: { name: Item['icon'] }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'truck':
      return <svg {...common}><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>;
    case 'shield':
      return <svg {...common}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'camera':
      return <svg {...common}><path d="M4 7h4l2-2h4l2 2h4v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10h8M8 13h5" /></svg>;
  }
}

const ITEMS: Item[] = [
  { t: 'Livraison rapide', d: '48h en France métropolitaine', icon: 'truck' },
  { t: 'Essai virtuel offert', d: '1 essai IA gratuit par appareil', icon: 'camera' },
  { t: 'Authenticité garantie', d: '100% cheveux humains Remy', icon: 'shield' },
  { t: 'Conseil sur mesure', d: 'Élodie vous guide', icon: 'chat' },
];

export function ReassuranceBar({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted">
        {ITEMS.map((it) => (
          <li key={it.t} className="flex items-center gap-2">
            <span className="text-accent"><Icon name={it.icon} /></span>
            <span className="text-ink">{it.t}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="border-y border-hairline bg-surface/50">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-6 px-6 py-8 md:grid-cols-4 md:px-11">
        {ITEMS.map((it) => (
          <div key={it.t} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-accent"><Icon name={it.icon} /></span>
            <div>
              <p className="text-sm text-ink">{it.t}</p>
              <p className="text-xs text-faint">{it.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
