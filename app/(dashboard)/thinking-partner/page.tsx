'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Conversation = {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

export default function ThinkingPartnerPage() {
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find(c => c.id === activeId)
  const messages = activeConversation?.messages || []

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const match = CARSA_TEAM.find(m => m.email === user.email)
      if (match) {
        setUserName(match.full_name.split(' ')[0])
        setUserInitials(match.initials)
      }
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startNewConversation = () => {
    const id = Date.now().toString()
    const newConv: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString()
    }
    setConversations(prev => [newConv, ...prev])
    setActiveId(id)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    let currentId = activeId
    if (!currentId) {
      const id = Date.now().toString()
      const newConv: Conversation = {
        id,
        title: input.slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString()
      }
      setConversations(prev => [newConv, ...prev])
      setActiveId(id)
      currentId = id
    }

    const userMessage: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]

    setConversations(prev => prev.map(c =>
      c.id === currentId
        ? { ...c, messages: updatedMessages, title: c.messages.length === 0 ? input.slice(0, 40) : c.title }
        : c
    ))
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/thinking-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, userName })
      })
      const data = await res.json()
      if (data.reply) {
        const assistantMessage: Message = { role: 'assistant', content: data.reply }
        setConversations(prev => prev.map(c =>
          c.id === currentId
            ? { ...c, messages: [...updatedMessages, assistantMessage] }
            : c
        ))
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const starterPrompts = [
    'Help me write a field report',
    'Plan a peace club session',
    'What does CARSA believe about trauma?',
    'How do I handle conflict in a group session?',
  ]

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/---/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n(?!\n)/g, ' ')
      .trim()
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -my-8 overflow-hidden">

      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ backgroundColor: '#0A7E5A' }}>TP</div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Thinking Partner</p>
              <p className="text-xs text-[#6B7280]">CARSA Internal</p>
            </div>
          </div>
        </div>

        <button
          onClick={startNewConversation}
          className="mx-3 my-3 py-2 rounded-lg text-xs font-semibold text-white text-center transition-colors"
          style={{ backgroundColor: '#0A7E5A' }}
        >
          + New conversation
        </button>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.length > 0 && (
            <p className="text-[10px] text-[#9CA3AF] px-2 py-1 uppercase tracking-wider">Recent</p>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className="w-full text-left px-2 py-2 rounded-lg text-xs mb-1 truncate transition-colors"
              style={{
                backgroundColor: activeId === conv.id ? '#E8F5F0' : 'transparent',
                color: activeId === conv.id ? '#0A7E5A' : '#6B7280',
                fontWeight: activeId === conv.id ? '500' : '400',
                borderLeft: activeId === conv.id ? '3px solid #0A7E5A' : '3px solid transparent',
              }}
            >
              {conv.title}
            </button>
          ))}
        </div>

        <div className="p-3 border-t" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#F48221', color: '#000' }}>{userInitials}</div>
            <p className="text-xs text-[#6B7280] truncate">{userName}</p>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#ffffff' }}>

        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E5E7EB' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A', border: '1px solid #0A7E5A' }}>TP</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#111827]">CARSA Thinking Partner</p>
            <p className="text-xs text-[#6B7280]">Reconciliation, trauma healing and community development adviser</p>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A' }}>Ready</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A', border: '1px solid #0A7E5A' }}>TP</div>
                <p className="text-center text-base font-semibold text-[#111827]">Hello{userName ? `, ${userName}` : ''}.</p>
                <p className="text-center text-sm text-[#6B7280] mt-1 max-w-xs">I am here to think with you about CARSA&apos;s work, your field challenges, and anything you need to serve the community better.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors"
                    style={{ color: '#0A7E5A', border: '1px solid #0A7E5A', backgroundColor: 'transparent' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={msg.role === 'assistant'
                  ? { backgroundColor: '#E8F5F0', color: '#0A7E5A', border: '1px solid #0A7E5A' }
                  : { backgroundColor: '#F48221', color: '#000' }
                }
              >
                {msg.role === 'assistant' ? 'TP' : userInitials}
              </div>
              <div
                className="max-w-[75%] px-4 py-2.5 text-sm leading-relaxed"
                style={msg.role === 'assistant'
                  ? { backgroundColor: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: '2px 12px 12px 12px', color: '#374151' }
                  : { backgroundColor: '#0A7E5A', borderRadius: '12px 2px 12px 12px', color: 'white' }
                }
              >
                {msg.role === 'assistant'
                  ? cleanMarkdown(msg.content).split('\n\n').map((paragraph, i) => (
                      <p key={i} style={{ marginBottom: i < cleanMarkdown(msg.content).split('\n\n').length - 1 ? '12px' : '0' }}>
                        {paragraph}
                      </p>
                    ))
                  : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A', border: '1px solid #0A7E5A' }}>TP</div>
              <div className="px-4 py-2.5 text-sm" style={{ backgroundColor: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: '2px 12px 12px 12px', color: '#6B7280' }}>Thinking...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t flex gap-2 items-end" style={{ borderColor: '#E5E7EB' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your Thinking Partner anything..."
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
            style={{ border: '0.5px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-black font-bold text-base transition-colors"
            style={{ backgroundColor: loading || !input.trim() ? '#E5E7EB' : '#F48221' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
