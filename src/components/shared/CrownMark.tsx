'use client';

interface CrownMarkProps {
  size?: number;
  label?: boolean;
}

export function CrownMark({ size = 28, label = true }: CrownMarkProps) {
  return (
    <div className="crown-mark">
      <svg className="crown-svg" width={size} height={size * 0.85} viewBox="0 0 32 28" fill="none">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--gold-light)" />
            <stop offset="0.5" stopColor="var(--gold)" />
            <stop offset="1" stopColor="var(--gold-deep)" />
          </linearGradient>
        </defs>
        <path
          d="M3 23 L3 12 L9 18 L16 4 L23 18 L29 12 L29 23 Z"
          fill="url(#cg)"
          stroke="var(--gold-deep)"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <circle cx="3" cy="11" r="2" fill="url(#cg)" />
        <circle cx="16" cy="3" r="2.2" fill="url(#cg)" />
        <circle cx="29" cy="11" r="2" fill="url(#cg)" />
        <rect x="3" y="23" width="26" height="2.5" rx="1" fill="var(--gold-deep)" />
      </svg>
      {label && (
        <span>
          Glory<span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}> Hair</span>
        </span>
      )}
    </div>
  );
}
