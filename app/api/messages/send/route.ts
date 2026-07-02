import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { CARSA_TEAM } from '@/lib/team'

const resend = new Resend(process.env.RESEND_API_KEY)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const restHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
  'Prefer': 'return=representation',
}

export async function POST(req: NextRequest) {
  try {
    const { content, visibility, recipientEmail, senderEmail, senderName, senderInitials, isLeaderMessage } = await req.json()

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(senderEmail)}&select=photo_url`,
      { headers: restHeaders }
    )
    const profileRows: { photo_url: string | null }[] = profileRes.ok ? await profileRes.json() : []
    const senderPhoto = profileRows[0]?.photo_url || null

    // Insert via direct REST API — bypasses PostgREST schema cache issue (PGRST205)
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: restHeaders,
      body: JSON.stringify({
        sender_email: senderEmail,
        sender_name: senderName,
        sender_initials: senderInitials,
        sender_photo: senderPhoto,
        content,
        visibility,
        recipient_email: recipientEmail || null,
        is_leader_message: isLeaderMessage || false,
      }),
    })

    if (!insertRes.ok) {
      const insertErr = await insertRes.json()
      console.error('[messages/send] insert failed:', JSON.stringify(insertErr))
      return NextResponse.json({ error: insertErr.message, details: insertErr }, { status: 500 })
    }

    const rows: unknown[] = await insertRes.json()
    const message = rows[0]

    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    if (visibility === 'team') {
      const recipients = CARSA_TEAM.map(m => m.email)
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
          <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">${isLeaderMessage ? 'Team Announcement' : 'Team Message'}</h1>
            <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">${today}</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="border-left: 4px solid ${isLeaderMessage ? '#111827' : '#0A7E5A'}; padding-left: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-weight: bold; font-size: 14px; color: #111827;">From: ${senderName}</p>
              ${isLeaderMessage ? '<p style="margin: 2px 0 0; font-size: 12px; color: #6B7280;">Executive Director, CARSA</p>' : ''}
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 24px;">${content}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #F48221; color: black; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Open TeamConnect
            </a>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 0;" />
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Sent via TeamConnect · CARSA Internal Platform</p>
          </div>
        </div>
      `
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: recipients,
        subject: `${isLeaderMessage ? 'Announcement' : 'Team message'} from ${senderName} — ${today}`,
        html,
      })
      if (emailResult.error) {
        console.error('[messages/send] resend error:', JSON.stringify(emailResult.error))
      }
    } else if (visibility === 'private' && recipientEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
          <div style="background-color: #111827; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">Private Message</h1>
            <p style="color: #9CA3AF; margin: 4px 0 0 0; font-size: 14px;">${today}</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="border-left: 4px solid #0A7E5A; padding-left: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-weight: bold; font-size: 14px; color: #111827;">From: ${senderName}</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #6B7280;">Private message to you</p>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 24px;">${content}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background-color: #F48221; color: black; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Open TeamConnect
            </a>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 0;" />
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Sent via TeamConnect · CARSA Internal Platform</p>
          </div>
        </div>
      `
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: recipientEmail,
        subject: `Private message from ${senderName}`,
        html,
      })
      if (emailResult.error) {
        console.error('[messages/send] resend error:', JSON.stringify(emailResult.error))
      }
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[messages/send] unhandled error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
