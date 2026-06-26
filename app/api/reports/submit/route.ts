import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { CARSA_TEAM } from '@/lib/team'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, accomplishments, lessons, challenges, tomorrowPlan } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', JSON.stringify(profileError))
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found for email: ' + email }, { status: 404 })
    }

    const today = new Date().toISOString().slice(0, 10)

    const { error: insertError } = await supabaseAdmin
      .from('daily_reports')
      .insert({
        user_id: profile.id,
        org_id: process.env.CARSA_ORG_ID,
        date: today,
        accomplishments,
        lessons,
        challenges,
        tomorrow_plan: tomorrowPlan,
        submitted_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('DB insert failed:', JSON.stringify(insertError))
      return NextResponse.json({ error: 'DB insert failed', details: insertError }, { status: 500 })
    }

    const member = CARSA_TEAM.find(m => m.email === email)
    const name = member?.full_name || email
    const title = member?.title || ''

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: bold;">CARSA Daily Report</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">${formattedDate}</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">

          <div style="border-left: 4px solid #0A7E5A; padding-left: 16px; margin-bottom: 32px;">
            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #111827;">${name}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280;">${title}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #0A7E5A;">✅ ACCOMPLISHMENTS</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${accomplishments}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #0A7E5A;">💡 LESSON LEARNED</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${lessons}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #F48221;">⚠️ CHALLENGE</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${challenges}</p>
          </div>

          <div style="margin-bottom: 32px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 13px; color: #111827;">📋 PLAN FOR TOMORROW</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${tomorrowPlan}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;" />
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Compiled automatically by TeamConnect</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.REPORTS_RECIPIENT_EMAIL!,
      subject: `CARSA Daily Report — ${formattedDate} — ${name}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
