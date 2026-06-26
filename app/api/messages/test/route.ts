import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const restHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
}

export async function GET() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=id&limit=1`, {
    headers: restHeaders,
  })

  const body = await res.json()

  return NextResponse.json({
    ok: true,
    supabase_url_set: !!SUPABASE_URL,
    service_role_key_set: !!SERVICE_ROLE_KEY,
    http_status: res.status,
    messages_table: res.ok
      ? { accessible: true }
      : { accessible: false, response: body },
  })
}
