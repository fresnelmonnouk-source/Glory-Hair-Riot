import { HTMLAttributes } from 'react';

type StampColor = 'lime' | 'orange' | 'pink';

interface StampProps extends HTMLAttributes<HTMLDivElement> {
  color?: StampColor;
  rotate?: number;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<StampColor, string> = {
  lime:   'border-lime text-lime',
  orange: 'border-orange text-orange',
  pink:   'border-pink text-pink',
};

const sizeMap = {
  sm: 'px-3 py-1 text-xs border-2',
  md: 'px-4 py-2 text-sm border-[3px]',
  lg: 'px-6 py-3 text-base border-4',
};

export function Stamp({ color = 'lime', rotate = -8, size = 'md', className = '', style, children, ...props }: StampProps) {
  return (
    <div
      className={[
        'inline-flex items-center justify-center',
        'font-["Special_Elite"] uppercase tracking-widest',
        'opacity-90',
        colorMap[color],
        sizeMap[size],
        className,
      ].join(' ')}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      aria-hidden
      {...props}
    >
      {children}
    </div>
  );
}
