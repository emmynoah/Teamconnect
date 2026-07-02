'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

interface Message {
  id: string
  sender_email: string
  sender_name: string
  sender_initials: string
  sender_photo?: string
  content: string
  visibility: 'team' | 'private'
  recipient_email: string | null
  is_leader_message: boolean
  created_at: string
}

type Comment = {
  id: string
  message_id: string
  sender_email: string
  sender_name: string
  sender_initials: string
  content: string
  created_at: string
}

// Dashboard
export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const [isLeader, setIsLeader] = useState(false)
  const [message, setMessage] = useState('')
  const [visibility, setVisibility] = useState<'team' | 'private'>('team')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [proofread, setProofread] = useState('')
  const [proofreadStatus, setProofreadStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [teamMessages, setTeamMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<Message[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({})
  const [commenterPhotos, setCommenterPhotos] = useState<Record<string, string>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [replySending, setReplySending] = useState<Record<string, boolean>>({})
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [submittedEmails, setSubmittedEmails] = useState<string[]>([])
  const [showStats, setShowStats] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const today = new Date()
  const dateString = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayStr = today.toISOString().split('T')[0]

  const fetchComments = async (messageIds: string[]) => {
    if (messageIds.length === 0) return
    const { data } = await supabase
      .from('message_comments')
      .select('*')
      .in('message_id', messageIds)
      .order('created_at', { ascending: true })
    if (data) {
      const grouped: Record<string, Comment[]> = {}
      data.forEach((c: Comment) => {
        if (!grouped[c.message_id]) grouped[c.message_id] = []
        grouped[c.message_id].push(c)
      })
      setComments(prev => ({ ...prev, ...grouped }))

      const commenterEmails = Array.from(new Set(data.map((c: Comment) => c.sender_email)))
      if (commenterEmails.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, photo_url')
          .in('email', commenterEmails)
        if (profiles) {
          const photoMap: Record<string, string> = {}
          profiles.forEach((p: { email: string, photo_url: string | null }) => {
            if (p.photo_url) photoMap[p.email] = p.photo_url
          })
          setCommenterPhotos(prev => ({ ...prev, ...photoMap }))
        }
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const email = user.email || ''
      setUserEmail(email)

      const match = CARSA_TEAM.find(m => m.email === email)
      if (match) {
        setUserName(match.full_name.split(' ')[0])
        setUserInitials(match.initials)
      }

      const isLeaderOrAdmin =
        email === 'christophe.m@carsaministry.org' ||
        email === 'emmanuel.n@carsaministry.org'
      setIsLeader(email === 'christophe.m@carsaministry.org')
      setShowStats(isLeaderOrAdmin)

      // Fetch reports
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('user_id')
        .eq('date', todayStr)

      const userIds = reports?.map(r => r.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')

      const emails = (profiles || [])
        .filter(p => userIds.includes(p.id))
        .map(p => p.email)

      setSubmittedEmails(emails)
      setSubmittedCount(emails.length)

      // Fetch events
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .gte('date', todayStr)

      setUpcomingCount(events?.length || 0)

      // Fetch messages feed
      const res = await fetch(`/api/messages/feed?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setTeamMessages(data.teamMessages || [])
      setPrivateMessages(data.privateMessages || [])
      fetchComments((data.teamMessages || []).map((m: Message) => m.id))

      setLoading(false)
    }
    init()
  }, [])

  const handleProofread = async () => {
    if (!message.trim()) return
    setProofreadStatus('loading')
    setProofread('')
    try {
      const res = await fetch('/api/dashboard/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      setProofread(data.improved || '')
      setProofreadStatus('done')
    } catch {
      setProofreadStatus('idle')
    }
  }

  const handleSend = async () => {
    if (!message.trim()) return
    if (visibility === 'private' && !recipientEmail) return
    setSendStatus('sending')

    try {
      const match = CARSA_TEAM.find(m => m.email === userEmail)
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          visibility,
          recipientEmail: visibility === 'private' ? recipientEmail : null,
          senderEmail: userEmail,
          senderName: match?.full_name || userName,
          senderInitials: match?.initials || userInitials,
          isLeaderMessage: isLeader && visibility === 'team',
        }),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()

      // Add to local feed immediately
      if (visibility === 'team') {
        setTeamMessages(prev => [data.message, ...prev])
      } else {
        setPrivateMessages(prev => [data.message, ...prev])
      }

      setSendStatus('sent')
      setMessage('')
      setProofread('')
      setTimeout(() => setSendStatus('idle'), 3000)
    } catch {
      setSendStatus('error')
    }
  }

  const postComment = async (messageId: string) => {
    const content = commentInputs[messageId]?.trim()
    if (!content) return
    setCommentLoading(prev => ({ ...prev, [messageId]: true }))
    const { error } = await supabase.from('message_comments').insert({
      message_id: messageId,
      sender_email: userEmail,
      sender_name: userName,
      sender_initials: userInitials,
      content,
    })
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [messageId]: '' }))
      fetchComments([messageId])
    }
    setCommentLoading(prev => ({ ...prev, [messageId]: false }))
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    })
  }

  const getConversationPartner = (msg: Message) => {
    return msg.sender_email === userEmail ? msg.recipient_email : msg.sender_email
  }

  // Canonical thread key — sorts both participants so either direction of a
  // conversation (A→B or B→A) maps to the same thread.
  const getThreadKey = (msg: Message) => {
    return [msg.sender_email, msg.recipient_email || ''].sort().join('__')
  }

  const getConversationPartnerName = (msg: Message) => {
    const partnerEmail = msg.sender_email === userEmail ? msg.recipient_email : msg.sender_email
    const match = CARSA_TEAM.find(m => m.email === partnerEmail)
    if (match) return match.full_name
    return msg.sender_email === userEmail ? (msg.recipient_email || '') : msg.sender_name
  }

  const conversations = privateMessages.reduce((acc: Record<string, Message[]>, msg) => {
    const key = getThreadKey(msg)
    if (!acc[key]) acc[key] = []
    acc[key].push(msg)
    return acc
  }, {})

  // Sort messages within each conversation oldest first
  Object.keys(conversations).forEach(key => {
    conversations[key].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })

  const sendReply = async (partnerEmail: string) => {
    const content = replyInputs[partnerEmail]?.trim()
    if (!content) return
    setReplySending(prev => ({ ...prev, [partnerEmail]: true }))
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          visibility: 'private',
          recipientEmail: partnerEmail,
          senderEmail: userEmail,
          senderName: userName,
          senderInitials: userInitials,
          isLeaderMessage: false,
        }),
      })
      setReplyInputs(prev => ({ ...prev, [partnerEmail]: '' }))
      // Refresh feed
      const res = await fetch(`/api/messages/feed?email=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      if (data.privateMessages) setPrivateMessages(data.privateMessages)
    } catch {
      // silent fail
    } finally {
      setReplySending(prev => ({ ...prev, [partnerEmail]: false }))
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <p className="text-sm text-[#6B7280]">{dateString}</p>
        <h1 className="text-2xl font-bold text-[#111827] mt-1">
          {greeting}, {userName}. It is a new day.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Morning Prompt */}
          <div
            className="bg-white rounded-xl p-6"
            style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
          >
            <p className="text-sm font-semibold text-[#111827] mb-3">
              What do you want to share with the team today?
            </p>

            {/* Visibility toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setVisibility('team')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: visibility === 'team' ? '#0A7E5A' : '#F9FAFB',
                  color: visibility === 'team' ? 'white' : '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                Whole Team
              </button>
              <button
                onClick={() => setVisibility('private')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: visibility === 'private' ? '#111827' : '#F9FAFB',
                  color: visibility === 'private' ? 'white' : '#374151',
                  border: '1px solid #E5E7EB',
                }}
              >
                Private Message
              </button>
            </div>

            {/* Recipient selector for private */}
            {visibility === 'private' && (
              <select
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none mb-3"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
              >
                <option value="">Select a team member...</option>
                {CARSA_TEAM.filter(m => m.email !== userEmail).map(m => (
                  <option key={m.email} value={m.email}>{m.full_name}</option>
                ))}
              </select>
            )}

            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); setProofread('') }}
              rows={3}
              placeholder={visibility === 'team' ? 'Write a message for the team...' : 'Write a private message...'}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none mb-3"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />

            {/* Proofread result */}
            {proofread && (
              <div
                className="rounded-lg p-4 mb-3"
                style={{ backgroundColor: '#E8F5F0', border: '1px solid #0A7E5A' }}
              >
                <p className="text-xs font-semibold text-[#0A7E5A] mb-2">Suggestion</p>
                <p className="text-sm text-[#374151] leading-relaxed">{proofread}</p>
                <button
                  onClick={() => { setMessage(proofread); setProofread('') }}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: '#0A7E5A' }}
                >
                  Use this version
                </button>
              </div>
            )}

            {proofreadStatus === 'loading' && (
              <p className="text-xs text-[#6B7280] mb-3">Proofreading...</p>
            )}

            {sendStatus === 'sent' && (
              <p className="text-sm mb-3" style={{ color: '#0A7E5A' }}>✅ Message sent.</p>
            )}
            {sendStatus === 'error' && (
              <p className="text-sm mb-3" style={{ color: '#F48221' }}>Something went wrong. Please try again.</p>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleProofread}
                disabled={proofreadStatus === 'loading' || !message.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#0A7E5A' }}
              >
                {proofreadStatus === 'loading' ? 'Proofreading...' : 'Proofread with AI'}
              </button>
              <button
                onClick={handleSend}
                disabled={sendStatus === 'sending' || !message.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-black"
                style={{ backgroundColor: sendStatus === 'sending' ? '#E5E7EB' : '#F48221' }}
              >
                {sendStatus === 'sending' ? 'Sending...' : visibility === 'team' ? 'Send to Team' : 'Send Private Message'}
              </button>
            </div>
          </div>

          {/* Team Feed */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
              Team Feed
            </p>
            {loading ? (
              <p className="text-sm text-[#6B7280]">Loading...</p>
            ) : teamMessages.length === 0 ? (
              <div
                className="bg-white rounded-xl p-6 text-center"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <p className="text-sm text-[#6B7280]">No team messages yet. Be the first to share something.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {teamMessages.map(msg => {
                  const isChristophe =
                    msg.sender_email === 'christophe.m@carsaministry.org' ||
                    msg.sender_name === 'Christophe Mbonyingabo'
                  return (
                    <div
                      key={msg.id}
                      className="rounded-xl"
                      style={isChristophe
                        ? { background: '#F0FAF6', borderLeft: '3px solid #0A7E5A', borderRadius: 8, padding: 12 }
                        : { background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }
                      }
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {msg.sender_photo ? (
                          <img src={msg.sender_photo} alt={msg.sender_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                          >
                            {msg.sender_initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${encodeURIComponent(msg.sender_email)}`} className="text-sm font-semibold text-[#111827] hover:text-[#0A7E5A] transition-colors">
                              {msg.sender_name}
                            </Link>
                            {isChristophe && (
                              <span style={{ backgroundColor: '#0A7E5A', color: 'white', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280]">
                            {formatDate(msg.created_at)} at {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed">{msg.content}</p>

                      {/* Comments */}
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                        {(comments[msg.id] || []).map(comment => (
                          <div key={comment.id} className="flex gap-2 mb-2">
                            {commenterPhotos[comment.sender_email] ? (
                              <img src={commenterPhotos[comment.sender_email]} alt={comment.sender_name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                              >
                                {comment.sender_initials}
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-[#111827]">{comment.sender_name}</span>
                              {comment.sender_email === 'christophe.m@carsaministry.org' && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: '#0A7E5A', color: 'white' }}>Leader</span>
                              )}
                              <span className="text-xs text-[#6B7280] ml-2">{formatTime(comment.created_at)}</span>
                              <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          {commenterPhotos[userEmail] ? (
                            <img src={commenterPhotos[userEmail]} alt={userName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: '#F48221', color: 'black' }}
                            >
                              {userInitials}
                            </div>
                          )}
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[msg.id] || ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [msg.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') postComment(msg.id) }}
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-1.5 rounded-lg text-xs text-[#374151] outline-none"
                              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                            />
                            <button
                              onClick={() => postComment(msg.id)}
                              disabled={commentLoading[msg.id]}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{ backgroundColor: commentLoading[msg.id] ? '#E5E7EB' : '#0A7E5A' }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Private Messages */}
          {Object.keys(conversations).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
                Private Messages
              </p>
              <div className="flex flex-col gap-4">
                {Object.entries(conversations).map(([threadKey, msgs]) => {
                  const partnerEmail = getConversationPartner(msgs[0]) || ''
                  const partnerName = getConversationPartnerName(msgs[0])
                  const partnerInitials = msgs.find(m => m.sender_email !== userEmail)?.sender_initials || partnerEmail.slice(0, 2).toUpperCase()
                  const partnerPhoto = msgs.find(m => m.sender_email !== userEmail)?.sender_photo
                  return (
                    <div key={threadKey} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                      {/* Conversation header */}
                      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                        {partnerPhoto ? (
                          <img src={partnerPhoto} alt={partnerName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}>
                            {partnerInitials}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#111827]">{partnerName}</p>
                          {partnerEmail === 'christophe.m@carsaministry.org' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#0A7E5A', color: 'white' }}>Leader</span>
                          )}
                        </div>
                      </div>

                      {/* Messages thread */}
                      <div className="px-4 py-3 flex flex-col gap-3">
                        {msgs.map(msg => {
                          const isMine = msg.sender_email === userEmail
                          return (
                            <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                              {isMine ? (
                                commenterPhotos[userEmail] ? (
                                  <img src={commenterPhotos[userEmail]} alt={userName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#F48221', color: 'black' }}>
                                    {userInitials}
                                  </div>
                                )
                              ) : (
                                partnerPhoto ? (
                                  <img src={partnerPhoto} alt={partnerName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}>
                                    {partnerInitials}
                                  </div>
                                )
                              )}
                              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div
                                  className="px-3 py-2 rounded-xl text-sm leading-relaxed"
                                  style={isMine
                                    ? { backgroundColor: '#0A7E5A', color: 'white', borderRadius: '12px 2px 12px 12px' }
                                    : { backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '2px 12px 12px 12px' }
                                  }
                                >
                                  {msg.content}
                                </div>
                                <p className="text-[10px] text-[#9CA3AF] mt-1">{formatTime(msg.created_at)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Reply input */}
                      <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid #E5E7EB' }}>
                        <input
                          type="text"
                          value={replyInputs[partnerEmail] || ''}
                          onChange={e => setReplyInputs(prev => ({ ...prev, [partnerEmail]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') sendReply(partnerEmail) }}
                          placeholder={`Reply to ${partnerName}...`}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs text-[#374151] outline-none"
                          style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                        />
                        <button
                          onClick={() => sendReply(partnerEmail)}
                          disabled={replySending[partnerEmail]}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: replySending[partnerEmail] ? '#E5E7EB' : '#0A7E5A' }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">

          {/* Stats */}
          <div className="flex flex-col gap-3">
            {showStats && (
              <>
                <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
                  <p className="text-2xl font-bold" style={{ color: '#0A7E5A' }}>{submittedCount}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Reports submitted</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
                  <p className="text-2xl font-bold" style={{ color: '#F48221' }}>{CARSA_TEAM.length - submittedCount}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Still pending</p>
                </div>
              </>
            )}
            <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-2xl font-bold text-[#111827]">{upcomingCount}</p>
              <p className="text-xs text-[#6B7280] mt-1">Upcoming events</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-2xl font-bold text-[#111827]">{CARSA_TEAM.length}</p>
              <p className="text-xs text-[#6B7280] mt-1">Team members</p>
            </div>
          </div>

          {/* Report Status — leader/admin only */}
          {(isLeader || userEmail === 'emmanuel.n@carsaministry.org') && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
                Today&apos;s report status
              </p>
              <div className="flex flex-col gap-2">
                {CARSA_TEAM.map(member => (
                  <div
                    key={member.initials}
                    className="bg-white rounded-xl p-3 flex items-center gap-3"
                    style={{ border: '1px solid #E5E7EB' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}
                    >
                      {member.initials}
                    </div>
                    <p className="text-xs font-medium text-[#111827] flex-1 truncate">
                      {member.full_name.split(' ')[0]}
                    </p>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: submittedEmails.includes(member.email) ? '#0A7E5A' : '#D1D5DB' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
