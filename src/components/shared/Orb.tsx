'use client';

interface OrbProps {
  color?: string;
  shape?: 'round' | 'wavy' | 'curly' | 'long';
  style?: React.CSSProperties;
  className?: string;
  showShadow?: boolean;
  rotation?: number;
}

export function Orb({
  color = 'var(--hair-2)',
  shape = 'round',
  style = {},
  className = '',
  showShadow = true,
  rotation = 0,
}: OrbProps) {
  const orbStyle = {
    '--orb-color': color,
    ...style,
    transform: `rotate(${rotation}deg) ${style.transform || ''}`.trim(),
  } as React.CSSProperties;

  return (
    <div className={`orb ${className}`} style={orbStyle}>
      {showShadow && <div className="orb-shadow"></div>}
      {shape === 'wavy' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            zIndex: 2,
            background: `repeating-radial-gradient(circle at 50% 50%, transparent 0%, transparent 8%, color-mix(in srgb, ${color} 100%, black 15%) 9%, transparent 12%)`,
            mixBlendMode: 'multiply',
            opacity: 0.35,
          }}
        ></div>
      )}
      {shape === 'curly' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            zIndex: 2,
            backgroundImage: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 100%, white 8%) 4%, transparent 5%),
                              radial-gradient(circle at 70% 35%, color-mix(in srgb, ${color} 100%, white 8%) 3%, transparent 4%),
                              radial-gradient(circle at 50% 70%, color-mix(in srgb, ${color} 100%, white 8%) 4%, transparent 5%),
                              radial-gradient(circle at 25% 65%, color-mix(in srgb, ${color} 100%, white 8%) 3%, transparent 4%),
                              radial-gradient(circle at 75% 75%, color-mix(in srgb, ${color} 100%, white 8%) 4%, transparent 5%)`,
            mixBlendMode: 'overlay',
            opacity: 0.7,
          }}
        ></div>
      )}
      {shape === 'long' && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '-5%',
            right: '-5%',
            height: '90%',
            zIndex: 0,
            background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color} 100%, black 30%) 100%)`,
            borderRadius: '20% 20% 35% 35% / 5% 5% 80% 80%',
            filter: `drop-shadow(0 8px 12px rgba(0,0,0,.25))`,
          }}
        ></div>
      )}
      <div className="orb-shine"></div>
    </div>
  );
}
