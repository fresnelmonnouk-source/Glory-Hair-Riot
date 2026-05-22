const ITEMS = [
  '→ ISSUE N°01 →',
  '★',
  'RIOT GIRL · ÉTÉ 2026',
  'LIVRAISON 48H FRANCE',
  '1 ESSAI PREMIUM OFFERT PAR APPAREIL',
  '+2 ESSAIS GRATUITS À LA CRÉATION DE COMPTE',
  '87K+ ESSAYAGES VIRTUELS',
  'RETOUR 30J',
];

export function Topbar() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden
      style={{
        background: '#0A0A0A',
        color: '#D4FF3E',
        padding: '8px 0',
        borderBottom: '3px solid #FF7A1A',
        position: 'sticky',
        top: 0,
        zIndex: 60,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 32,
          whiteSpace: 'nowrap',
          animation: 'marquee 22s linear infinite',
          fontFamily: 'var(--font-vt323), monospace',
          fontSize: 22,
          letterSpacing: '0.04em',
        }}
      >
        {items.map((item, i) => (
          <span key={i} style={{ padding: '0 16px' }}>{item}</span>
        ))}
      </div>
    </div>
  );
}
