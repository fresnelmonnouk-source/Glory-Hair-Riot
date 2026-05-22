import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Back-office · Glory Hair RIOT',
  description: 'Administration Glory Hair RIOT — Issue N°01.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#1A2E1F',
    }}>
      <AdminSidebar />
      <div style={{ flex: 1, minWidth: 0, padding: '24px 32px 60px' }}>
        {children}
      </div>
    </div>
  );
}
