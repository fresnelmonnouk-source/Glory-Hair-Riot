import crypto from 'crypto';

const FEDAPAY_API_URL = 'https://api.fedapay.com/v1';
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;

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
    const response = await fetch(`${FEDAPAY_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
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
    const response = await fetch(
      `${FEDAPAY_API_URL}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
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

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', FEDAPAY_SECRET_KEY || '')
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
    const response = await fetch(
      `${FEDAPAY_API_URL}/transactions/${transactionId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
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
