'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: string
  date: string
  accomplishments: string
  lessons: string
  challenges: string
  tomorrow_plan: string
  submitted_at: string
}

export default function MyReportsPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      setReports(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">My Reports</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Your personal report history · {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading your reports...</p>
      ) : reports.length === 0 ? (
        <div
          className="bg-white rounded-xl p-8 text-center"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <p className="text-sm text-[#6B7280]">
            You have not submitted any reports yet. Submit your first report from the Reports page.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-xl overflow-hidden"
              style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
            >
              {/* Report header — always visible */}
              <button
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#F9FAFB] transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    {formatDate(report.date)}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Submitted at {formatTime(report.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                  >
                    ✅ Submitted
                  </span>
                  <span className="text-[#6B7280] text-sm">
                    {expanded === report.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Report content — expandable */}
              {expanded === report.id && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: '1px solid #E5E7EB' }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
