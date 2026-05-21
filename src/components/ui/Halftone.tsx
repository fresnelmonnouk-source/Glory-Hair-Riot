import { HTMLAttributes } from 'react';

interface HalftoneProps extends HTMLAttributes<HTMLDivElement> {
  dotColor?: string;
  dotSize?: number;
  gap?: number;
  opacity?: number;
}

export function Halftone({
  dotColor = '#0A0A0A',
  dotSize = 1.2,
  gap = 6,
  opacity = 0.08,
  className = '',
  style,
  children,
  ...props
}: HalftoneProps) {
  return (
    <div className={`relative ${className}`} style={style} {...props}>
      {children}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${gap}px ${gap}px`,
          opacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
