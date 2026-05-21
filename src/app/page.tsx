export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0E1B14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: '#D4FF3E',
        gap: '1rem',
      }}
    >
      <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#F4ECD8', opacity: 0.6 }}>
        GLORY HAIR — ÉDITION RIOT N°01
      </p>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>
        RIOT
      </h1>
      <p style={{ fontSize: '12px', color: '#F4ECD8', opacity: 0.5 }}>
        Reconstruction en cours — Phase 3
      </p>
    </main>
  );
}
