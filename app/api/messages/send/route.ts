import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CARSA_TEAM } from '@/lib/team'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CARSA_ORG_ID = process.env.CARSA_ORG_ID!
void CARSA_ORG_ID

export async function POST(req: NextRequest) {
  try {
    const { content, visibility, recipientEmail, senderEmail, senderName, senderInitials, isLeaderMessage } = await req.json()

    // Save message to database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_email: senderEmail,
        sender_name: senderName,
        sender_initials: senderInitials,
        content,
        visibility,
        recipient_email: recipientEmail || null,
        is_leader_message: isLeaderMessage || false,
      })
      .select()
      .single()

    if (error) throw error

    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    // Send email notifications
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
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: recipients,
        subject: `${isLeaderMessage ? 'Announcement' : 'Team message'} from ${senderName} — ${today}`,
        html,
      })
    } else if (visibility === 'private' && recipientEmail) {
      const recipient = CARSA_TEAM.find(m => m.email === recipientEmail)
      const recipientName = recipient?.full_name.split(' ')[0] || 'there'
      void recipientName
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
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: recipientEmail,
        subject: `Private message from ${senderName}`,
        html,
      })
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
