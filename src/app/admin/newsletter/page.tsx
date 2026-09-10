'use client';

/* Page Newsletter IA — vocabulaire visuel identique au reste de l'admin
   (rounded-lg border-hairline bg-surface, eyebrow/display, boutons bg-accent),
   pattern historique paginé calqué sur /admin/commandes. Génération (DeepSeek,
   src/server/services/newsletter/newsletter-gen.ts) + envoi manuel d'un
   brouillon existant, protégé par une confirmation explicite (action à fort
   impact : envoi à toute la liste d'abonnés, difficile à annuler). Le CRON
   hebdomadaire (vercel.json, lundi 8h UTC) génère automatiquement un
   brouillon chaque semaine ; l'envoi automatique reste derrière le flag
   newsletter_auto_send (réglable via /admin/reglages, toggle générique). */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  failed: 'Échec',
};

const STATUS_TONE: Record<string, string> = {
  draft: 'border-hairline text-muted',
  sent: 'border-[color:var(--success)]/50 text-[color:var(--success)]',
  failed: 'border-[color:var(--danger)]/50 text-[color:var(--danger)]',
};

function NewsletterStatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'border-hairline text-muted';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function AdminNewsletterPage() {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const utils = trpc.useUtils();
  const listQ = trpc.admin.listNewsletters.useQuery(
    { limit: PAGE_SIZE, offset },
    { staleTime: 10_000 },
  );

  const generateM = trpc.admin.generateNewsletterDraft.useMutation({
    onSuccess: () => {
      void utils.admin.listNewsletters.invalidate();
    },
  });

  const sendM = trpc.admin.sendNewsletter.useMutation({
    onSuccess: () => {
      void utils.admin.listNewsletters.invalidate();
    },
  });

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSend(id: string, subject: string) {
    const confirmed = window.confirm(
      `Envoyer « ${subject} » à TOUS les abonnés actifs de la newsletter ?\n\nCette action envoie un vrai email et ne peut pas être annulée.`,
    );
    if (!confirmed) return;
    sendM.mutate({ newsletterId: id });
  }

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        sub={`${total} envoi${total > 1 ? 's' : ''} au total · générée chaque lundi par le CRON`}
        actions={
          <button
            type="button"
            disabled={generateM.isPending}
            onClick={() => generateM.mutate()}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:opacity-60"
          >
            {generateM.isPending ? 'Génération…' : 'Générer un brouillon maintenant'}
          </button>
        }
      />

      {generateM.isError && (
        <div className="mt-6 rounded-sm border border-[color:var(--danger)] bg-app px-5 py-3.5 text-sm text-[color:var(--danger)]">
          Échec de la génération : {generateM.error.message}
        </div>
      )}
      {sendM.isError && (
        <div className="mt-6 rounded-sm border border-[color:var(--danger)] bg-app px-5 py-3.5 text-sm text-[color:var(--danger)]">
          Échec de l&apos;envoi : {sendM.error.message}
        </div>
      )}

      <p className="mt-8 eyebrow">Historique</p>

      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                <th className="px-6 py-4 font-normal">Sujet</th>
                <th className="px-4 py-4 font-normal">Statut</th>
                <th className="px-4 py-4 font-normal">Date</th>
                <th className="px-4 py-4 text-right font-normal">Destinataires</th>
                <th className="px-6 py-4 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Aucune newsletter pour l&apos;instant. Le CRON en génère une chaque lundi, ou lance un brouillon maintenant.</td></tr>
              ) : (
                items.map((nl) => (
                  <tr key={nl.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-5 text-sm text-ink">{nl.subject}</td>
                    <td className="px-4 py-5"><NewsletterStatusPill status={nl.status as string} /></td>
                    <td className="px-4 py-5 text-sm text-faint">
                      {new Date((nl.sent_at as string | null) ?? nl.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-5 text-right text-sm text-ink tabular-nums">
                      {nl.status === 'sent' ? (nl.recipients_count ?? 0) : 'n/a'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-4">
                        {nl.status === 'draft' && (
                          <button
                            type="button"
                            disabled={sendM.isPending}
                            onClick={() => handleSend(nl.id as string, nl.subject as string)}
                            className="text-sm text-muted transition-colors hover:text-accent disabled:opacity-40"
                          >
                            Envoyer
                          </button>
                        )}
                        {nl.status === 'failed' && (
                          <span className="text-sm text-faint">Réessayez via un nouveau brouillon</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-sm border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-40">
            ← Précédent
          </button>
          <span className="text-sm text-faint tabular-nums">{page + 1} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages} className="rounded-sm border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)] disabled:cursor-not-allowed disabled:opacity-40">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
