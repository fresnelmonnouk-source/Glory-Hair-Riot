import { HTMLAttributes } from 'react';

interface TopbarProps extends HTMLAttributes<HTMLDivElement> {
  items?: string[];
  bg?: string;
  textColor?: string;
  speed?: number;
}

const DEFAULT_ITEMS = [
  'GLORY HAIR RIOT',
  '★ ISSUE N°01',
  'CHEVEUX HUMAINS 100%',
  '★ LIVRAISON EXPRESS',
  'ESSAYAGE VIRTUEL IA',
  '★',
];

export function Topbar({
  items = DEFAULT_ITEMS,
  bg = 'bg-lime',
  textColor = 'text-ink',
  speed = 18,
  className = '',
  style,
  ...props
}: TopbarProps) {
  const repeated = [...items, ...items];

  return (
    <div
      className={`relative overflow-hidden h-8 flex items-center border-b-2 border-ink ${bg} ${textColor} ${className}`}
      style={style}
      aria-hidden
      {...props}
    >
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          width: 'max-content',
        }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className="font-['Special_Elite'] text-xs uppercase tracking-[0.15em] px-6"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
