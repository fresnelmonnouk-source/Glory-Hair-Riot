/* /api/contact — Formulaire de contact public (/sav/contact)
 *
 * 1. Rate-limit par IP (anti-spam, même pattern que /api/newsletter)
 * 2. Honeypot ("company" caché) — si rempli, on répond succès sans rien
 *    faire (le bot ne sait pas qu'il a été détecté)
 * 3. Valide + insère dans `messages` (migration 014)
 * 4. Email admin best-effort (n'échoue jamais la soumission utilisateur)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkLimit, getRequestIp } from '@/lib/rate-limit';
import { sendAdminEmail } from '@/lib/email/send';

export const runtime = 'nodejs';

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10, 'Votre message doit faire au moins 10 caractères.').max(4000),
  company: z.string().max(500).optional().or(z.literal('')), // honeypot — un humain le laisse vide, rempli = bot (vérifié plus bas, jamais rejeté ici pour ne pas révéler la détection)
});

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = checkLimit(`contact:${ip}`, 5, 3600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', userMessage: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 },
    );
  }

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'INVALID_BODY', userMessage: 'Merci de vérifier les champs du formulaire.', details: err instanceof Error ? err.message : null },
      { status: 400 },
    );
  }

  // Honeypot rempli → bot détecté, réponse succès neutre (ne pas révéler la détection)
  if (body.company) {
    return NextResponse.json({ ok: true, userMessage: 'Message envoyé. Nous vous répondons sous 24h ouvrées.' });
  }

  const admin = await createServerSupabaseClient(true);
  const { error: dbError } = await admin.from('messages').insert({
    name: body.name,
    email: body.email,
    subject: body.subject,
    body: body.message,
  });

  if (dbError) {
    console.error('[contact] DB error:', dbError.message);
    return NextResponse.json(
      { error: 'STORAGE_ERROR', userMessage: 'Service temporairement indisponible. Réessayez dans un instant.' },
      { status: 500 },
    );
  }

  void sendAdminEmail({
    subject: `[ADMIN] Nouveau message · ${body.subject}`,
    template: 'email-admin-contact-message.html',
    data: {
      SenderName: body.name,
      SenderEmail: body.email,
      Subject: body.subject,
      Message: body.message,
      ReceivedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      OrderURL: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/messages`,
    },
  }).catch((e) => console.error('[contact] admin email error:', e));

  return NextResponse.json({ ok: true, userMessage: 'Message envoyé. Nous vous répondons sous 24h ouvrées.' });
}
