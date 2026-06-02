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

  // Inject a strong JSON-only reminder as last user message
  const messages = [...body.messages];
  const lastMsg = messages[messages.length - 1];
  messages[messages.length - 1] = {
    role: lastMsg.role,
    content: `${lastMsg.content}

INSTRUCTION CRITIQUE : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans markdown. Format OBLIGATOIRE :
{"message":"Ta question courte ici","chips":["Option 1","Option 2","Option 3","Option 4"],"products":null,"step":1,"warning":null}

Règles :
- "message" = UNE seule question courte (max 15 mots)
- "chips" = 3 à 5 options cliquables courtes (max 4 mots chacune)
- "products" = null sauf à l'étape 5
- "step" = numéro de l'étape actuelle (1 à 5)
- PAS de texte libre, PAS de listes, UNIQUEMENT le JSON`
  };

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
      messages: [
        { role: 'system', content: body.system },
        ...messages
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Try to extract valid JSON
  let finalText = text;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      JSON.parse(match[0]); // validate
      finalText = match[0];
    }
  } catch(e) {
    // fallback: return raw text, frontend handles it
  }

  const converted = {
    content: [{ type: 'text', text: finalText }]
  };

  return new Response(JSON.stringify(converted), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/chat' };
