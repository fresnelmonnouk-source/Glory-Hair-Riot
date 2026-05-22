/* /api/newsletter — Inscription newsletter Glory Hair RIOT
 *
 * 1. Valide l'email (regex + longueur)
 * 2. Rate-limit par IP : 5 tentatives par heure (anti-abuse)
 * 3. INSERT dans Supabase newsletter_subscribers (ON CONFLICT DO NOTHING)
 * 4. Si RESEND_API_KEY configurée : ajoute à l'audience Resend
 * 5. Retourne 200 même si email déjà inscrit (anti-énumération)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkLimit, getRequestIp } from '@/lib/rate-limit';
import { Resend } from 'resend';
import { sendEmail } from '@/lib/email/send';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  // 1. Rate limit IP (anti-spam form)
  const ip = getRequestIp(request);
  const limit = checkLimit(`newsletter:${ip}`, 5, 3600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', userMessage: 'Trop de tentatives. Réessaie dans une heure.' },
      { status: 429 },
    );
  }

  // 2. Parse + valide
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY', userMessage: 'Requête invalide.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: 'INVALID_EMAIL', userMessage: 'Adresse email invalide.' },
      { status: 400 },
    );
  }

  const source = ['footer', 'inscription', 'checkout', 'admin_import'].includes(body.source ?? '')
    ? body.source!
    : 'footer';

  // 3. Insert Supabase (idempotent via UNIQUE constraint sur email)
  const supabase = createServerSupabaseClient();
  const { error: dbError } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true });

  if (dbError) {
    console.error('[newsletter] DB error:', dbError.message);
    // On ne révèle pas l'erreur DB à l'user
    return NextResponse.json(
      { error: 'STORAGE_ERROR', userMessage: 'Service temporairement indisponible. Réessaie dans un instant.' },
      { status: 500 },
    );
  }

  // 4. Resend audience (optionnel, silencieux si fail)
  if (process.env.RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.contacts.create({
        email,
        audienceId: RESEND_AUDIENCE_ID,
        unsubscribed: false,
      });

      if (result.data?.id) {
        // Stocke l'ID Resend pour la sync future
        await supabase
          .from('newsletter_subscribers')
          .update({ resend_audience_id: result.data.id })
          .eq('email', email);
      }
    } catch (err) {
      console.warn('[newsletter] Resend error (ignoré):', err);
    }
  }

  // 5. Email de confirmation (best-effort)
  void sendEmail({
    to: email,
    subject: '★ Abonné à RIOT · Glory Hair',
    template: 'email-newsletter-confirm.html',
    data: {
      Email: email,
      UnsubscribeURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sav?action=unsubscribe&email=${encodeURIComponent(email)}`,
    },
  }).catch((e) => console.warn('[newsletter] confirm email skip:', e));

  // 6. Retour neutre (anti-énumération)
  return NextResponse.json({
    ok: true,
    userMessage: '★ Inscrit·e ! Tu recevras l\'Issue 02 dès qu\'elle sort.',
  });
}
