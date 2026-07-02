import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'You are a professional writing assistant for CARSA, a reconciliation NGO in Rwanda. Improve the grammar, clarity, and professionalism of this message while keeping the author\'s meaning intact. Make it sound like a confident, clear institutional communication. Remove casual language, slang, and emojis. Return only the improved text with no explanation, no quotes, no markdown.',
        messages: [{
          role: 'user',
          content: message,
        }],
      }),
    })

    const data = await response.json()
    const improved = data.content?.[0]?.text || message
    return NextResponse.json({ improved })
  } catch (error) {
    console.error('Proofread error:', error)
    return NextResponse.json({ error: 'Failed to proofread' }, { status: 500 })
  }
}
