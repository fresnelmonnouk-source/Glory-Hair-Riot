/* Port structurel 1:1 de sandy-stylish/src/components/auth/ui.tsx +
   auth-shell.tsx + auth-card.tsx (primitives d'auth partagées). */

import type { ReactNode } from 'react';
import { Sparkle } from 'lucide-react';

export const AUTH_INPUT =
  'w-full rounded-sm border border-[color:var(--border-input)] bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-[color:var(--accent)] focus:outline-none';

export function AuthLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-sm border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-sm text-[color:var(--danger)]">
      {children}
    </p>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-sm border border-[color:var(--border-accent)] bg-surface-alt px-3 py-2 text-sm text-muted">
      {children}
    </p>
  );
}

export function IconBadge({ icon, size = 'md' }: { icon: 'check' | 'mail'; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-[92px] w-[92px]' : 'h-16 w-16';
  return (
    <span className={`mx-auto flex ${box} items-center justify-center rounded-full border border-[color:var(--border-accent)] text-accent`} aria-hidden>
      <svg width={size === 'lg' ? 34 : 26} height={size === 'lg' ? 34 : 26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        {icon === 'check' && <path d="M20 6 9 17l-5-5" />}
        {icon === 'mail' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </>
        )}
      </svg>
    </span>
  );
}

/* Écran d'auth « split » (connexion / inscription) : panneau éditorial à
   gauche, carte formulaire à droite. */
export function AuthShell({ eyebrow, title, lead, bullets, children }: {
  eyebrow: string; title: string; lead: string; bullets?: string[]; children: ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-[1180px] gap-10 px-6 py-12 md:grid-cols-2 md:items-center md:gap-16 md:py-20">
      <div className="order-2 md:order-1">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-5 text-[2.75rem] leading-[1.06] text-ink md:text-[3.4rem]">{title}</h1>
        <p className="mt-6 max-w-md leading-relaxed text-muted">{lead}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed text-muted">
                <Sparkle aria-hidden size={13} className="mt-0.5 shrink-0 text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-1 flex md:order-2">
        <div className="w-full rounded-lg border border-hairline bg-surface p-6 md:p-8">{children}</div>
      </div>
    </section>
  );
}

/* Carte d'auth centrée (mot de passe oublié, reset, changement pwd). */
export function AuthCard({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'center' }) {
  return (
    <section className="mx-auto flex max-w-[1180px] justify-center px-6 py-12 md:py-20">
      <div className={`w-full max-w-[480px] rounded-lg border border-hairline bg-surface p-8 md:p-10 ${align === 'center' ? 'text-center' : ''}`}>
        {children}
      </div>
    </section>
  );
}
