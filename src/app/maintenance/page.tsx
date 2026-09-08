/* Page Maintenance — pas d'équivalent chez Sandy (site entièrement en
   ligne). Réhabillée avec le vocabulaire déjà établi (carte centrée
   rounded-lg border-hairline bg-surface, eyebrow+display) plutôt que
   dans le langage RIOT (stamp/ruban/countdown factice). Page standalone
   (pas de nav/footer) : le but est justement que le reste du site ne
   soit pas accessible pendant la maintenance.
   Le faux countdown ("02:42:18" copié de Riot.html, sans rapport avec
   une vraie fin de maintenance) est retiré — trompeur, ne correspondait
   à rien de réel. Le flag `feature_flags.maintenance` est maintenant
   réellement câblé (src/proxy.ts) : quand il est actif, tout le site
   public redirige ici (sauf /admin, pour pouvoir le désactiver). */

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-body)] px-6 py-16">
      <div className="w-full max-w-[560px] rounded-lg border border-hairline bg-surface p-8 text-center md:p-10">
        <p className="eyebrow">Glory Hair</p>
        <h1 className="display mt-4 text-4xl text-ink md:text-5xl">On revient vite.</h1>
        <p className="mt-5 leading-relaxed text-muted">
          Le site est en pause technique le temps d&apos;une mise à jour. Nos équipes travaillent
          dessus — repassez dans quelques instants.
        </p>

        <div className="mt-8 rounded-sm border border-hairline bg-app px-5 py-4 text-sm leading-relaxed text-muted">
          <p className="text-ink">Une urgence ?</p>
          <p className="mt-2">
            <a href="mailto:hello@gloryhair.fr" className="text-accent underline underline-offset-2 hover:text-[color:var(--accent-hi)]">
              hello@gloryhair.fr
            </a>
            {' · WhatsApp '}
            <a href="https://wa.me/33678123456" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-[color:var(--accent-hi)]">
              +33 6 78 12 34 56
            </a>
          </p>
          <p className="mt-2 text-xs text-faint">Atelier Paris 9 ouvert sur RDV.</p>
        </div>
      </div>
    </main>
  );
}
