import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { title, date, time, host, description } = await req.json()

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: bold;">Visitor Notification</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">CARSA Internal Security and Protocol</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">

          <div style="background-color: #FFF3E0; border-left: 4px solid #F48221; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #F48221; font-weight: bold;">⚠️ Action Required</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151;">Please ensure gate clearance and reception arrangements are in place before the visitor arrives.</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 12px 0; color: #6B7280; width: 140px; font-weight: bold;">Visitor / Purpose</td>
              <td style="padding: 12px 0; color: #111827; font-weight: bold;">${title}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 12px 0; color: #6B7280; font-weight: bold;">Date</td>
              <td style="padding: 12px 0; color: #111827;">${dateFormatted}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 12px 0; color: #6B7280; font-weight: bold;">Arrival Time</td>
              <td style="padding: 12px 0; color: #111827;">${time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 12px 0; color: #6B7280; font-weight: bold;">Host Staff Member</td>
              <td style="padding: 12px 0; color: #111827;">${host}</td>
            </tr>
            ${description ? `
            <tr>
              <td style="padding: 12px 0; color: #6B7280; font-weight: bold;">Description</td>
              <td style="padding: 12px 0; color: #111827;">${description}</td>
            </tr>
            ` : ''}
          </table>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; color: #9CA3AF;">Compiled automatically by TeamConnect</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'hello@wamenta.com',
      to: 'emmynoah20@gmail.com',
      subject: `Visitor Alert — ${title} · ${dateFormatted} at ${time}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Security notification error:', error)
    return NextResponse.json({ error: 'Failed to notify security' }, { status: 500 })
  }
}
