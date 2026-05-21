'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CrownMark } from '@/components/shared/CrownMark';
import { signOut } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/compte', label: 'Tableau de bord', exact: true },
  { href: '/compte/commandes', label: 'Mes commandes' },
  { href: '/compte/essayages', label: 'Mes essayages' },
  { href: '/compte/profil', label: 'Mon profil' },
];

export function CompteNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav style={{
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 32, height: 60,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--ink)', flexShrink: 0 }}>
          <CrownMark size={22} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>Glory Hair</span>
        </Link>

        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                padding: '8px 14px',
                borderRadius: 'var(--r-sm)',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                background: isActive ? 'var(--bg)' : 'transparent',
                textDecoration: 'none',
                transition: 'all .15s',
              }}>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{userEmail}</span>
          <button onClick={handleSignOut} style={{
            padding: '7px 14px', borderRadius: 'var(--r-sm)',
            background: 'none', border: '1px solid var(--line)',
            fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer',
          }}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
