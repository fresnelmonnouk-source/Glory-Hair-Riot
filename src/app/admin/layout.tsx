import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';


export const metadata: Metadata = {
  title: 'Back-office · Glory Hair',
  description: 'Administration Glory Hair · Issue N°01.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
