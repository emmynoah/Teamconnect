import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
        `${SUPABASE_URL}/rest/v1/messages?visibility=eq.private&or=(recipient_email.eq.${encodeURIComponent(userEmail)},sender_email.eq.${encodeURIComponent(userEmail)})&order=created_at.desc&limit=500`,
        { headers: restHeaders }
      ),
    ])

    const teamMessages = teamRes.ok ? await teamRes.json() : []
    const privateMessages = privateRes.ok ? await privateRes.json() : []

    // Get unique sender emails
    const allMessages = [...teamMessages, ...privateMessages]
    const senderEmails = Array.from(new Set(allMessages.map((m: {sender_email: string}) => m.sender_email)))

    // Fetch current photos for all senders
    const photoMap: Record<string, string> = {}
    if (senderEmails.length > 0) {
      const photosRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?email=in.(${senderEmails.map(e => `"${e}"`).join(',')})&select=email,photo_url`,
        { headers: restHeaders }
      )
      if (photosRes.ok) {
        const photos: {email: string, photo_url: string | null}[] = await photosRes.json()
        photos.forEach(p => { if (p.photo_url) photoMap[p.email] = p.photo_url })
      }
    }

    // Attach current photo to each message
    const enrichedTeam = teamMessages.map((m: {sender_email: string}) => ({ ...m, sender_photo: photoMap[m.sender_email] || null }))
    const enrichedPrivate = privateMessages.map((m: {sender_email: string}) => ({ ...m, sender_photo: photoMap[m.sender_email] || null }))

    return NextResponse.json({ teamMessages: enrichedTeam, privateMessages: enrichedPrivate })
  } catch (error) {
    console.error('[messages/feed] error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
