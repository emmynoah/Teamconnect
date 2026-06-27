import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { field, value, instruction } = await req.json()

    const prompt = instruction
      ? `You are a professional writing assistant for CARSA, an NGO in Rwanda. Rewrite the following text according to this instruction: "${instruction}". Keep the meaning intact. Return ONLY the rewritten text, no explanation, no quotes.\n\nText: ${value}`
      : `You are a professional writing assistant for CARSA, an NGO in Rwanda. Improve the grammar, clarity, and professionalism of this text while keeping the author's voice and meaning. Return ONLY the improved text, no explanation, no quotes.\n\nText: ${value}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const improved = data.content?.[0]?.text?.trim() || ''
    return NextResponse.json({ improved, field })
  } catch (error) {
    console.error('Proofread error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
