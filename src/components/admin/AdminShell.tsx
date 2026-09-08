'use client';

/* Port structurel 1:1 de sandy-stylish/src/app/(admin)/admin/(protected)/layout.tsx
   (header sticky pleine largeur, puis flex : aside 220px + main max-w-[980px]).
   Drawer mobile conservé (fonctionnalité réelle existante, absente du fichier
   Sandy mais utile pour un back-office consulté depuis un téléphone). */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  return (
    <div className="min-h-full">
      <div className="flex items-stretch border-b border-hairline md:border-b-0">
        <button
          type="button"
          aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
          className="flex w-14 shrink-0 items-center justify-center text-ink md:hidden"
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="min-w-0 flex-1">
          <AdminTopbar />
        </div>
      </div>

      <div className="flex">
        <aside className={`shrink-0 border-r border-hairline px-4 py-8 md:block md:w-[220px] ${drawerOpen ? 'fixed inset-y-0 left-0 z-50 w-[220px] bg-app' : 'hidden'}`}>
          <AdminSidebar />
        </aside>

        {drawerOpen && (
          <div
            role="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}

        <main className="min-w-0 flex-1 px-6 py-10 md:px-10">
          <div className="mx-auto max-w-[980px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
