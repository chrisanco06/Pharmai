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

  // OpenRouter uses messages array with system role — no separate system field
  const messages = [
    { role: 'system', content: body.system },
    ...body.messages
  ];

  // Force JSON on last user message
  const last = messages[messages.length - 1];
  if (last.role === 'user') {
    last.content = last.content + '\n\n[Réponds UNIQUEMENT avec du JSON valide, format: {"message":"...","chips":["..."],"products":null,"step":1,"warning":null}]';
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Netlify.env.get('OPENROUTER_API_KEY')}`,
      'HTTP-Referer': 'https://pharmai.netlify.app',
      'X-Title': 'PharmIA',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet',
      max_tokens: 1000,
      messages,
    }),
  });

  const data = await response.json();
  
  // Log for debugging
  console.log('OpenRouter response:', JSON.stringify(data).substring(0, 500));
  
  const text = data.choices?.[0]?.message?.content || '';

  return new Response(JSON.stringify({
    content: [{ type: 'text', text }]
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/chat' };
