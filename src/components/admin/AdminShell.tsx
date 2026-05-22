'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

/**
 * AdminShell — wrapper client qui gère le drawer mobile.
 * Desktop : sidebar fixe 240px à gauche.
 * Mobile : sidebar masquée par défaut, drawer overlay via burger.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fermer drawer au changement de route
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll quand drawer ouvert
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  return (
    <div className="admin-shell">
      {/* Sidebar : sticky desktop, drawer mobile */}
      <div className={`admin-sidebar-wrap${drawerOpen ? ' open' : ''}`}>
        <AdminSidebar />
      </div>

      {/* Backdrop mobile */}
      {drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          role="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {/* Burger mobile */}
          <button
            type="button"
            className="admin-burger"
            aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AdminTopbar />
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
