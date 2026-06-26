'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [submittedCount, setSubmittedCount] = useState(0)
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [message, setMessage] = useState('')
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const supabase = createClient()

  const today = new Date()
  const dateString = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const match = CARSA_TEAM.find(m => m.email === user.email)
      if (match) {
        setUserName(match.full_name.split(' ')[0])
      }

      const todayStr = today.toISOString().split('T')[0]

      const { data: reports } = await supabase
        .from('daily_reports')
        .select('user_id')
        .eq('date', todayStr)

      const submittedUserIds = reports?.map(r => r.user_id) || []
      setSubmittedCount(submittedUserIds.length)

      const { data: events } = await supabase
        .from('events')
        .select('id')
        .gte('date', todayStr)
        .eq('org_id', process.env.NEXT_PUBLIC_CARSA_ORG_ID || 'a1b2c3d4-0000-0000-0000-000000000001')

      setUpcomingCount(events?.length || 0)
    }

    init()
  }, [])

  const handleSend = async (channel: 'whatsapp' | 'email' | 'both') => {
    if (!message.trim()) return
    setSendStatus('sending')

    try {
      const res = await fetch('/api/dashboard/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, channel, senderName: userName }),
      })

      if (!res.ok) throw new Error('Failed to send')
      setSendStatus('sent')
      setMessage('')
      setTimeout(() => setSendStatus('idle'), 3000)
    } catch {
      setSendStatus('error')
    }
  }

  const pending = CARSA_TEAM.length - submittedCount

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <p className="text-sm text-[#6B7280]">{dateString}</p>
        <h1 className="text-2xl font-bold text-[#111827] mt-1">
          {greeting}, {userName}. It is a new day.
        </h1>
      </div>

      {/* Morning Prompt */}
      <div
        className="bg-white rounded-xl p-6 mb-6"
        style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
      >
        <p className="text-sm font-semibold text-[#111827] mb-3">
          What do you want to share with the team today?
        </p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          placeholder="Write a message for the team..."
          className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none mb-4"
          style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        />

        {sendStatus === 'sent' && (
          <p className="text-sm mb-3" style={{ color: '#0A7E5A' }}>
            ✅ Message sent to the team.
          </p>
        )}
        {sendStatus === 'error' && (
          <p className="text-sm mb-3" style={{ color: '#F48221' }}>
            Something went wrong. Please try again.
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSend('email')}
            disabled={sendStatus === 'sending' || !message.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-black transition-colors duration-150"
            style={{ backgroundColor: '#F48221' }}
          >
            Send by Email
          </button>
          <button
            onClick={() => handleSend('whatsapp')}
            disabled={sendStatus === 'sending' || !message.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#374151] transition-colors duration-150"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            Send to WhatsApp
          </button>
          <button
            onClick={() => handleSend('both')}
            disabled={sendStatus === 'sending' || !message.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#374151] transition-colors duration-150"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            Send to Both
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Reports submitted', value: submittedCount, color: '#0A7E5A' },
          { label: 'Still pending', value: pending, color: '#F48221' },
          { label: 'Upcoming events', value: upcomingCount, color: '#111827' },
          { label: 'Team members', value: CARSA_TEAM.length, color: '#111827' },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 text-center"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Team Report Status */}
      <div>
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
          Today's report status
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CARSA_TEAM.map(member => (
            <div
              key={member.initials}
              className="bg-white rounded-xl p-4 flex items-center gap-3"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
              >
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">
                  {member.full_name.split(' ')[0]} {member.full_name.split(' ')[1]}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{member.title}</p>
              </div>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#D1D5DB' }}
                title="Pending"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
