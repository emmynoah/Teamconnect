'use client'

import { useState, useEffect } from 'react'
import { TEAM_NAMES } from '@/lib/team'

type EventType = 'meeting' | 'visitor' | 'event' | 'training' | 'other'

interface CalendarEvent {
  id: string
  title: string
  type: EventType
  date: string
  time: string
  description: string
  host_user_id: string | null
  host?: string
}

const eventTypeColors: Record<EventType, { bg: string; text: string; label: string }> = {
  visitor: { bg: '#FFF3E0', text: '#F48221', label: 'Visitor' },
  meeting: { bg: '#E8F5F0', text: '#0A7E5A', label: 'Meeting' },
  event: { bg: '#EEF2FF', text: '#4F46E5', label: 'Event' },
  training: { bg: '#FDF2F8', text: '#9D174D', label: 'Training' },
  other: { bg: '#F3F4F6', text: '#6B7280', label: 'Other' },
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting' as EventType,
    date: '',
    time: '',
    description: '',
    host: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch events on page load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/calendar/get-events')
        const data = await res.json()
        if (data.events) setEvents(data.events)
      } catch {
        console.error('Failed to fetch events')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.time || !formData.host) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      // Save to Supabase
      const saveRes = await fetch('/api/calendar/save-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!saveRes.ok) throw new Error('Failed to save event')
      const { event } = await saveRes.json()

      // Notify security if visitor
      if (formData.type === 'visitor') {
        const notifyRes = await fetch('/api/calendar/notify-security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!notifyRes.ok) throw new Error('Failed to notify security')
      }

      // Add to local state with host name preserved
      setEvents(prev => [...prev, { ...event, host: formData.host }]
        .sort((a, b) => a.date.localeCompare(b.date)))

      setFormData({ title: '', type: 'meeting', date: '', time: '', description: '', host: '' })
      setShowForm(false)
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = events.filter(e => e.date >= today)
  const pastEvents = events.filter(e => e.date < today)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Calendar</h1>
          <p className="text-[#6B7280] mt-1 text-sm">CARSA team · upcoming schedules and visitors</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors duration-150"
          style={{ backgroundColor: '#F48221' }}
        >
          + Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div
          className="bg-white rounded-xl p-6 mb-8 max-w-2xl"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
        >
          <h2 className="text-base font-bold text-[#111827] mb-6">New Event or Visitor</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Title <span style={{ color: '#F48221' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Visit from CBL Representative"
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Type <span style={{ color: '#F48221' }}>*</span>
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value as EventType }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            >
              <option value="meeting">Meeting</option>
              <option value="visitor">Visitor</option>
              <option value="event">Event</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.type === 'visitor' && (
            <div
              className="rounded-lg px-4 py-3 mb-4 text-sm"
              style={{ backgroundColor: '#FFF3E0', color: '#F48221' }}
            >
              ⚠️ Security will be automatically notified when you submit this visitor.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">
                Date <span style={{ color: '#F48221' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">
                Time <span style={{ color: '#F48221' }}>*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Host Staff Member <span style={{ color: '#F48221' }}>*</span>
            </label>
            <select
              value={formData.host}
              onChange={e => setFormData(p => ({ ...p, host: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            >
              <option value="">Select host</option>
              {TEAM_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Description / Purpose
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="e.g. Quarterly program review with CBL field coordinator..."
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none resize-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          {errorMessage && (
            <p className="text-sm mb-4" style={{ color: '#F48221' }}>{errorMessage}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="flex-1 py-3 rounded-lg text-sm font-bold text-black transition-colors duration-150"
              style={{ backgroundColor: status === 'submitting' ? '#E5E7EB' : '#F48221' }}
            >
              {status === 'submitting' ? 'Saving...' : 'Save Event'}
            </button>
            <button
              onClick={() => { setShowForm(false); setErrorMessage('') }}
              className="px-6 py-3 rounded-lg text-sm font-medium text-[#374151] transition-colors duration-150"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[#6B7280]">Loading events...</p>
        </div>
      )}

      {/* Upcoming Events */}
      {!loading && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Upcoming — {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'}
          </h2>

          {upcomingEvents.length === 0 ? (
            <div
              className="bg-white rounded-xl p-8 text-center"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <p className="text-[#6B7280] text-sm">No upcoming events. Click <strong>+ Add Event</strong> to schedule one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingEvents.map(event => {
                const colors = eventTypeColors[event.type]
                const dateFormatted = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                })
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl p-5 flex items-start gap-4"
                    style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
                  >
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-xs text-[#6B7280]">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</p>
                      <p className="text-2xl font-bold text-[#111827] leading-none">{new Date(event.date + 'T00:00:00').getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm text-[#111827]">{event.title}</p>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {colors.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">{dateFormatted} · {event.time} · Host: {event.host || '—'}</p>
                      {event.description && (
                        <p className="text-sm text-[#374151] mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Past Events */}
      {!loading && pastEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Past — {pastEvents.length} {pastEvents.length === 1 ? 'event' : 'events'}
          </h2>
          <div className="flex flex-col gap-3">
            {pastEvents.map(event => {
              const colors = eventTypeColors[event.type]
              const dateFormatted = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
              })
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-5 flex items-start gap-4 opacity-60"
                  style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #E5E7EB' }}
                >
                  <div className="flex-shrink-0 text-center w-12">
                    <p className="text-xs text-[#6B7280]">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</p>
                    <p className="text-2xl font-bold text-[#6B7280] leading-none">{new Date(event.date + 'T00:00:00').getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm text-[#6B7280]">{event.title}</p>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {colors.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">{dateFormatted} · {event.time} · Host: {event.host || '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
