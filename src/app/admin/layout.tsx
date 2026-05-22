import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export const metadata: Metadata = {
  title: 'Back-office · Glory Hair RIOT',
  description: 'Administration Glory Hair RIOT — Issue N°01.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      minHeight: '100vh',
      background: '#0E1B14',
    }}>
      <AdminSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminTopbar />
        <div style={{ padding: '32px 28px 80px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
