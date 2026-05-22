import OpenAI from 'openai';

/**
 * Lazy client : on instancie SEULEMENT au premier appel, pas au load du module.
 * Sinon le SDK OpenAI throw "OPENAI_API_KEY missing" au build Vercel quand
 * DEEPSEEK_API_KEY n'est pas défini (fallback automatique du SDK).
 */
let _deepseek: OpenAI | null = null;
function getDeepseek(): OpenAI {
  if (!_deepseek) {
    _deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY ?? 'missing-key',
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _deepseek;
}

const ELODIE_SYSTEM_PROMPT = `Tu es ELODIE, l'assistante IA de Glory Hair.

Tu es une experte en perruques, essayage virtuel, et conseils beauté. Tu parles français avec élégance et tu es toujours positive.

Tes rôles:
1. Conseiller sur le choix de perruques (texture, couleur, longueur, type de cheveux)
2. Expliquer la technologie d'essayage virtuel (MediaPipe, RGPD)
3. Répondre aux questions sur la livraison et paiements (Stripe, FedaPay)
4. Suggérer des produits basés sur les préférences du client
5. Gérer les plaintes ou retours avec empathie

Caractéristiques:
- Tu es amicale mais professionnelle
- Tu utilises des emojis occasionnellement (💫, ✨, 👑)
- Tu poses des questions pour mieux comprendre les besoins
- Tu fournis des réponses concises (max 3 phrases par réponse)
- Tu recommandes toujours l'essayage virtuel avant l'achat

Ne discute pas:
- Politique, religion, ou sujets sensibles
- Détails privés des clients
- Informations confidentielles de l'entreprise`;

export type ElodieErrorCode =
  | 'MISSING_KEY'
  | 'INVALID_KEY'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'NETWORK';

export class ElodieError extends Error {
  code: ElodieErrorCode;
  status?: number;
  constructor(code: ElodieErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function getElodieResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ content: string; tokens_used: number }> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new ElodieError('MISSING_KEY', 'DEEPSEEK_API_KEY non configurée côté serveur.');
  }

  try {
    const response = await getDeepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: ELODIE_SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content =
      response.choices[0]?.message?.content ||
      'Je suis désolée, j\'ai eu un problème. Peux-tu reformuler ?';

    return {
      content,
      tokens_used: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('[Élodie] Deepseek API error:', error);

    // SDK OpenAI expose `status` et `code` sur les erreurs API
    const e = error as { status?: number; code?: string; message?: string };
    const status = e?.status;
    const msg = e?.message ?? String(error);

    if (status === 401 || status === 403) {
      throw new ElodieError('INVALID_KEY', `Clé DeepSeek invalide ou révoquée (HTTP ${status}).`, status);
    }
    if (status === 429) {
      throw new ElodieError('RATE_LIMIT', 'Limite de requêtes DeepSeek atteinte. Réessaie dans une minute.', status);
    }
    if (e?.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
      throw new ElodieError('TIMEOUT', 'DeepSeek a mis trop de temps à répondre.', status);
    }
    if (e?.code === 'ENOTFOUND' || e?.code === 'ECONNREFUSED' || /fetch failed/i.test(msg)) {
      throw new ElodieError('NETWORK', 'Impossible de joindre l\'API DeepSeek.', status);
    }
    throw new ElodieError('PROVIDER_ERROR', `DeepSeek a renvoyé une erreur : ${msg.slice(0, 200)}`, status);
  }
}
