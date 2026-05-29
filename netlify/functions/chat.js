export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  const body = await req.json();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Netlify.env.get('OPENROUTER_API_KEY')}`,
      'HTTP-Referer': 'https://pharmai.netlify.app',
      'X-Title': 'PharmIA',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: body.system
        },
        ...body.messages,
        {
          role: 'user',
          content: `IMPORTANT: Tu dois répondre UNIQUEMENT en JSON valide, sans aucun texte avant ou après. Format exact requis:
{"message":"...","chips":["option1","option2","option3"],"products":null,"step":1,"warning":null}
Ne pose QU'UNE seule question courte. Propose 3-4 chips cliquables courtes (max 4 mots). Pas de listes dans message.

Message de l'utilisateur: ${body.messages[body.messages.length - 1].content}`
        }
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  const converted = {
    content: [{ type: 'text', text }]
  };

  return new Response(JSON.stringify(converted), {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/chat' };
