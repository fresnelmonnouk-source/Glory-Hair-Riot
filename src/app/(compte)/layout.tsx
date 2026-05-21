import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { CompteNav } from '@/components/compte/CompteNav';

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/connexion');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <CompteNav userEmail={user.email ?? ''} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        {children}
      </main>
    </div>
  );
}
