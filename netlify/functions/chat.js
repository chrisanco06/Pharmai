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
      system: body.system,
      messages: body.messages,
    }),
  });

  const data = await response.json();

  // Convertir format OpenRouter → format Anthropic attendu par le frontend
  const converted = {
    content: [
      { type: 'text', text: data.choices?.[0]?.message?.content || '' }
    ]
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
