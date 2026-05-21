'use client';

import { useState } from 'react';
import { CrownMark } from '@/components/shared/CrownMark';
import type { Route } from '@/types/app';

interface NavbarProps {
  route: Route;
  setRoute: (r: Route) => void;
  wishlistCount: number;
  cartCount: number;
  isLoggedIn: boolean;
  onElodieToggle: () => void;
}

const NAV_LINKS: { id: Route; label: string }[] = [
  { id: 'home', label: 'Maison' },
  { id: 'catalog', label: 'Catalogue' },
  { id: 'tryon', label: 'Essayage virtuel' },
  { id: 'journal', label: 'Journal' },
];

export function Navbar({
  route, setRoute, wishlistCount, cartCount, isLoggedIn, onElodieToggle,
}: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = (r: Route) => { setRoute(r); setDrawerOpen(false); };

  return (
    <>
      <nav className="nav glass">
        <div onClick={() => go('home')} style={{ cursor: 'pointer' }}>
          <CrownMark size={26} />
        </div>

        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.id} className={route === l.id ? 'active' : ''} onClick={() => go(l.id)} style={{ cursor: 'pointer' }}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          {/* Élodie */}
          <button className="icon-btn" onClick={onElodieToggle} title="Élodie">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* Favoris */}
          <button className="icon-btn" onClick={() => go('wishlist')} title="Favoris" style={{ position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={wishlistCount > 0 ? 'var(--terracotta)' : 'none'}
              stroke={wishlistCount > 0 ? 'var(--terracotta)' : 'currentColor'}
              strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && <span className="dot" style={{ background: 'var(--terracotta)' }} />}
          </button>

          {/* Compte */}
          <button className="icon-btn" onClick={() => go('account')} title={isLoggedIn ? 'Mon compte' : 'Se connecter'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={isLoggedIn ? 'var(--gold-deep)' : 'currentColor'} strokeWidth="1.6">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
          </button>

          {/* Panier */}
          <button className="icon-btn" onClick={() => go('cart')} title="Panier" style={{ position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <span className="dot" />}
          </button>

          <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>FR</button>

          {/* Hamburger mobile */}
          <button
            className={`nav-burger ${drawerOpen ? 'open' : ''}`}
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="nav-drawer open">
          <div className="nav-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="nav-drawer-panel">
            {NAV_LINKS.map((l) => (
              <div
                key={l.id}
                className={`nav-drawer-link ${route === l.id ? 'active' : ''}`}
                onClick={() => go(l.id)}
              >
                {l.id === 'tryon' && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', background: 'rgba(92,200,92,.12)', color: '#3a7a32', borderRadius: 999, fontWeight: 600 }}>
                    GRATUIT
                  </span>
                )}
                {l.label}
              </div>
            ))}
            <div className="nav-drawer-divider" />
            <div className="nav-drawer-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => go('account')}>
                {isLoggedIn ? 'Mon compte' : 'Se connecter'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => go('cart')}>
                Panier {cartCount > 0 && `(${cartCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
