/* /api/cron/newsletter — CRON Vercel hebdomadaire (voir vercel.json, lundi 8h UTC)
 *
 * Déclenché automatiquement par Vercel Cron Jobs (requête GET, header
 * `Authorization: Bearer $CRON_SECRET`) — fonctionne de façon autonome une
 * fois déployé, indépendamment de toute session Claude.
 *
 * 1. Vérifie CRON_SECRET (401 si absent/incorrect — protège contre un
 *    déclenchement public non autorisé, qui enverrait potentiellement un
 *    email à toute la liste d'abonnés).
 * 2. Génère un brouillon via generateNewsletterDraft() (DeepSeek).
 * 3. Insère toujours en base avec status='draft', created_by=null (aucun
 *    humain à l'origine d'un envoi CRON).
 * 4. Lit le flag newsletter_auto_send (feature_flags) :
 *    - false (défaut) : le brouillon reste en attente de validation
 *      manuelle depuis /admin/newsletter. Rien n'est envoyé.
 *    - true : envoi réel à tous les abonnés actifs, puis status='sent'.
 *
 * Gestion d'erreur : jamais d'état ambigu. Si la génération échoue, rien
 * n'est inséré (pas de ligne à corriger). Si l'insertion du brouillon
 * échoue, on le signale directement. Si l'envoi (quand auto_send=true)
 * échoue après insertion, la ligne est marquée 'failed' plutôt que de
 * rester en 'draft' silencieusement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  generateNewsletterDraft,
  sendNewsletterToActiveSubscribers,
  NewsletterGenError,
} from '@/server/services/newsletter/newsletter-gen';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // 1. Auth CRON — CRON_SECRET doit être définie dans les variables
  // d'environnement Vercel (Production). Voir rapport de livraison pour la
  // procédure ; jamais générée automatiquement ici.
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!expected || authHeader !== `Bearer ${expected}`) {
    console.warn('[cron/newsletter] accès refusé (CRON_SECRET absent ou incorrect).');
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Service role : la route CRON n'a aucune session utilisateur (pas de
  // cookies), il faut bypasser la RLS pour lire/écrire newsletters,
  // feature_flags et newsletter_subscribers.
  const supabase = await createServerSupabaseClient(true);

  // 2. Génération du brouillon
  let draft;
  try {
    draft = await generateNewsletterDraft();
  } catch (err) {
    const message = err instanceof NewsletterGenError ? err.message : 'Erreur inconnue lors de la génération.';
    console.error('[cron/newsletter] génération échouée, aucune ligne créée:', err);
    return NextResponse.json({ error: 'GENERATION_FAILED', message }, { status: 500 });
  }

  // 3. Insertion systématique en 'draft'
  const { data: inserted, error: insertError } = await supabase
    .from('newsletters')
    .insert({
      subject: draft.subject,
      html_body: draft.html_body,
      status: 'draft',
      created_by: null,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('[cron/newsletter] insertion du brouillon échouée:', insertError?.message);
    return NextResponse.json(
      { error: 'DB_INSERT_FAILED', message: insertError?.message ?? 'insertion impossible' },
      { status: 500 },
    );
  }

  const newsletterId = inserted.id as string;

  // 4. Lecture du flag newsletter_auto_send
  const { data: flag, error: flagError } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'newsletter_auto_send')
    .maybeSingle();

  if (flagError) {
    // Le brouillon existe déjà et est valide (status='draft') — on ne le
    // marque PAS 'failed' pour une simple erreur de lecture de flag :
    // par défaut/sécurité on n'envoie rien, ce qui est le comportement
    // correct tant qu'on ne peut pas confirmer que le flag est à true.
    console.error('[cron/newsletter] lecture du flag newsletter_auto_send échouée, envoi annulé par sécurité:', flagError.message);
    return NextResponse.json({ ok: true, newsletterId, status: 'draft', autoSend: false, flagReadError: true });
  }

  const autoSend = flag?.enabled === true;

  if (!autoSend) {
    console.log(`[cron/newsletter] Brouillon ${newsletterId} généré — newsletter_auto_send=false, en attente de validation manuelle depuis /admin/newsletter.`);
    return NextResponse.json({ ok: true, newsletterId, status: 'draft', autoSend: false });
  }

  // 5. Envoi réel (auto_send=true)
  try {
    const { recipientsCount } = await sendNewsletterToActiveSubscribers(supabase, draft.subject, draft.html_body);

    const { error: updateError } = await supabase
      .from('newsletters')
      .update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: recipientsCount })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('[cron/newsletter] envoi réussi mais mise à jour du statut échouée:', updateError.message);
      return NextResponse.json(
        { error: 'STATUS_UPDATE_FAILED', newsletterId, recipientsCount, message: updateError.message },
        { status: 500 },
      );
    }

    console.log(`[cron/newsletter] Newsletter ${newsletterId} envoyée automatiquement à ${recipientsCount} abonné(s).`);
    return NextResponse.json({ ok: true, newsletterId, status: 'sent', recipientsCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/newsletter] envoi échoué:', err);
    await supabase.from('newsletters').update({ status: 'failed' }).eq('id', newsletterId);
    return NextResponse.json({ error: 'SEND_FAILED', newsletterId, message }, { status: 500 });
  }
}
