import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, content, tags } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required to run AI auto-organization.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Fallback response with informative notice if GROQ_API_KEY is missing
      return NextResponse.json({
        title: title ? `[AI Refined] ${title.replace(/^\[AI Refined\]\s*/, '')}` : 'Refined Technical Note',
        summary: content.slice(0, 140) + '...',
        tags: Array.from(new Set([...(tags || []), 'ai-organized'])),
        warning: 'GROQ_API_KEY is not set in .env.local. Operating in fallback mode. Add GROQ_API_KEY to enable live Groq Llama 3.3 model completions.',
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are Codiary AI, an expert technical knowledge assistant for developers. Analyze the given note content and output a JSON object with:
1. "title": a clean, professional, concise technical title (max 8 words) without prefixes like "Title:".
2. "summary": a crisp, high-value 1-2 sentence executive summary highlighting key technical concepts (max 30 words).
3. "tags": an array of 2 to 5 relevant lowercase, single-word or hyphenated technical tags (e.g., ["nextjs", "security", "rate-limiting"]).

Respond ONLY with valid JSON in this exact structure:
{
  "title": "...",
  "summary": "...",
  "tags": ["...", "..."]
}`,
          },
          {
            role: 'user',
            content: `Current Title: ${title || 'Untitled'}\n\nNote Content:\n${content}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json(
        { error: `Groq AI service error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const messageContent = data?.choices?.[0]?.message?.content;

    if (!messageContent) {
      throw new Error('Invalid or empty response from Groq AI.');
    }

    const parsed = JSON.parse(messageContent);

    return NextResponse.json({
      title: parsed.title || title,
      summary: parsed.summary || content.slice(0, 120) + '...',
      tags: Array.isArray(parsed.tags) ? parsed.tags : tags || [],
    });
  } catch (error: any) {
    console.error('AI Auto-Organize exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI auto-organization.' },
      { status: 500 }
    );
  }
}
