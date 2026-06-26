'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

export default function ReportsPage() {
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [userTitle, setUserTitle] = useState('')
  const [accomplishments, setAccomplishments] = useState('')
  const [lessons, setLessons] = useState('')
  const [challenges, setChallenges] = useState('')
  const [tomorrowPlan, setTomorrowPlan] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const match = CARSA_TEAM.find(m => m.email === user.email)
      if (match) {
        setUserName(match.full_name)
        setUserTitle(match.title)
      } else {
        const parts = (user.email || '').split('@')[0].split('.')
        setUserName(parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '))
        setUserTitle('')
      }
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!accomplishments || !lessons || !challenges || !tomorrowPlan) {
      setErrorMessage('Please fill in all fields before submitting.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accomplishments, lessons, challenges, tomorrowPlan }),
      })

      if (!res.ok) throw new Error('Submission failed')

      setStatus('success')
      setAccomplishments('')
      setLessons('')
      setChallenges('')
      setTomorrowPlan('')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">Daily Report</h1>
        <p className="text-[#6B7280] mt-1 text-sm">Submit your end-of-day report · takes 5 minutes</p>
      </div>

      {status === 'success' ? (
        <div
          className="bg-white rounded-xl p-8 text-center"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#E8F5F0' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="#0A7E5A" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#111827] mb-2">Report Submitted</h2>
          <p className="text-[#6B7280] text-sm mb-6">Your report has been sent to the Executive Director.</p>
          <button
            onClick={() => setStatus('idle')}
            className="px-6 py-2 rounded-lg text-sm font-medium text-black transition-colors duration-150"
            style={{ backgroundColor: '#F48221' }}
          >
            Submit Another Report
          </button>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl p-6 max-w-2xl"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
        >
          {/* Logged-in user — read-only */}
          <div className="mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p className="text-sm font-semibold text-[#111827]">{userName || '...'}</p>
            {userTitle && <p className="text-xs text-[#6B7280] mt-0.5">{userTitle}</p>}
          </div>

          {/* Question 1 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              ✅ What did you accomplish today?
            </label>
            <p className="text-xs text-[#6B7280] mb-2">List your key activities and completed tasks.</p>
            <textarea
              value={accomplishments}
              onChange={e => setAccomplishments(e.target.value)}
              rows={3}
              placeholder="e.g. Met with CBL representatives, reviewed Q3 report draft..."
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          {/* Question 2 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              💡 What did you learn today?
            </label>
            <p className="text-xs text-[#6B7280] mb-2">One lesson, insight, or observation from your work.</p>
            <textarea
              value={lessons}
              onChange={e => setLessons(e.target.value)}
              rows={3}
              placeholder="e.g. Early communication with partners prevents last-minute surprises..."
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          {/* Question 3 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              ⚠️ What challenge did you face?
            </label>
            <p className="text-xs text-[#6B7280] mb-2">Be honest. This helps leadership support you.</p>
            <textarea
              value={challenges}
              onChange={e => setChallenges(e.target.value)}
              rows={3}
              placeholder="e.g. Donor report template needs updating before Friday deadline..."
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          {/* Question 4 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              📋 What is your plan for tomorrow?
            </label>
            <p className="text-xs text-[#6B7280] mb-2">Your top priorities for the next working day.</p>
            <textarea
              value={tomorrowPlan}
              onChange={e => setTomorrowPlan(e.target.value)}
              rows={3}
              placeholder="e.g. Draft updated donor report template and share with Sylvestre..."
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="text-sm mb-4" style={{ color: '#F48221' }}>{errorMessage}</p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={status === 'submitting'}
            className="w-full py-3 rounded-lg text-sm font-bold text-black transition-colors duration-150"
            style={{ backgroundColor: status === 'submitting' ? '#E5E7EB' : '#F48221' }}
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Daily Report'}
          </button>
        </div>
      )}
    </div>
  )
}
