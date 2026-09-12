/**
 * Wrapper Resend pour envoi d'emails depuis templates HTML.
 *
 * - Charge le HTML depuis supabase/email-templates/*.html
 * - Substitution simple {{ .VarName }} → data[VarName]
 * - Pour les loops (range), pré-renderer le HTML dans l'appelant et passer
 *   en variable (ex: ItemsHTML)
 * - Envoi via Resend SDK
 *
 * Configuration :
 * - process.env.RESEND_API_KEY (obligatoire)
 * - process.env.EMAIL_FROM (optionnel, défaut : Glory Hair <onboarding@resend.dev>)
 * - process.env.EMAIL_ADMIN_TO (optionnel, défaut : hello@rhdempire.com)
 *
 * Note prod : pour utiliser un from custom (ex: hello@gloryhair.fr), il faut
 * vérifier le domaine dans Resend Dashboard → Domains (SPF/DKIM/DMARC).
 */

import { Resend } from 'resend';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getBrandSettings } from '@/lib/settings/service';

const TEMPLATES_DIR = path.join(process.cwd(), 'supabase', 'email-templates');

const FROM_DEFAULT = process.env.EMAIL_FROM || 'Glory Hair <onboarding@resend.dev>';
const ADMIN_TO    = process.env.EMAIL_ADMIN_TO || 'hello@rhdempire.com';

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Cache des templates en mémoire (chargés une fois par process). */
const templateCache = new Map<string, string>();

async function loadTemplate(filename: string): Promise<string> {
  const cached = templateCache.get(filename);
  if (cached) return cached;
  const full = path.join(TEMPLATES_DIR, filename);
  const html = await fs.readFile(full, 'utf-8');
  templateCache.set(filename, html);
  return html;
}

/**
 * Substitution Go-template-style {{ .VarName }} → data[VarName].
 * Les blocs {{range}}/{{end}} NE sont PAS gérés ici — pré-renderer côté appelant.
 */
function render(template: string, data: Record<string, string | number | undefined | null>): string {
  return template.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_match, varName: string) => {
    const v = data[varName];
    if (v == null) return '';
    return String(v);
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;                                              // ex: 'email-welcome.html'
  data?: Record<string, string | number | undefined | null>;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;        // true si RESEND_API_KEY pas configurée (dev sans clé)
  error?: string;
}

/**
 * Envoie un email à partir d'un template Glory Hair.
 * Silencieux en dev si RESEND_API_KEY absente (log warn, retourne skipped).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY absente, envoi skip (template=${opts.template}, to=${opts.to})`);
    return { ok: false, skipped: true };
  }

  try {
    const tpl = await loadTemplate(opts.template);
    // Injecte BrandName/SiteURL automatiquement (rebrand, Phase 2) — une
    // seule fois ici plutôt que dans chaque route appelante. `data` explicite
    // reste prioritaire si un appelant fournit déjà sa propre valeur. SiteURL
    // sans slash final (les templates l'utilisent en préfixe "{{.SiteURL}}/fr/...")
    // pour que les liens des templates suivent automatiquement le domaine
    // configuré (NEXT_PUBLIC_APP_URL) plutôt que de rester figés sur l'ancien
    // domaine .vercel.app quand celui-ci changera (migration de domaine).
    const brand = await getBrandSettings();
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://glory-hair-riot.vercel.app').replace(/\/+$/, '');
    // Repli sur ADMIN_TO tant que brand_legal_contact_email n'est pas encore
    // rempli par Fresnel (/admin/reglages) — jamais un template affiché avec
    // une adresse de contact vide.
    const supportEmail = brand.legalContactEmail || ADMIN_TO;
    const html = render(tpl, { BrandName: brand.name, SiteURL: siteUrl, SupportEmail: supportEmail, ...(opts.data ?? {}) });

    const result = await resend.emails.send({
      from: opts.from ?? FROM_DEFAULT,
      to: opts.to,
      subject: opts.subject,
      html,
      ...(opts.replyTo && { replyTo: opts.replyTo }),
    });

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] send error:', msg);
    return { ok: false, error: msg };
  }
}

/** Helper pour envoyer un email aux admins de l'équipe (notifications internes). */
export async function sendAdminEmail(opts: Omit<SendEmailOptions, 'to'>): Promise<SendEmailResult> {
  return sendEmail({ ...opts, to: ADMIN_TO });
}

/**
 * Helper pour les loops dans les templates : pré-renderer les items en HTML.
 * Utilise une row par défaut : ce n'est pas un templating engine, c'est un
 * helper paresseux mais suffisant pour le MVP.
 */
export function renderOrderItemsHTML(items: Array<{
  name: string;
  variant?: string | null;
  quantity: number;
  price_cents: number;
}>): string {
  const rows = items.map(i => `
    <tr>
      <td style="padding: 16px 12px; border-bottom: 1px solid rgba(237, 231, 214, 0.12);">
        <div class="product-name" style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 17px; color: #ede7d6;">${escapeHtml(i.name)}</div>
        ${i.variant ? `<div class="product-variant" style="font-size: 13px; color: rgba(237, 231, 214, 0.6); margin-top: 4px;">${escapeHtml(i.variant)}</div>` : ''}
      </td>
      <td style="text-align: center; padding: 16px 12px; border-bottom: 1px solid rgba(237, 231, 214, 0.12);">${i.quantity}</td>
      <td style="text-align: right; padding: 16px 12px; border-bottom: 1px solid rgba(237, 231, 214, 0.12);">${(i.price_cents / 100).toFixed(2).replace('.', ',')} €</td>
    </tr>
  `).join('');

  return `
    <table class="order-table" style="width: 100%; background: #2a1720; border: 1px solid rgba(237, 231, 214, 0.12); margin: 12px 0 24px; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="font-family: 'Work Sans', system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: #150c10; color: rgba(237, 231, 214, 0.6); padding: 12px; text-align: left;">Produit</th>
          <th style="font-family: 'Work Sans', system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: #150c10; color: rgba(237, 231, 214, 0.6); padding: 12px; text-align: center;">Qté</th>
          <th style="font-family: 'Work Sans', system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; background: #150c10; color: rgba(237, 231, 214, 0.6); padding: 12px; text-align: right;">Prix</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
