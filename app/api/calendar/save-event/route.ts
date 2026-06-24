import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CARSA_ORG_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

export async function POST(req: NextRequest) {
  try {
    const { title, type, date, time, description, host } = await req.json()

    const { data, error } = await supabase
      .from('events')
      .insert({
        org_id: CARSA_ORG_ID,
        title,
        type,
        date,
        time,
        description,
        host_user_id: null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error('Save event error:', error)
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
  }
}
