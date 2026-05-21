import Link from 'next/link';

const LINKS = [
  { href: '/catalogue',  label: 'Catalogue' },
  { href: '/essayage',   label: 'Essayage IA' },
  { href: '/elodie',     label: 'Chat Élodie' },
  { href: '/sav',        label: 'SAV & FAQ' },
  { href: '/fidelite',   label: 'Glory Club' },
  { href: '/connexion',  label: 'Connexion' },
];

export function FooterRiot() {
  return (
    <footer className="border-t-2 border-ink bg-forest-light mt-24">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div>
            <p className="font-['Anton'] text-3xl text-lime uppercase">Glory Hair</p>
            <p className="font-['Special_Elite'] text-xs text-paper opacity-60 uppercase tracking-widest mt-1">
              Édition RIOT N°01
            </p>
            <p className="font-['Caveat'] text-sm text-paper opacity-50 mt-3 max-w-xs">
              Perruques cheveux humains premium.<br />DIY. Brutal. Sans compromis.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Liens footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2 list-none">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-['Archivo_Black'] text-xs uppercase tracking-widest text-paper opacity-60 hover:opacity-100 hover:text-lime transition-all"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-ink flex flex-col md:flex-row justify-between gap-2">
          <p className="font-['Special_Elite'] text-xs text-paper opacity-40">
            © {new Date().getFullYear()} Glory Hair by RHD Empire
          </p>
          <p className="font-['Special_Elite'] text-xs text-paper opacity-30 uppercase tracking-widest">
            Issue N°01 — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
