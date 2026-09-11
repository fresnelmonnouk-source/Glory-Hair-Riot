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
