'use client';

/**
 * AdminTopbar — port fidèle <header class="topbar"> Admin.html (711-730)
 * + CSS 146-201.
 *
 * Sticky header avec search (CMD+K) + notifications + aide + CTA.
 */

import { useState, type CSSProperties } from 'react';

export function AdminTopbar() {
  const [search, setSearch] = useState('');

  return (
    <header className="admin-topbar" style={{
      background: '#142A1F',
      borderBottom: '3px solid #FF7A1A',
      padding: '14px 28px',
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 14,
      alignItems: 'center',
      position: 'sticky', top: 0,
      zIndex: 30,
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#0E1B14',
        border: '2px solid #243D29',
        padding: '8px 14px', borderRadius: 999,
        maxWidth: 420,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5E6A64" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher une commande, un produit, un client…"
          aria-label="Recherche back-office"
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 13, color: '#F4ECD8',
          }}
        />
        <kbd style={{
          fontFamily: 'var(--font-vt323),monospace', fontSize: 14,
          background: '#243D29', border: '1px solid #243D29',
          padding: '2px 8px', borderRadius: 4, color: '#5E6A64',
        }}>
          ⌘K
        </kbd>
      </div>

      {/* Notifications + Aide */}
      <div className="admin-topbar-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <TopBtn ariaLabel="Notifications" hasDot>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </TopBtn>
        <TopBtn ariaLabel="Aide">?</TopBtn>
      </div>

      {/* CTA */}
      <button type="button" className="admin-topbar-cta" style={{
        fontFamily: 'var(--font-rubik-mono-one),monospace',
        fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        background: '#FF7A1A', color: '#0A0A0A',
        border: '2px solid #0A0A0A',
        padding: '0 14px', height: 38,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        boxShadow: '3px 3px 0 #D4FF3E',
        transition: 'transform .12s, box-shadow .12s',
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-1px,-1px)';
          e.currentTarget.style.boxShadow = '5px 5px 0 #D4FF3E';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '3px 3px 0 #D4FF3E';
        }}
      >
        + Nouvelle commande
      </button>
    </header>
  );
}

function TopBtn({ children, ariaLabel, hasDot }: {
  children: React.ReactNode; ariaLabel: string; hasDot?: boolean;
}) {
  const style: CSSProperties = {
    width: 38, height: 38, borderRadius: 999,
    border: '2px solid #243D29',
    background: 'transparent', color: '#F4ECD8',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', cursor: 'pointer',
    transition: 'all .15s',
    fontFamily: 'var(--font-rubik-mono-one),monospace', fontSize: 14,
  };
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#D4FF3E';
        e.currentTarget.style.color = '#0A0A0A';
        e.currentTarget.style.borderColor = '#D4FF3E';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#F4ECD8';
        e.currentTarget.style.borderColor = '#243D29';
      }}
    >
      {children}
      {hasDot && (
        <span aria-hidden style={{
          position: 'absolute', top: 6, right: 8,
          width: 10, height: 10, background: '#FF7A1A',
          borderRadius: '50%', border: '2px solid #142A1F',
        }} />
      )}
    </button>
  );
}
