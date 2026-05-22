/* /api/email/welcome — Envoi de l'email de bienvenue (idempotent).
 *
 * Appelé côté client depuis /compte après le premier login.
 * Idempotence : on enregistre un marker dans glory_club_points_log
 * (value=0, label='Welcome email sent', source='admin_adjust'). Si déjà
 * présent, on skip l'envoi.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export const runtime = 'nodejs';

const WELCOME_MARKER_LABEL = 'Welcome email sent';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Check si déjà envoyé
  const { data: existing } = await supabase
    .from('glory_club_points_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('label', WELCOME_MARKER_LABEL)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  // Récupère le profil pour le prénom
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const userName = profile?.full_name?.split(' ')[0]
    || profile?.email?.split('@')[0]
    || user.email?.split('@')[0]
    || 'Membre';

  // Envoi
  const result = await sendEmail({
    to: profile?.email ?? user.email ?? '',
    subject: 'T\'es dans le gang ★ Glory Hair RIOT',
    template: 'email-welcome.html',
    data: {
      UserName: userName,
      UnsubscribeURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/compte`,
    },
  });

  // Marker idempotence (même si l'envoi a skip via Resend absent, on évite de
  // re-tenter à chaque chargement de /compte)
  await supabase.from('glory_club_points_log').insert({
    user_id: user.id,
    label: WELCOME_MARKER_LABEL,
    value: 0,
    source: 'admin_adjust',
  });

  return NextResponse.json({ ok: result.ok, skipped: result.skipped, error: result.error });
}
