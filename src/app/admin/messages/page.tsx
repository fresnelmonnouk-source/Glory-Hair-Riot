'use client';

/* Page Messages admin — remplace le stub catch-all pour /admin/messages
   (routage Next.js : segment littéral prioritaire sur [...slug]). Même
   vocabulaire visuel que /admin/avis (cartes pleines pour la file
   prioritaire, tableau compact pour l'historique).

   Table `messages` créée par la migration 014 (à exécuter manuellement par
   Fresnel dans le Dashboard Supabase avant que cette page puisse charger
   des données réelles — listAll renvoie une erreur tRPC propre en son
   absence, affichée telle quelle plutôt qu'un crash). */

import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const STATUS_LABEL: Record<string, string> = {
  new: 'Nouveau',
  read: 'Lu',
  replied: 'Traité',
};

export default function AdminMessagesPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.messages.listAll.useQuery({ status: 'all', limit: 100 }, { staleTime: 10_000 });

  const updateM = trpc.messages.updateStatus.useMutation({
    onSuccess: () => { void utils.messages.listAll.invalidate(); },
  });

  if (listQ.error) {
    return (
      <div>
        <AdminPageHeader title="Messages" sub="Boîte de réception du formulaire de contact" />
        <div className="mt-8 rounded-lg border border-hairline bg-app p-8 text-center">
          <p className="text-sm text-muted">
            Impossible de charger les messages — la migration <code className="text-ink">014_contact_messages.sql</code> n&apos;a probablement pas encore été appliquée.
          </p>
          <p className="mt-2 text-xs text-faint">{listQ.error.message}</p>
        </div>
      </div>
    );
  }

  const items = listQ.data?.items ?? [];
  const inbox = items.filter((m) => m.status !== 'replied');
  const history = items.filter((m) => m.status === 'replied');

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader title="Messages" sub={`${inbox.length} à traiter · ${items.length} au total`} />

      <section>
        <p className="eyebrow">À traiter ({inbox.length})</p>

        {listQ.isLoading ? (
          <p className="mt-4 text-sm text-muted">Chargement…</p>
        ) : inbox.length === 0 ? (
          <div className="mt-4 rounded-lg border border-hairline bg-app p-8 text-center text-sm text-muted">
            Aucun message en attente.
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {inbox.map((m) => (
              <li key={m.id} className="rounded-lg border border-hairline bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${m.status === 'new' ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint'}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                      <p className="font-display text-lg text-ink">{m.subject}</p>
                    </div>
                    <p className="mt-2 max-w-2xl leading-relaxed text-muted">{m.body}</p>
                    <p className="mt-3 text-xs text-faint">
                      {m.name} · {m.email} · {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      className="rounded-sm border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]"
                    >
                      Répondre
                    </a>
                    {m.status === 'new' && (
                      <button
                        type="button"
                        disabled={updateM.isPending}
                        onClick={() => updateM.mutate({ messageId: m.id, status: 'read' })}
                        className="rounded-sm border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink disabled:opacity-40"
                      >
                        Marquer lu
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updateM.isPending}
                      onClick={() => updateM.mutate({ messageId: m.id, status: 'replied' })}
                      className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-40"
                    >
                      Marquer traité
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="eyebrow">Historique ({history.length})</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-6 py-4 font-normal">Message</th>
                  <th className="px-4 py-4 font-normal">Contact</th>
                  <th className="px-4 py-4 font-normal">Date</th>
                  <th className="px-6 py-4 text-right font-normal" />
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-muted">Aucun message traité pour l&apos;instant.</td></tr>
                ) : (
                  history.map((m) => (
                    <tr key={m.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-4">
                        <div className="text-sm text-ink">{m.subject}</div>
                        <div className="mt-1 line-clamp-1 max-w-[320px] text-sm text-muted">{m.body}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">{m.name} · {m.email}</td>
                      <td className="px-4 py-4 text-sm text-muted">{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={updateM.isPending}
                            onClick={() => updateM.mutate({ messageId: m.id, status: 'new' })}
                            className="text-sm text-faint transition-colors hover:text-ink disabled:opacity-40"
                          >
                            Rouvrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
