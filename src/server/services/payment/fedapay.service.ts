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
    const secretKey = await getFedaPaySecretKey();
    const hash = crypto
      .createHmac('sha256', secretKey || '')
      .update(body)
      .digest('hex');

    return hash === signature;
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
