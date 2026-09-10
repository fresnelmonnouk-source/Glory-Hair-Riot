/* /api/cron/expire-orders — CRON Vercel (voir vercel.json).
 *
 * Annule les commandes en ligne (carte/mobile money) abandonnées avant
 * paiement (> 30 min) et restaure le stock immobilisé — sinon perdu
 * indéfiniment, aucun webhook ne se déclenche jamais pour un paiement
 * simplement jamais tenté (fermeture d'onglet, etc.). Le paiement à la
 * livraison est exclu (rien à abandonner en ligne). Port du reaper de
 * Sandy Stylish, cf. migration 013.
 *
 * Auth CRON identique au CRON newsletter : `Authorization: Bearer $CRON_SECRET`,
 * ajouté automatiquement par Vercel Cron Jobs une fois la variable posée.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!expected || authHeader !== `Bearer ${expected}`) {
    console.warn('[cron/expire-orders] accès refusé (CRON_SECRET absent ou incorrect).');
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient(true);

  const { data, error } = await supabase.rpc('expire_stale_orders', {});
  if (error) {
    console.error('[cron/expire-orders] échec:', error.message);
    return NextResponse.json({ error: 'RPC_FAILED', message: error.message }, { status: 500 });
  }

  console.log(`[cron/expire-orders] ${data ?? 0} commande(s) annulée(s), stock restauré.`);
  return NextResponse.json({ ok: true, cancelled: data ?? 0 });
}
