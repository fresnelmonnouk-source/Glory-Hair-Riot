'use client';

import { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type Variant = 'lime' | 'orange' | 'ink' | 'ghost';

const BASE =
  'inline-flex items-center justify-center font-["Rubik_Mono_One"] uppercase tracking-widest border-2 shadow-[4px_4px_0px_#0A0A0A] transition-all duration-100 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

const VARIANT: Record<Variant, string> = {
  lime:   'bg-lime text-ink border-ink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#FF7A1A]',
  orange: 'bg-orange text-ink border-ink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#D4FF3E]',
  ink:    'bg-ink text-lime border-ink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#D4FF3E]',
  ghost:  'bg-transparent text-paper border-paper hover:bg-paper hover:text-ink',
};

const SIZE = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-4 text-sm',
};

type BaseProps = {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
};

type AsBtnProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type BtnBoldProps = AsBtnProps | AsLinkProps;

function classes(variant: Variant, size: 'sm' | 'md' | 'lg', fullWidth?: boolean, extra = '') {
  return [BASE, VARIANT[variant], SIZE[size], fullWidth ? 'w-full' : '', extra].join(' ');
}

export function BtnBold({ variant = 'lime', size = 'md', fullWidth, className, ...props }: BtnBoldProps) {
  const cls = classes(variant, size, fullWidth, className);

  if ('href' in props && props.href) {
    const { href, ...rest } = props as AsLinkProps;
    return (
      <Link href={href} className={cls} {...(rest as object)}>
        {rest.children}
      </Link>
    );
  }

  const { children, ...rest } = props as AsBtnProps;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
