import Link from 'next/link';
import { Topbar } from '@/components/ui/Topbar';

/**
 * Auth layout RIOT — port fidèle <section class="auth"> Riot.html (2756-2813).
 *
 * Affiche le Topbar marquee + une section RIOT centrée avec auth-head
 * (titre + scrawl note) puis le contenu de chaque page (auth-card).
 *
 * Pas de NavRiot/FooterRiot pour rester focus sur l'auth flow.
 * Logo Glory cliquable en haut pour retour home.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <main style={{
        background: '#0E1B14',
        minHeight: '100vh',
        position: 'relative',
      }}>
        {/* Header simple : logo Glory cliquable (compact pour fit-on-screen) */}
        <div style={{
          padding: '16px 32px 0',
          display: 'flex', justifyContent: 'center',
        }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-permanent-marker), cursive',
              fontSize: 28, lineHeight: 1, color: '#F4ECD8',
              transform: 'rotate(-3deg)',
              display: 'inline-flex', alignItems: 'baseline', gap: 8,
              textDecoration: 'none',
            }}
          >
            <span>
              Glory{' '}
              <span
                style={{
                  color: '#FF7A1A',
                  background: '#D4FF3E',
                  padding: '0 6px',
                  display: 'inline-block',
                  transform: 'rotate(2deg)',
                }}
              >
                Hair!
              </span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-special-elite), monospace',
                fontSize: 9, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#D4FF3E',
              }}
            >
              by{' '}
              <em style={{
                fontFamily: 'var(--font-yeseva-one), serif',
                fontStyle: 'italic', color: '#FF7A1A',
              }}>
                RHD
              </em>{' '}
              Empire
            </span>
          </Link>
        </div>

        {children}
      </main>
    </>
  );
}
