import { HTMLAttributes } from 'react';

type TapeColor = 'lime' | 'orange' | 'pink' | 'paper';

interface TapeProps extends HTMLAttributes<HTMLDivElement> {
  color?: TapeColor;
  rotate?: number;
  width?: number;
}

const colorMap: Record<TapeColor, string> = {
  lime:   'bg-lime',
  orange: 'bg-orange',
  pink:   'bg-pink',
  paper:  'bg-paper',
};

export function Tape({ color = 'lime', rotate = -2, width = 80, className = '', style, ...props }: TapeProps) {
  return (
    <div
      className={`absolute h-5 opacity-80 ${colorMap[color]} ${className}`}
      style={{
        width,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
      aria-hidden
      {...props}
    />
  );
}
