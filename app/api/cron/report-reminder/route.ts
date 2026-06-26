import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { CARSA_TEAM } from '@/lib/team'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    for (const member of CARSA_TEAM) {
      const firstName = member.full_name.split(' ')[0]

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
          <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">Time to submit your daily report, ${firstName}.</h1>
            <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">${today}</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 15px; color: #374151; line-height: 1.7;">
              Take 5 minutes to share your accomplishments, lessons, challenges, and plan for tomorrow with your team leader.
            </p>
            <p style="font-size: 14px; color: #6B7280; line-height: 1.7;">
              Still working on a longer task? That is okay. Submit what you have and let your team leader know — you can share the full update tomorrow morning.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://teamconnect-three.vercel.app'}/reports"
               style="display: inline-block; background-color: #F48221; color: black; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 16px;">
              Submit My Report
            </a>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 0;" />
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Sent automatically by TeamConnect · CARSA Internal Platform</p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: member.email,
        subject: `Time to submit your daily report — ${today}`,
        html,
      })
    }

    return NextResponse.json({ success: true, sent: CARSA_TEAM.length })
  } catch (error) {
    console.error('Report reminder cron error:', error)
    return NextResponse.json({ error: 'Failed to send report reminders' }, { status: 500 })
  }
}
