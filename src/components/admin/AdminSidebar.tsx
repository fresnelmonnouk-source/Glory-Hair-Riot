'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CrownMark } from '@/components/shared/CrownMark';
import { signOut } from '@/lib/supabase/client';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Tableau de bord',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/commandes',
    label: 'Commandes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: '/admin/produits',
    label: 'Produits',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    href: '/admin/clients',
    label: 'Clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      padding: '28px 16px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, paddingLeft: 8 }}>
        <CrownMark size={22} />
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>Glory Hair</div>
          <div style={{ fontSize: 10, color: 'var(--gold-deep)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Admin</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--r-sm)',
              textDecoration: 'none',
              color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
              background: isActive ? 'var(--bg)' : 'transparent',
              fontWeight: isActive ? 500 : 400, fontSize: 14,
              transition: 'all .15s',
            }}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-sm)', textDecoration: 'none', color: 'var(--ink-soft)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Retour au site
        </Link>
        <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>
          {userEmail}
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm)',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontSize: 13, color: 'var(--terracotta)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
