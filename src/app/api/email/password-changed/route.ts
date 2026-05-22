/* /api/email/password-changed — Notification après changement de mot de passe.
 *
 * Appelé côté client depuis /compte/mot-de-passe après updateUser réussi.
 * Sécurité : informe l'user d'un changement, l'invite à contacter le SAV si
 * ce n'est pas lui.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const result = await sendEmail({
    to: user.email ?? '',
    subject: '★ Mot de passe modifié · Glory Hair RIOT',
    template: 'email-password-changed.html',
    data: {
      Email: user.email,
      Timestamp: new Date().toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    },
  });

  return NextResponse.json({ ok: result.ok, skipped: result.skipped });
}
