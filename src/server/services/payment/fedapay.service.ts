import crypto from 'crypto';
import { getFedaPayEnvironment, getFedaPaySecretKey } from '@/lib/settings/service';

/* Clé secrète + environnement lus depuis la table `settings` (configurable
   depuis /admin/reglages, migration 006) plutôt que figés au chargement du
   module — avant, FEDAPAY_SECRET_KEY était lu une fois depuis
   process.env au démarrage : impossible à changer sans redéploiement.
   Fallback sur les variables d'environnement si rien n'est configuré en
   admin (cf. src/lib/settings/service.ts). */
async function fedaPayBaseUrl(): Promise<string> {
  const env = await getFedaPayEnvironment();
  return env === 'sandbox' ? 'https://sandbox-api.fedapay.com/v1' : 'https://api.fedapay.com/v1';
}

export interface CreateTransactionParams {
  amount: number; // in cents
  currency: string; // 'XOF', 'GHS', etc.
  phone: string; // Customer phone number
  description?: string;
  metadata?: Record<string, string>;
}

export async function createTransaction({
  amount,
  currency,
  phone,
  description,
  metadata,
}: CreateTransactionParams) {
  try {
    const [secretKey, baseUrl] = await Promise.all([getFedaPaySecretKey(), fedaPayBaseUrl()]);
    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        phone,
        description,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fedapay`,
        metadata,
      }),
      // timeout explicite (audit fiabilité 2026-09-13) : sans lui, un FedaPay
      // lent laisserait la requête pendre jusqu'au kill Vercel plutôt que
      // notre propre catch (cancelOrderRestoreStock).
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`FedaPay API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      transactionId: data.id,
      token: data.token,
      status: data.status,
      amount: data.amount,
    };
  } catch (error) {
    console.error('Error creating FedaPay transaction:', error);
    throw new Error('Failed to create payment transaction');
  }
}

export async function getTransactionStatus(transactionId: string) {
  try {
    const [secretKey, baseUrl] = await Promise.all([getFedaPaySecretKey(), fedaPayBaseUrl()]);
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`FedaPay API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      status: data.status, // 'pending', 'approved', 'declined', 'expired'
      amount: data.amount,
      phone: data.phone,
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  try {
    // FedaPay documente que le secret de webhook est un secret DÉDIÉ par
    // endpoint (Workbench → Webhooks), distinct de la clé API utilisée pour
    // signer les appels sortants (vérifié via leur doc officielle,
    // 2026-09-13) — avant, on vérifiait avec la clé API, jamais le bon
    // secret. Repli sur l'ancien comportement (avec avertissement) tant que
    // FEDAPAY_WEBHOOK_SECRET n'est pas configuré, pour ne pas casser une
    // vérification qui fonctionnerait déjà par coïncidence.
    //
    // Note honnête : FedaPay ne publie pas l'algorithme exact de son SDK
    // officiel (Webhook.constructEvent) — leur doc mentionne un timestamp
    // anti-rejeu dans l'en-tête sans en détailler le format. Le SDK npm
    // `fedapay` n'a pas pu être utilisé (dépendance `axios` avec des CVE
    // sans correctif disponible). Ce correctif utilise donc le meilleur
    // schéma vérifiable (HMAC-SHA256 du corps brut, comparaison à temps
    // constant) avec le bon secret — à confirmer avec le support FedaPay si
    // leur format inclut réellement un composant timestamp non couvert ici.
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    const secretKey = webhookSecret || (await getFedaPaySecretKey());
    if (!webhookSecret) {
      console.warn('[fedapay] FEDAPAY_WEBHOOK_SECRET non configurée — vérification avec la clé API (repli), à corriger.');
    }

    const expected = crypto.createHmac('sha256', secretKey || '').update(body).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');

    // Comparaison à temps constant : `===` sur un HMAC est vulnérable à une
    // attaque de timing théorique (audit sécurité 2026-09-13).
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

export async function refundTransaction(transactionId: string) {
  try {
    const [secretKey, baseUrl] = await Promise.all([getFedaPaySecretKey(), fedaPayBaseUrl()]);
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`FedaPay API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      refundId: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('Error refunding FedaPay transaction:', error);
    throw new Error('Failed to process refund');
  }
}
