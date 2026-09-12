import { createServerSupabaseClient } from '@/lib/supabase/server';

/* Lecture des réglages sensibles (clé secrète FedaPay) — SERVICE_ROLE
   uniquement, jamais exposée à un client. Utilisée par le code serveur qui
   appelle réellement l'API FedaPay pour le compte d'un client (checkout),
   pas par l'admin (qui passe par admin.getPaymentSettings/adminProcedure,
   RLS is_admin(), et ne voit jamais la valeur brute du secret — seulement
   "configuré ou pas"). Fallback sur les variables d'environnement si rien
   n'est configuré en base, pour ne rien casser tant que Fresnel n'a pas
   rempli /admin/reglages. */

export async function getFedaPaySecretKey(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'fedapay_secret_key').maybeSingle();
  return data?.value || process.env.FEDAPAY_SECRET_KEY || null;
}

export async function getFedaPayPublicKey(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'fedapay_public_key').maybeSingle();
  return data?.value || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || null;
}

export async function getFedaPayEnvironment(): Promise<'live' | 'sandbox'> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'fedapay_environment').maybeSingle();
  return data?.value === 'sandbox' ? 'sandbox' : 'live';
}

export async function getStripeSecretKey(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'stripe_secret_key').maybeSingle();
  return data?.value || process.env.STRIPE_SECRET_KEY || null;
}

export async function getStripePublishableKey(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'stripe_publishable_key').maybeSingle();
  return data?.value || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'stripe_webhook_secret').maybeSingle();
  return data?.value || process.env.STRIPE_WEBHOOK_SECRET || null;
}

/* Réglage public (pas un secret) mais `settings` n'a aucune policy SELECT
   publique (délibéré, migration 006 — la table porte aussi des clés
   secrètes) : lu ici en service_role puis exposé au client UNIQUEMENT via
   une query tRPC dédiée qui ne retourne que cette valeur précise
   (siteSettings.getPublic), jamais la table entière. */
export async function getWhatsappNumber(): Promise<string | null> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').maybeSingle();
  return data?.value || null;
}

export interface BrandSettings {
  name: string;
  legalName: string | null;
  legalForm: string | null;
  siret: string | null;
  legalAddress: string | null;
  legalContactEmail: string | null;
}

// Nom "Glory Hair" en dur comme dernier repli : le site doit continuer à
// afficher QUELQUE CHOSE avant même que Fresnel n'ait ouvert /admin/reglages
// (rebrand RHD Empire — Phase 2). Les champs légaux, eux, n'ont AUCUN repli
// fabriqué : une adresse/SIRET inventés seraient pires qu'un champ vide
// (mentions légales, Phase 2c) — chaque surface qui les affiche doit gérer
// elle-même le cas "non configuré" (masquer plutôt qu'inventer), comme déjà
// fait pour le numéro WhatsApp dans SavRiot.
const DEFAULT_BRAND_NAME = 'Glory Hair';

export async function getBrandSettings(): Promise<BrandSettings> {
  const supabase = await createServerSupabaseClient(true);
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['brand_name', 'brand_legal_name', 'brand_legal_form', 'brand_siret', 'brand_legal_address', 'brand_legal_contact_email']);

  const byKey = new Map((data ?? []).map((r) => [r.key, r.value as string]));
  return {
    name: byKey.get('brand_name') || DEFAULT_BRAND_NAME,
    legalName: byKey.get('brand_legal_name') || null,
    legalForm: byKey.get('brand_legal_form') || null,
    siret: byKey.get('brand_siret') || null,
    legalAddress: byKey.get('brand_legal_address') || null,
    legalContactEmail: byKey.get('brand_legal_contact_email') || null,
  };
}
