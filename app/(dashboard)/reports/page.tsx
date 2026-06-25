'use client'

import { useState } from 'react'
import { CARSA_TEAM, TEAM_NAMES } from '@/lib/team'

export default function ReportsPage() {
  const [selectedStaff, setSelectedStaff] = useState('')
  const [accomplishments, setAccomplishments] = useState('')
  const [lessons, setLessons] = useState('')
  const [challenges, setChallenges] = useState('')
  const [tomorrowPlan, setTomorrowPlan] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!selectedStaff || !accomplishments || !lessons || !challenges || !tomorrowPlan) {
      setErrorMessage('Please fill in all fields before submitting.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    const staff = CARSA_TEAM.find(m => m.full_name === selectedStaff)

    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedStaff,
          title: staff?.title || '',
          accomplishments,
          lessons,
          challenges,
          tomorrowPlan,
        }),
      })

      if (!res.ok) throw new Error('Submission failed')

      setStatus('success')
      setSelectedStaff('')
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
          {/* Staff Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Your Name
            </label>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none focus:ring-2"
              style={{
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
              }}
            >
              <option value="">Select your name</option>
              {TEAM_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
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
