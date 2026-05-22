import type { CSSProperties } from 'react';

const italicAccent: CSSProperties = {
  fontFamily: 'var(--font-yeseva-one),serif',
  fontStyle: 'italic', color: '#D4FF3E',
};

/** Header standard pour pages admin (titre punk + sous-titre + actions). */
export function AdminPageHeader({
  title,
  accent,
  sub,
  actions,
}: {
  title: string;
  /** mot mis en italique vert dans le titre (apparait remplacé par <em>). Si absent, tout en blanc. */
  accent?: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  const titleNode = accent
    ? title.split(accent).map((part, i, arr) => (
        <span key={i}>
          {part}
          {i < arr.length - 1 && <em style={italicAccent}>{accent}</em>}
        </span>
      ))
    : title;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      gap: 18, flexWrap: 'wrap',
      borderBottom: '3px dashed #D4FF3E', paddingBottom: 16,
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-anton),Impact,sans-serif',
          fontSize: 'clamp(40px,5vw,68px)',
          lineHeight: 0.95, textTransform: 'uppercase', color: '#F4ECD8',
        }}>
          {titleNode}
          <span style={{
            background: '#FF7A1A', color: '#0A0A0A',
            padding: '0 0.06em', display: 'inline-block',
          }}>.</span>
        </h1>
        {sub && (
          <div style={{
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 11, letterSpacing: '0.1em',
            color: '#5E6A64', marginTop: 6, textTransform: 'lowercase',
          }}>
            {sub}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
