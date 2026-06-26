'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

interface Report {
  id: string
  user_id: string
  date: string
  accomplishments: string
  lessons: string
  challenges: string
  tomorrow_plan: string
  submitted_at: string
  commenterName?: string
}

interface ReportWithMember extends Report {
  memberName: string
  memberTitle: string
  memberInitials: string
  memberEmail: string
}

export default function LeaderPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<ReportWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [comments, setComments] = useState<Record<string, string>>({})
  const [commentStatus, setCommentStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({})
  const [announcement, setAnnouncement] = useState('')
  const [announceStatus, setAnnounceStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    fetchReports()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('date', selectedDate)
      .order('submitted_at', { ascending: true })

    if (data) {
      const userIds = data.map(r => r.user_id)
      const emailById: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds)
        profiles?.forEach(p => { emailById[p.id] = p.email })
      }

      const enriched: ReportWithMember[] = data.map(report => {
        const email = emailById[report.user_id] || ''
        const member = CARSA_TEAM.find(m => m.email === email)
        return {
          ...report,
          memberName: member?.full_name || email || 'Unknown',
          memberTitle: member?.title || '',
          memberInitials: member?.initials || '??',
          memberEmail: email,
        }
      })
      setReports(enriched)
    }
    setLoading(false)
  }

  const handleComment = async (reportId: string) => {
    const comment = comments[reportId]
    if (!comment?.trim()) return

    const report = reports.find(r => r.id === reportId)
    const memberEmail = report?.memberEmail || ''

    setCommentStatus(prev => ({ ...prev, [reportId]: 'saving' }))

    await fetch('/api/leader/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, comment, memberEmail }),
    })

    setCommentStatus(prev => ({ ...prev, [reportId]: 'saved' }))
    setTimeout(() => {
      setCommentStatus(prev => ({ ...prev, [reportId]: 'idle' }))
    }, 2000)
  }

  const handleAnnouncement = async () => {
    if (!announcement.trim()) return
    setAnnounceStatus('sending')

    try {
      const res = await fetch('/api/leader/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcement }),
      })
      if (!res.ok) throw new Error()
      setAnnounceStatus('sent')
      setAnnouncement('')
      setTimeout(() => setAnnounceStatus('idle'), 3000)
    } catch {
      setAnnounceStatus('error')
    }
  }

  const submittedEmails = reports.map(r => r.memberEmail)
  const pending = CARSA_TEAM.filter(m => !submittedEmails.includes(m.email))

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Leader View</h1>
        <p className="text-sm text-[#6B7280] mt-1">Full team activity — visible to you only</p>
      </div>

      {/* Announcement */}
      <div
        className="bg-white rounded-xl p-6 mb-6"
        style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #111827' }}
      >
        <p className="text-sm font-semibold text-[#111827] mb-3">
          Send an announcement to the entire team
        </p>
        <textarea
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          rows={3}
          placeholder="Write your announcement..."
          className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none mb-3"
          style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        />
        {announceStatus === 'sent' && (
          <p className="text-sm mb-3" style={{ color: '#0A7E5A' }}>✅ Announcement sent to all staff.</p>
        )}
        {announceStatus === 'error' && (
          <p className="text-sm mb-3" style={{ color: '#F48221' }}>Something went wrong. Please try again.</p>
        )}
        <button
          onClick={handleAnnouncement}
          disabled={announceStatus === 'sending' || !announcement.trim()}
          className="px-6 py-2 rounded-lg text-sm font-bold text-black"
          style={{ backgroundColor: announceStatus === 'sending' ? '#E5E7EB' : '#F48221' }}
        >
          {announceStatus === 'sending' ? 'Sending...' : 'Send to All Staff'}
        </button>
      </div>

      {/* Date Selector + Status */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
          Daily Reports
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="text-sm text-[#374151] rounded-lg px-3 py-1.5 outline-none"
          style={{ border: '1px solid #E5E7EB', backgroundColor: 'white' }}
        />
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: '#FFF3E0', border: '1px solid #F48221' }}
        >
          <p className="text-sm font-semibold text-[#F48221] mb-2">
            ⚠️ {pending.length} staff {pending.length === 1 ? 'member has' : 'members have'} not submitted yet
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map(m => (
              <span
                key={m.initials}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#FFF3E0', color: '#F48221', border: '1px solid #F48221' }}
              >
                {m.full_name.split(' ')[0]} {m.full_name.split(' ')[1]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div
          className="bg-white rounded-xl p-8 text-center"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <p className="text-sm text-[#6B7280]">No reports submitted for this date yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-xl p-6"
              style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
            >
              {/* Member header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                >
                  {report.memberInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{report.memberName}</p>
                  <p className="text-xs text-[#6B7280]">
                    Submitted at {new Date(report.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Report content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  ['✅ Accomplishments', report.accomplishments],
                  ['💡 Lesson Learned', report.lessons],
                  ['⚠️ Challenge', report.challenges],
                  ['📋 Plan for Tomorrow', report.tomorrow_plan],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[#6B7280] mb-1">{label}</p>
                    <p className="text-sm text-[#374151] leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>

              {/* Comment box */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <p className="text-xs font-semibold text-[#6B7280] mb-2">Your feedback</p>
                <textarea
                  value={comments[report.id] || ''}
                  onChange={e => setComments(prev => ({ ...prev, [report.id]: e.target.value }))}
                  rows={2}
                  placeholder="Leave a comment or feedback for this staff member..."
                  className="w-full px-3 py-2 rounded-lg text-sm text-[#374151] outline-none resize-none mb-2"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleComment(report.id)}
                    disabled={commentStatus[report.id] === 'saving'}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-black"
                    style={{ backgroundColor: '#F48221' }}
                  >
                    {commentStatus[report.id] === 'saving' ? 'Saving...' :
                     commentStatus[report.id] === 'saved' ? '✅ Saved' : 'Send Feedback'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
