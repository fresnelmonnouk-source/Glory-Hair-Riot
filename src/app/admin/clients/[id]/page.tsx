'use client';

/* Page détail client — n'existait pas avant (clients/page.tsx ne faisait que
   lister). Vocabulaire visuel identique au reste de l'admin : cartes
   rounded-lg border-hairline bg-surface, eyebrow/display, pills tier/rôle
   déjà utilisés sur clients/page.tsx. Utilise la nouvelle procédure
   customerDetails (admin.ts) et setUserRole (déjà existante, inchangée —
   garde-fou anti-auto-démote conservé côté serveur). */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/hooks/use-session';
import { OrderStatusPill } from '@/components/admin/ui';

function euros(cents: number | null | undefined) {
  return Math.round((cents ?? 0) / 100).toLocaleString('fr-FR');
}

export default function AdminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { user } = useSession();

  const utils = trpc.useUtils();
  const detailQ = trpc.admin.customerDetails.useQuery({ userId }, { enabled: !!userId });
  const setRoleM = trpc.admin.setUserRole.useMutation({
    onSuccess: () => { void utils.admin.customerDetails.invalidate({ userId }); void utils.admin.listCustomers.invalidate(); },
    onError: (err) => alert(err.message),
  });

  if (detailQ.isLoading) {
    return <p className="py-16 text-center text-muted">Chargement…</p>;
  }

  if (detailQ.error || !detailQ.data) {
    return (
      <div className="mx-auto mt-10 max-w-[480px] rounded-lg border border-hairline bg-app p-10 text-center">
        <p className="eyebrow">Introuvable</p>
        <h1 className="display mt-3 text-3xl text-ink">Client introuvable</h1>
        <p className="mt-3 text-sm text-muted">{detailQ.error?.message ?? "Ce client n'existe pas ou plus."}</p>
        <Link href="/admin/clients" className="mt-6 inline-flex rounded-sm border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]">
          ← Clients
        </Link>
      </div>
    );
  }

  const { profile, orders, tryons } = detailQ.data;
  const isSelf = user?.id === profile.id;

  return (
    <div>
      <Link href="/admin/clients" className="text-sm text-muted transition-colors hover:text-ink">
        ← Clients
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Client</p>
          <h1 className="display mt-1 text-4xl text-ink md:text-5xl">{profile.full_name ?? 'n/a'}</h1>
          <p className="mt-2 text-sm text-faint">{profile.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-hairline px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
            {profile.tier}
          </span>
          <select
            value={profile.role}
            disabled={isSelf || setRoleM.isPending}
            onChange={(e) => {
              const newRole = e.target.value as 'customer' | 'admin' | 'support';
              if (newRole !== profile.role) {
                if (confirm(`Changer le rôle de ${profile.email} vers "${newRole}" ?`)) {
                  setRoleM.mutate({ userId: profile.id, role: newRole });
                }
              }
            }}
            className="rounded-sm border border-input bg-transparent px-3 py-2 text-sm text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="customer">customer</option>
            <option value="support">support</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </div>
      {isSelf && <p className="mt-3 text-xs text-faint">Tu ne peux pas modifier ton propre rôle.</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <p className="eyebrow">Commandes récentes ({orders.length})</p>
            <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                      <th className="px-6 py-4 font-normal">Commande</th>
                      <th className="px-4 py-4 font-normal">Date</th>
                      <th className="px-4 py-4 font-normal">Statut</th>
                      <th className="px-4 py-4 text-right font-normal">Total</th>
                      <th className="px-6 py-4 text-right font-normal" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-muted">Aucune commande.</td></tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-b border-hairline last:border-0">
                          <td className="px-6 py-4 font-display text-base text-ink">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 py-4 text-sm text-faint">
                            {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-4"><OrderStatusPill status={o.status} /></td>
                          <td className="px-4 py-4 text-right text-sm text-accent tabular-nums">{euros(o.total_cents)}€</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/admin/commandes/${o.id}`} className="text-sm text-muted transition-colors hover:text-ink">
                              Voir le détail
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow">Essais virtuels ({tryons.length})</p>
            <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left">
                  <thead>
                    <tr className="border-b border-hairline text-[11px] uppercase tracking-[0.14em] text-faint">
                      <th className="px-6 py-4 font-normal">Produit essayé</th>
                      <th className="px-4 py-4 font-normal">Date</th>
                      <th className="px-4 py-4 font-normal">Partagé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tryons.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-muted">Aucun essai virtuel.</td></tr>
                    ) : (
                      tryons.map((t) => {
                        const wig = Array.isArray(t.wigs) ? t.wigs[0] : t.wigs;
                        return (
                          <tr key={t.id} className="border-b border-hairline last:border-0">
                            <td className="px-6 py-4 text-sm text-ink">{wig?.name ?? 'n/a'}</td>
                            <td className="px-4 py-4 text-sm text-faint">
                              {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </td>
                            <td className="px-4 py-4 text-sm text-faint">
                              {t.shared ? <Check size={14} className="text-success" aria-label="Partagé" /> : <X size={14} className="text-faint" aria-label="Non partagé" />}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="rounded-lg border border-hairline bg-surface p-6">
            <p className="eyebrow">Profil</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Points</dt><dd className="text-ink tabular-nums">{profile.points.toLocaleString('fr-FR')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tier</dt><dd className="text-ink capitalize">{profile.tier}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Inscrit</dt><dd className="text-ink">{new Date(profile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Newsletter</dt><dd>{profile.newsletter ? <Check size={14} className="text-success" /> : <X size={14} className="text-faint" />}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Marketing</dt><dd>{profile.accepts_marketing ? <Check size={14} className="text-success" /> : <X size={14} className="text-faint" />}</dd></div>
            </dl>
          </div>

          {(profile.phone || profile.street_address || profile.city) && (
            <div className="rounded-lg border border-hairline bg-surface p-6">
              <p className="eyebrow">Coordonnées</p>
              <div className="mt-3 space-y-1 text-sm text-muted">
                {profile.phone && <p>{profile.phone}</p>}
                {profile.street_address && <p>{profile.street_address}</p>}
                {(profile.postal_code || profile.city) && <p>{profile.postal_code} {profile.city}</p>}
                {profile.country && <p>{profile.country}</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
