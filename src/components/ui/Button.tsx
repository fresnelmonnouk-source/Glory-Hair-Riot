import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

const SIZE_CLASS: Record<Size, string> = {
  md: 'px-6 py-3 text-sm',
  sm: 'px-4 py-2 text-sm',
};

function variantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: 'var(--accent)', color: 'var(--on-accent)' };
    case 'outline':
      return { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-input)' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--text-primary)' };
  }
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-opacity hover:opacity-90';

export function ButtonLink({
  href, variant = 'primary', size = 'md', className = '', children,
}: {
  href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode;
}) {
  const border = variant === 'outline' ? 'border' : '';
  return (
    <Link href={href} className={`${BASE} ${SIZE_CLASS[size]} ${border} ${className}`} style={variantStyle(variant)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = 'primary', size = 'md', className = '', children, ...rest
}: {
  variant?: Variant; size?: Size; className?: string; children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const border = variant === 'outline' ? 'border' : '';
  return (
    <button className={`${BASE} ${SIZE_CLASS[size]} ${border} ${className}`} style={variantStyle(variant)} {...rest}>
      {children}
    </button>
  );
}
