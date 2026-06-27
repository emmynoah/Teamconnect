import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ReportWithProfile = {
  user_id: string
  accomplishments: string
  lessons: string
  challenges: string
  tomorrow_plan: string
  submitted_at: string
  profiles: {
    full_name: string
    title: string
  } | null
}

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().slice(0, 10)

    const { data: rawReports, error } = await supabaseAdmin
      .from('daily_reports')
      .select('user_id, accomplishments, lessons, challenges, tomorrow_plan, submitted_at, profiles(full_name, title)')
      .eq('date', today)
      .order('submitted_at', { ascending: true })

    const reports = rawReports as ReportWithProfile[] | null

    if (error) {
      console.error('Failed to fetch reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ message: 'No reports submitted today' })
    }

    const formattedDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const reportText = reports.map((r: ReportWithProfile) => {
      const name = r.profiles?.full_name || 'Unknown'
      return `${name}:
- Accomplishments: ${r.accomplishments}
- Lesson: ${r.lessons}
- Challenge: ${r.challenges}
- Tomorrow: ${r.tomorrow_plan}`
    }).join('\n\n')

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are an executive assistant summarizing daily staff reports for Christophe Mbonyingabo, Executive Director of CARSA NGO in Rwanda. Based on today's reports below, write a concise 3-5 sentence executive summary highlighting: overall team progress, key accomplishments, main challenges, and what to watch tomorrow. Write in a professional tone directly addressing Christophe. Do not list each person individually — synthesize across the team.\n\n${reportText}`
        }]
      })
    })

    const aiData = await aiResponse.json()
    const summary = aiData.content?.[0]?.text?.trim() || 'Summary unavailable.'

    const reportCards = reports.map((r: ReportWithProfile) => {
      const name = r.profiles?.full_name || 'Unknown'
      const title = r.profiles?.title || ''
      const time = new Date(r.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      return `
        <div style="border-left: 4px solid #0A7E5A; padding-left: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: bold; color: #111827; font-size: 14px;">${name}</p>
          <p style="margin: 2px 0 12px; font-size: 11px; color: #6B7280;">${title} · Submitted at ${time}</p>
          <p style="margin: 0 0 3px; font-size: 11px; font-weight: bold; color: #0A7E5A;">✅ ACCOMPLISHMENTS</p>
          <p style="margin: 0 0 10px; font-size: 13px; color: #374151; line-height: 1.5;">${r.accomplishments}</p>
          <p style="margin: 0 0 3px; font-size: 11px; font-weight: bold; color: #0A7E5A;">💡 LESSON</p>
          <p style="margin: 0 0 10px; font-size: 13px; color: #374151; line-height: 1.5;">${r.lessons}</p>
          <p style="margin: 0 0 3px; font-size: 11px; font-weight: bold; color: #F48221;">⚠️ CHALLENGE</p>
          <p style="margin: 0 0 10px; font-size: 13px; color: #374151; line-height: 1.5;">${r.challenges}</p>
          <p style="margin: 0 0 3px; font-size: 11px; font-weight: bold; color: #111827;">📋 TOMORROW</p>
          <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">${r.tomorrow_plan}</p>
        </div>
      `
    }).join('<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />')

    const submittedCount = reports.length
    const pendingCount = 8 - submittedCount

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: bold;">CARSA Daily Summary</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 13px;">${formattedDate} · Sent automatically at 5:00pm</p>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">

          <div style="display: flex; gap: 16px; margin-bottom: 28px;">
            <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 22px; font-weight: bold; color: #0A7E5A;">${submittedCount}</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Reports submitted</div>
            </div>
            <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 22px; font-weight: bold; color: #F48221;">${pendingCount}</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Still pending</div>
            </div>
            <div style="flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 22px; font-weight: bold; color: #111827;">8</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">Team members</div>
            </div>
          </div>

          <div style="background: #E8F5F0; border-left: 4px solid #0A7E5A; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
            <p style="margin: 0 0 8px; font-size: 11px; font-weight: bold; color: #0A7E5A;">REPORT SUMMARY</p>
            <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.7;">${summary}</p>
          </div>

          <p style="font-size: 13px; font-weight: bold; color: #111827; margin: 0 0 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Individual Reports (${submittedCount} of 8)</p>

          ${reportCards}

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 0;" />
          <p style="margin: 16px 0 0; font-size: 11px; color: #9CA3AF;">Compiled automatically by TeamConnect · CARSA Internal Platform · <a href="https://teamconnect-three.vercel.app/leader" style="color: #0A7E5A;">View in app →</a></p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: 'emmanuel.n@carsaministry.org',
      subject: `CARSA Daily Summary — ${formattedDate} — ${submittedCount} of 8 reports`,
      html,
    })

    return NextResponse.json({ success: true, reports: submittedCount, summary })
  } catch (error) {
    console.error('Daily summary error:', error)
    return NextResponse.json({ error: 'Failed to send summary' }, { status: 500 })
  }
}
