import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CARSA_ORG_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('org_id', CARSA_ORG_ID)
      .order('date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ events: data })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
