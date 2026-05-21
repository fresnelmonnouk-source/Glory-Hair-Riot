import { HTMLAttributes } from 'react';

interface PolaroidProps extends HTMLAttributes<HTMLDivElement> {
  caption?: string;
  rotate?: number;
  src?: string;
  alt?: string;
}

export function Polaroid({ caption, rotate = -3, src, alt = '', children, className = '', style, ...props }: PolaroidProps) {
  return (
    <div
      className={[
        'inline-block bg-paper border-2 border-ink p-3 pb-8',
        'shadow-[6px_6px_0px_#0A0A0A]',
        className,
      ].join(' ')}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      {...props}
    >
      <div className="bg-forest-light overflow-hidden aspect-square relative min-w-[120px]">
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          children
        )}
      </div>
      {caption && (
        <p className="mt-2 text-center text-ink font-['Caveat'] text-sm leading-none">
          {caption}
        </p>
      )}
    </div>
  );
}
