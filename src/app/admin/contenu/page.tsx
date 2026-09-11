'use client';

/* Page Magazine admin — remplace le stub catch-all pour /admin/contenu
   (routage Next.js : segment littéral prioritaire sur [...slug]).
   Vocabulaire visuel identique au reste de l'admin (cf. reglages/page.tsx,
   produits/page.tsx) : cartes rounded-lg border-hairline bg-surface,
   bouton principal bg-accent, labels eyebrow/uppercase tracking-wide.

   Génération IA : texte DeepSeek + image de couverture Gemini (best-effort,
   peut prendre 20-60s) — voir src/server/services/articles/article-gen.ts.
   Table `articles` créée par la migration 007 (à exécuter manuellement par
   Fresnel dans le Dashboard Supabase avant que cette page puisse charger
   des données réelles). */

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
};

export default function AdminContenuPage() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listArticles.useQuery({ limit: 50 }, { staleTime: 10_000 });

  const generateM = trpc.admin.generateArticle.useMutation({
    onSuccess: () => {
      void utils.admin.listArticles.invalidate();
      setSubject('');
      setTag('');
    },
  });
  const publishM = trpc.admin.publishArticle.useMutation({
    onSuccess: () => { void utils.admin.listArticles.invalidate(); },
  });
  const unpublishM = trpc.admin.unpublishArticle.useMutation({
    onSuccess: () => { void utils.admin.listArticles.invalidate(); },
  });
  const deleteM = trpc.admin.deleteArticle.useMutation({
    onSuccess: () => { void utils.admin.listArticles.invalidate(); },
  });

  const [subject, setSubject] = useState('');
  const [tag, setTag] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || generateM.isPending) return;
    generateM.mutate({ subject: subject.trim(), tag: tag.trim() || undefined });
  }

  function handleDelete(id: string) {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    deleteM.mutate({ articleId: id }, { onSuccess: () => setConfirmingId(null) });
  }

  const items = listQ.data?.items ?? [];

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader title="Magazine" sub="Articles générés par IA : rédaction, publication, aperçu" />

      <section>
        <p className="eyebrow">Nouvel article</p>
        <form onSubmit={handleGenerate} className="mt-4 flex max-w-xl flex-col gap-5 rounded-lg border border-hairline bg-surface p-6">
          <div>
            <label htmlFor="art-subject" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Sujet de l&apos;article
            </label>
            <input
              id="art-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex. Comment entretenir une perruque body wave en été"
              disabled={generateM.isPending}
              className="w-full rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="art-tag" className="mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Catégorie (optionnel)
            </label>
            <input
              id="art-tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ex. Entretien, Couleur, Tendance"
              disabled={generateM.isPending}
              className="w-full max-w-xs rounded-sm border border-input bg-transparent px-4 py-3 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)] disabled:opacity-60"
            />
          </div>

          {generateM.error && (
            <p className="text-sm text-[color:var(--danger)]">{generateM.error.message}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={generateM.isPending || !subject.trim()}
              className="inline-flex w-fit items-center gap-2 self-start rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generateM.isPending ? 'Génération en cours…' : "Générer l'article"}
            </button>
            {generateM.isPending && (
              <p className="text-xs text-faint">Texte + image de couverture : compte 20 à 60 secondes.</p>
            )}
          </div>
        </form>
      </section>

      <section>
        <p className="eyebrow">Articles ({items.length})</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th className="px-6 py-4 font-normal">Article</th>
                  <th className="px-4 py-4 font-normal">Catégorie</th>
                  <th className="px-4 py-4 font-normal">Statut</th>
                  <th className="px-4 py-4 font-normal">Date</th>
                  <th className="px-6 py-4 text-right font-normal" />
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Chargement…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">Aucun article. Génère le premier ci-dessus.</td></tr>
                ) : (
                  items.map((a) => (
                    <tr key={a.id} className="border-b border-hairline last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {a.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.cover_image_url} alt="" className="h-12 w-12 shrink-0 rounded-sm object-cover" />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-sm bg-app" />
                          )}
                          <div className="min-w-0">
                            <div className="line-clamp-1 font-display text-lg text-ink">{a.title}</div>
                            <div className="mt-0.5 text-xs text-faint">/{a.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">{a.tag ?? 'n/a'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${a.status === 'published' ? 'border-transparent bg-accent text-on-accent' : 'border-hairline text-faint'}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {new Date(a.published_at ?? a.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          {a.status === 'published' && (
                            <Link href={`/fr/magazine/${a.slug}`} target="_blank" className="text-sm text-muted transition-colors hover:text-ink">
                              Aperçu ↗
                            </Link>
                          )}
                          {a.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => unpublishM.mutate({ articleId: a.id })}
                              disabled={unpublishM.isPending}
                              className="text-sm text-muted transition-colors hover:text-ink disabled:opacity-60"
                            >
                              Dépublier
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => publishM.mutate({ articleId: a.id })}
                              disabled={publishM.isPending}
                              className="text-sm text-accent transition-colors hover:text-[color:var(--accent-hi)] disabled:opacity-60"
                            >
                              Publier
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            disabled={deleteM.isPending}
                            className={`text-sm transition-colors disabled:opacity-60 ${confirmingId === a.id ? 'text-[color:var(--danger)]' : 'text-faint hover:text-ink'}`}
                          >
                            {confirmingId === a.id ? 'Confirmer ?' : 'Supprimer'}
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
