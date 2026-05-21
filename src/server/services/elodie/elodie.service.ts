import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

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

export async function getElodieResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: ELODIE_SYSTEM_PROMPT,
        },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content =
      response.choices[0]?.message?.content ||
      'Je suis désolée, j\'ai eu un problème. Pouvez-vous reformuler?';

    return {
      content,
      tokens_used: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('Deepseek API error:', error);

    return {
      content:
        'Je suis actuellement indisponible. Nos équipes travaillent sur mon intégration. Veuillez réessayer plus tard ou contacter le support.',
      tokens_used: 0,
    };
  }
}
