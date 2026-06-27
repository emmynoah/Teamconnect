'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

type Field = 'accomplishments' | 'lessons' | 'challenges' | 'tomorrowPlan'

export default function ReportsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userTitle, setUserTitle] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [accomplishments, setAccomplishments] = useState('')
  const [lessons, setLessons] = useState('')
  const [challenges, setChallenges] = useState('')
  const [tomorrowPlan, setTomorrowPlan] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const [fieldSuggestions, setFieldSuggestions] = useState<Partial<Record<Field, string>>>({})
  const [fieldLoading, setFieldLoading] = useState<Partial<Record<Field, boolean>>>({})
  const [describeOpen, setDescribeOpen] = useState<Partial<Record<Field, boolean>>>({})
  const [describeText, setDescribeText] = useState<Partial<Record<Field, string>>>({})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')
      if (user.email === 'christophe.m@carsaministry.org') {
        router.push('/leader')
        return
      }
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

  const improveField = async (field: Field, instruction?: string) => {
    const value = field === 'accomplishments' ? accomplishments
      : field === 'lessons' ? lessons
      : field === 'challenges' ? challenges
      : tomorrowPlan
    if (!value.trim()) return
    setFieldLoading(prev => ({ ...prev, [field]: true }))
    try {
      const res = await fetch('/api/reports/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, instruction }),
      })
      const data = await res.json()
      if (data.improved) {
        setFieldSuggestions(prev => ({ ...prev, [field]: data.improved }))
      }
    } catch {
      // silent fail
    } finally {
      setFieldLoading(prev => ({ ...prev, [field]: false }))
    }
  }

  const applyField = (field: Field) => {
    const suggestion = fieldSuggestions[field]
    if (!suggestion) return
    if (field === 'accomplishments') setAccomplishments(suggestion)
    if (field === 'lessons') setLessons(suggestion)
    if (field === 'challenges') setChallenges(suggestion)
    if (field === 'tomorrowPlan') setTomorrowPlan(suggestion)
    setFieldSuggestions(prev => ({ ...prev, [field]: undefined }))
    setDescribeOpen(prev => ({ ...prev, [field]: false }))
  }

  const dismissField = (field: Field) => {
    setFieldSuggestions(prev => ({ ...prev, [field]: undefined }))
    setDescribeOpen(prev => ({ ...prev, [field]: false }))
  }

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
        body: JSON.stringify({ email: userEmail, accomplishments, lessons, challenges, tomorrowPlan }),
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

  const renderAIWidget = (field: Field) => (
    <>
      {!fieldSuggestions[field] && (
        <button
          onClick={() => improveField(field)}
          disabled={fieldLoading[field]}
          className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
          style={{ backgroundColor: fieldLoading[field] ? '#E5E7EB' : '#0A7E5A' }}
        >
          {fieldLoading[field] ? 'Improving...' : '✨ Improve with AI'}
        </button>
      )}
      {fieldSuggestions[field] && (
        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid #0A7E5A' }}>
          <div className="px-3 py-2" style={{ backgroundColor: '#0A7E5A' }}>
            <span className="text-xs font-bold text-white">✨ AI Writing Assistant</span>
          </div>
          <div className="px-3 py-2 text-sm" style={{ backgroundColor: '#E8F5F0', color: '#111827', lineHeight: '1.6' }}>
            {fieldSuggestions[field]}
          </div>
          <div className="flex gap-2 px-3 py-2 flex-wrap" style={{ backgroundColor: '#111827' }}>
            <button onClick={() => applyField(field)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#0A7E5A' }}>
              Use this version
            </button>
            <button onClick={() => dismissField(field)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
              Keep Original
            </button>
            <button
              onClick={() => setDescribeOpen(prev => ({ ...prev, [field]: !prev[field] }))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: '#F48221', color: '#000000' }}
            >
              Describe what you want
            </button>
          </div>
          {describeOpen[field] && (
            <div className="flex gap-2 px-3 py-2" style={{ backgroundColor: '#1F2937' }}>
              <input
                value={describeText[field] || ''}
                onChange={e => setDescribeText(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="e.g. Make it shorter and more formal..."
                className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: '#374151', color: '#F9FAFB', border: '1px solid #4B5563' }}
              />
              <button
                onClick={() => improveField(field, describeText[field])}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: '#0A7E5A' }}
              >
                Rewrite
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )

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
            {renderAIWidget('accomplishments')}
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
            {renderAIWidget('lessons')}
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
            {renderAIWidget('challenges')}
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
            {renderAIWidget('tomorrowPlan')}
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
