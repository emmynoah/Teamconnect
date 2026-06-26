import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const restHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('email') || ''

    const [teamRes, privateRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/messages?visibility=eq.team&order=created_at.desc&limit=20`,
        { headers: restHeaders }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/messages?visibility=eq.private&or=(recipient_email.eq.${encodeURIComponent(userEmail)},sender_email.eq.${encodeURIComponent(userEmail)})&order=created_at.desc&limit=20`,
        { headers: restHeaders }
      ),
    ])

    const teamMessages = teamRes.ok ? await teamRes.json() : []
    const privateMessages = privateRes.ok ? await privateRes.json() : []

    return NextResponse.json({ teamMessages, privateMessages })
  } catch (error) {
    console.error('[messages/feed] error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
