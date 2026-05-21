const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function askOpenRouter(systemPrompt: string, userQuestion: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001';

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/diese-tech/salbot',
      'X-Title': 'SALbot Rules Assistant',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuestion },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${body}`);
  }

  const json = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return json.choices[0]?.message?.content ?? '(no response)';
}
