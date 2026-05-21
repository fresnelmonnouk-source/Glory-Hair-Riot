import Link from 'next/link';
import { CrownMark } from '@/components/shared/CrownMark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 40,
        textDecoration: 'none',
        color: 'var(--ink)',
      }}>
        <CrownMark size={28} />
        <span style={{ fontFamily: 'var(--f-display)', fontSize: 22, letterSpacing: '-.01em' }}>
          Glory Hair
        </span>
      </Link>

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--line-soft)',
        boxShadow: 'var(--sh-3)',
        padding: '40px 36px',
      }}>
        {children}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center' }}>
        Glory Hair · Perruques premium · © 2026
      </p>
    </div>
  );
}
