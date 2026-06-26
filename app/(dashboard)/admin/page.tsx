'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

export default function AdminPage() {
  const supabase = createClient()
  const [submittedCount, setSubmittedCount] = useState(0)
  const [submittedEmails, setSubmittedEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchData = async () => {
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('user_id')
        .eq('date', today)

      const userIds = reports?.map(r => r.user_id) || []

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')

      const emails = (profiles || [])
        .filter(p => userIds.includes(p.id))
        .map(p => p.email)

      setSubmittedEmails(emails)
      setSubmittedCount(emails.length)
      setLoading(false)
    }
    fetchData()
  }, [])

  const pending = CARSA_TEAM.filter(m => !submittedEmails.includes(m.email))
  const submitted = CARSA_TEAM.filter(m => submittedEmails.includes(m.email))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Admin</h1>
        <p className="text-sm text-[#6B7280] mt-1">System overview · visible to you only</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-bold" style={{ color: '#0A7E5A' }}>{submittedCount}</p>
          <p className="text-xs text-[#6B7280] mt-1">Reports submitted today</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-bold" style={{ color: '#F48221' }}>{pending.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">Still pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
          <p className="text-2xl font-bold text-[#111827]">{CARSA_TEAM.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">Total staff</p>
        </div>
      </div>

      {/* Submitted */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
          Submitted today — {submitted.length}
        </p>
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-[#6B7280]">Loading...</p>
          ) : submitted.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No reports submitted yet today.</p>
          ) : (
            submitted.map(member => (
              <div
                key={member.initials}
                className="bg-white rounded-xl p-4 flex items-center gap-3"
                style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                >
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{member.full_name}</p>
                  <p className="text-xs text-[#6B7280]">{member.title}</p>
                </div>
                <span
                  className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                >
                  ✅ Submitted
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending */}
      <div>
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
          Pending — {pending.length}
        </p>
        <div className="flex flex-col gap-2">
          {pending.map(member => (
            <div
              key={member.initials}
              className="bg-white rounded-xl p-4 flex items-center gap-3"
              style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #F48221' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: '#FFF3E0', color: '#F48221' }}
              >
                {member.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">{member.full_name}</p>
                <p className="text-xs text-[#6B7280]">{member.title}</p>
              </div>
              <span
                className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#FFF3E0', color: '#F48221' }}
              >
                ⏳ Pending
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
