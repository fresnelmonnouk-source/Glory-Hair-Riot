'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'lime' | 'orange' | 'ink' | 'ghost';

interface BtnBoldProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  lime:   'bg-lime text-ink border-ink hover:shadow-[6px_6px_0px_#0A0A0A]',
  orange: 'bg-orange text-ink border-ink hover:shadow-[6px_6px_0px_#0A0A0A]',
  ink:    'bg-ink text-lime border-ink hover:shadow-[6px_6px_0px_#D4FF3E]',
  ghost:  'bg-transparent text-paper border-paper hover:bg-paper hover:text-ink',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const BtnBold = forwardRef<HTMLButtonElement, BtnBoldProps>(
  ({ variant = 'lime', size = 'md', fullWidth, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'font-["Archivo_Black"] uppercase tracking-wide',
          'border-2 shadow-[4px_4px_0px_#0A0A0A]',
          'transition-all duration-100 ease-out',
          'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A0A0A]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BtnBold.displayName = 'BtnBold';
