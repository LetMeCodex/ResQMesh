import { NextResponse } from 'next/server';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../../../../lib/asi/prompts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ASI_ONE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ASI_ONE_API_KEY environment variable is not configured' }, { status: 500 });
    }

    const systemPrompt = SYSTEM_PROMPTS.commander;
    const userPrompt = USER_PROMPTS.commander(body);

    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'asi1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `ASI:ONE API error: ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty content from ASI:ONE API response' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(content.trim()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
