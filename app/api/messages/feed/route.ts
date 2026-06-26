import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('email')

    // Fetch team messages + private messages for this user
    const { data: teamMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('visibility', 'team')
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: privateMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('visibility', 'private')
      .or(`recipient_email.eq.${userEmail},sender_email.eq.${userEmail}`)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      teamMessages: teamMessages || [],
      privateMessages: privateMessages || [],
    })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
