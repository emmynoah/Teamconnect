import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { accomplishments, lessons, challenges, tomorrowPlan } = await req.json()

    const prompt = `You are a professional communication assistant for CARSA, an NGO in Rwanda focused on reconciliation and rehabilitation. A staff member has written their daily report. Your job is to improve clarity, grammar, and professionalism while keeping their voice and meaning intact. Do not add new information. Return ONLY a JSON object with these exact keys: accomplishments, lessons, challenges, tomorrowPlan. No markdown, no explanation, just the JSON.

Here is the report:
Accomplishments: ${accomplishments || ''}
Lesson learned: ${lessons || ''}
Challenge faced: ${challenges || ''}
Plan for tomorrow: ${tomorrowPlan || ''}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const improved = JSON.parse(text)

    return NextResponse.json({ improved })
  } catch (error) {
    console.error('Proofread error:', error)
    return NextResponse.json({ error: 'Proofread failed' }, { status: 500 })
  }
}
