import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { CARSA_TEAM } from '@/lib/team'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { message, channel, senderName } = await req.json()

    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Team Message</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">${today}</p>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="border-left: 4px solid #0A7E5A; padding-left: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: bold; font-size: 14px; color: #111827;">From: ${senderName}</p>
          </div>
          <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 24px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;" />
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Sent via TeamConnect · CARSA Internal Platform</p>
        </div>
      </div>
    `

    if (channel === 'email' || channel === 'both') {
      const recipients = CARSA_TEAM.map(m => m.email)

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: recipients,
        subject: `Team Message from ${senderName} — ${today}`,
        html,
      })
    }

    // WhatsApp is handled client-side via deep link

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
