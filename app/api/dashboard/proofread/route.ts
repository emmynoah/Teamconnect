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
        messages: [{
          role: 'user',
          content: `You are a professional communication assistant for CARSA, an NGO in Rwanda. A staff member has written this internal team message. Improve it to be clear, professional, and warm — keeping the same meaning and their authentic voice. Return only the improved message with no explanation, no preamble, no quotation marks.\n\nOriginal message:\n${message}`,
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
