'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

type LeaveRequest = {
  id: string
  full_name: string
  job_title: string
  leave_type: string
  leave_code: string
  start_date: string
  end_date: string
  working_days: number
  handover_person: string
  contact_during_leave: string
  reason: string
  first_approval: string
  first_approval_comment: string
  final_approval: string
  final_approval_comment: string
  status: string
  created_at: string
  user_id: string
}

const LEAVE_TYPES = [
  { label: 'Annual Leave', code: 'AL', days: 18 },
  { label: 'Sick Leave', code: 'SL', days: null },
  { label: 'Maternity Leave', code: 'ML', days: 98 },
  { label: 'Paternity Leave', code: 'PL', days: 7 },
  { label: 'Compassionate Leave', code: 'CL', days: 4 },
  { label: 'Study Leave', code: 'EL', days: null },
  { label: 'Unpaid Leave', code: 'UL', days: 0 },
]

function getWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function LeavePage() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userTitle, setUserTitle] = useState('')
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([])
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [orgId, setOrgId] = useState('')
  const [activeTab, setActiveTab] = useState<'request' | 'my-leaves' | 'team' | 'approve'>('request')
  const [leaveType, setLeaveType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [handoverPerson, setHandoverPerson] = useState('')
  const [contact, setContact] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isCansilde = userEmail === 'cansilde.n@carsaministry.org'
  const isChristophe = userEmail === 'christophe.m@carsaministry.org'
  const isAdmin = userEmail === 'emmanuel.n@carsaministry.org'
  const canApprove = isCansilde || isChristophe || isAdmin

  const workingDays = getWorkingDays(startDate, endDate)
  const selectedLeaveType = LEAVE_TYPES.find(l => l.label === leaveType)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      setUserId(user.id)
      const match = CARSA_TEAM.find(m => m.email === user.email)
      if (match) {
        setUserName(match.full_name)
        setUserTitle(match.title)
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()
      if (profile) setOrgId(profile.org_id)
      fetchRequests(user.id, user.email || '')
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRequests = async (uid: string, email: string) => {
    const { data: mine } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (mine) setMyRequests(mine)

    const { data: all } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (all) setAllRequests(all)
  }

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate || !handoverPerson || !contact || !reason) {
      setErrorMessage('Please fill in all fields.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage('End date cannot be before start date.')
      return
    }
    setStatus('submitting')
    setErrorMessage('')

    const firstApproval = isCansilde ? 'Approved' : isChristophe ? 'Approved' : 'Pending'
    const finalApproval = isChristophe ? 'Approved' : 'Pending'
    const requestStatus = isChristophe ? 'Approved' : isCansilde ? 'Pending Final' : 'Pending'

    const { error } = await supabase.from('leave_requests').insert({
      user_id: userId,
      org_id: orgId,
      full_name: userName,
      job_title: userTitle,
      leave_type: leaveType,
      leave_code: selectedLeaveType?.code || '',
      start_date: startDate,
      end_date: endDate,
      working_days: workingDays,
      handover_person: handoverPerson,
      contact_during_leave: contact,
      reason,
      first_approval: firstApproval,
      final_approval: finalApproval,
      status: requestStatus,
    })

    if (error) {
      setStatus('error')
      setErrorMessage('Submission failed. Please try again.')
      return
    }

    setStatus('success')
    setLeaveType('')
    setStartDate('')
    setEndDate('')
    setHandoverPerson('')
    setContact('')
    setReason('')
    fetchRequests(userId, userEmail)
  }

  const handleApproval = async (requestId: string, stage: 'first' | 'final', decision: 'Approved' | 'Rejected', comment: string) => {
    const updates: Record<string, string> = {}
    if (stage === 'first') {
      updates.first_approval = decision
      updates.first_approval_comment = comment
      updates.status = decision === 'Approved' ? 'Pending Final' : 'Rejected'
    } else {
      updates.final_approval = decision
      updates.final_approval_comment = comment
      updates.status = decision === 'Approved' ? 'Approved' : 'Rejected'
    }
    await supabase.from('leave_requests').update(updates).eq('id', requestId)
    fetchRequests(userId, userEmail)
  }

  const todayOnLeave = allRequests.filter(r => {
    if (r.status !== 'Approved') return false
    const today = new Date().toISOString().slice(0, 10)
    return r.start_date <= today && r.end_date >= today
  })

  const pendingFirstApproval = allRequests.filter(r => r.first_approval === 'Pending' && r.status === 'Pending')
  const pendingFinalApproval = allRequests.filter(r => r.first_approval === 'Approved' && r.final_approval === 'Pending' && r.status === 'Pending Final')

  const statusColor = (s: string) => {
    if (s === 'Approved') return { backgroundColor: '#E8F5F0', color: '#0A7E5A' }
    if (s === 'Rejected') return { backgroundColor: '#FEE2E2', color: '#DC2626' }
    if (s === 'Pending Final') return { backgroundColor: '#FEF3C7', color: '#D97706' }
    return { backgroundColor: '#F3F4F6', color: '#6B7280' }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Leave Management</h1>
        <p className="text-[#6B7280] mt-1 text-sm">Submit and track leave requests</p>
      </div>

      {todayOnLeave.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
          <p className="text-sm font-semibold text-[#92400E] mb-2">Currently on leave today:</p>
          <div className="flex flex-wrap gap-2">
            {todayOnLeave.map(r => (
              <span key={r.id} className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#F48221', color: 'black' }}>
                {r.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        {[
          { key: 'request', label: 'New Request' },
          { key: 'my-leaves', label: 'My Leaves' },
          { key: 'team', label: 'Team Overview' },
          ...(canApprove ? [{ key: 'approve', label: `Approvals ${pendingFirstApproval.length + pendingFinalApproval.length > 0 ? `(${pendingFirstApproval.length + pendingFinalApproval.length})` : ''}` }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.key ? '#0A7E5A' : '#6B7280',
              borderBottom: activeTab === tab.key ? '2px solid #0A7E5A' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'request' && (
        <div className="bg-white rounded-xl p-6 max-w-2xl" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}>
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8F5F0' }}>
                <svg className="w-7 h-7" fill="none" stroke="#0A7E5A" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#111827] mb-2">Request Submitted</h2>
              <p className="text-[#6B7280] text-sm mb-6">Your leave request has been sent for approval.</p>
              <button onClick={() => setStatus('idle')} className="px-6 py-2 rounded-lg text-sm font-bold text-black" style={{ backgroundColor: '#F48221' }}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 px-4 py-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="text-sm font-semibold text-[#111827]">{userName}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{userTitle}</p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#111827] mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                >
                  <option value="">Select leave type...</option>
                  {LEAVE_TYPES.map(l => (
                    <option key={l.code} value={l.label}>{l.label} {l.days ? `(${l.days} days/year)` : '(flexible)'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
                </div>
              </div>

              {workingDays > 0 && (
                <div className="mb-5 px-4 py-2 rounded-lg" style={{ backgroundColor: '#E8F5F0' }}>
                  <p className="text-sm font-semibold text-[#0A7E5A]">{workingDays} working {workingDays === 1 ? 'day' : 'days'}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#111827] mb-1">Person Covering Your Duties</label>
                <input type="text" value={handoverPerson} onChange={e => setHandoverPerson(e.target.value)} placeholder="Full name of colleague covering you" className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#111827] mb-1">Your Contact During Leave</label>
                <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone number or email" className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#111827] mb-1">Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Brief reason for your leave request" className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
              </div>

              {errorMessage && <p className="text-sm mb-4" style={{ color: '#F48221' }}>{errorMessage}</p>}

              <button onClick={handleSubmit} disabled={status === 'submitting'} className="w-full py-3 rounded-lg text-sm font-bold text-black transition-colors" style={{ backgroundColor: status === 'submitting' ? '#E5E7EB' : '#F48221' }}>
                {status === 'submitting' ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'my-leaves' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-[#6B7280] text-sm">You have not submitted any leave requests yet.</p>
            </div>
          ) : myRequests.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#111827]">{r.leave_type}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{r.start_date} to {r.end_date} · {r.working_days} working {r.working_days === 1 ? 'day' : 'days'}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={statusColor(r.status)}>{r.status}</span>
              </div>
              <p className="text-sm text-[#374151]">{r.reason}</p>
              {r.first_approval_comment && <p className="text-xs text-[#6B7280] mt-2">Cansilde: {r.first_approval_comment}</p>}
              {r.final_approval_comment && <p className="text-xs text-[#6B7280] mt-1">Christophe: {r.final_approval_comment}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-3">
          {allRequests.filter(r => r.status === 'Approved').length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-[#6B7280] text-sm">No approved leave requests to show.</p>
            </div>
          ) : allRequests.filter(r => r.status === 'Approved').map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 flex items-center justify-between" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <p className="font-semibold text-sm text-[#111827]">{r.full_name}</p>
                <p className="text-xs text-[#6B7280]">{r.leave_type} · {r.start_date} to {r.end_date} · {r.working_days} days</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={statusColor(r.status)}>{r.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'approve' && canApprove && (
        <div className="space-y-6">
          {isCansilde && pendingFirstApproval.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#111827] mb-3">Pending First Approval</h2>
              <div className="space-y-3">
                {pendingFirstApproval.map(r => (
                  <ApprovalCard key={r.id} request={r} stage="first" onDecision={handleApproval} />
                ))}
              </div>
            </div>
          )}
          {(isChristophe || isAdmin) && pendingFinalApproval.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#111827] mb-3">Pending Final Approval</h2>
              <div className="space-y-3">
                {pendingFinalApproval.map(r => (
                  <ApprovalCard key={r.id} request={r} stage="final" onDecision={handleApproval} />
                ))}
              </div>
            </div>
          )}
          {pendingFirstApproval.length === 0 && pendingFinalApproval.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-[#6B7280] text-sm">No pending approvals.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ request, stage, onDecision }: {
  request: LeaveRequest
  stage: 'first' | 'final'
  onDecision: (id: string, stage: 'first' | 'final', decision: 'Approved' | 'Rejected', comment: string) => void
}) {
  const [comment, setComment] = useState('')
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-[#111827]">{request.full_name}</p>
          <p className="text-xs text-[#6B7280]">{request.job_title}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[#111827]">{request.leave_type}</p>
          <p className="text-xs text-[#6B7280]">{request.start_date} to {request.end_date} · {request.working_days} days</p>
        </div>
      </div>
      <p className="text-sm text-[#374151] mb-3">{request.reason}</p>
      <p className="text-xs text-[#6B7280] mb-1">Covering: {request.handover_person} · Contact: {request.contact_during_leave}</p>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Add a comment (optional)..."
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm text-[#374151] outline-none resize-none mb-3 mt-2"
        style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
      />
      <div className="flex gap-2">
        <button onClick={() => onDecision(request.id, stage, 'Approved', comment)} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: '#0A7E5A' }}>
          Approve
        </button>
        <button onClick={() => onDecision(request.id, stage, 'Rejected', comment)} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: '#DC2626' }}>
          Reject
        </button>
      </div>
    </div>
  )
}
