import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { error } = await supabase.from('messages').select('id').limit(1)

  return NextResponse.json({
    ok: true,
    supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    messages_table: error ? { accessible: false, error: error.message, code: error.code } : { accessible: true },
  })
}
