import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--forest)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 40,
          textDecoration: 'none',
          color: 'var(--lime)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-anton)', fontSize: 28, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Glory Hair
        </span>
        <span style={{ fontFamily: 'var(--font-special-elite)', fontSize: 10, color: 'var(--paper)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          RIOT
        </span>
      </Link>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--forest-light)',
          border: '2px solid var(--ink)',
          boxShadow: 'var(--shadow-riot)',
          padding: '40px 36px',
        }}
      >
        {children}
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--paper)', opacity: 0.3, textAlign: 'center', fontFamily: 'var(--font-special-elite)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Glory Hair RIOT · Issue N°01 · © 2026
      </p>
    </div>
  );
}
