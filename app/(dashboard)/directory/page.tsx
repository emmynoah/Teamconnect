'use client'

import { useState, useEffect } from 'react'
import { CARSA_TEAM } from '@/lib/team'

export default function DirectoryPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('directory_view')
    if (saved === 'list' || saved === 'grid') setView(saved)
  }, [])

  const toggleView = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem('directory_view', v)
  }

  const filtered = CARSA_TEAM.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Staff Directory</h1>
          <p className="text-sm text-[#6B7280] mt-1">CARSA team · {CARSA_TEAM.length} members</p>
        </div>

        {/* View Toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <button
            onClick={() => toggleView('grid')}
            className="px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: view === 'grid' ? '#111827' : 'white',
              color: view === 'grid' ? 'white' : '#374151',
            }}
          >
            Grid
          </button>
          <button
            onClick={() => toggleView('list')}
            className="px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: view === 'list' ? '#111827' : 'white',
              color: view === 'list' ? 'white' : '#374151',
              borderLeft: '1px solid #E5E7EB',
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
          style={{ border: '1px solid #E5E7EB', backgroundColor: 'white' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div
          className="bg-white rounded-xl p-8 text-center"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <p className="text-sm text-[#6B7280]">No staff members found for &quot;{search}&quot;</p>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(member => (
            <div
              key={member.initials}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 p-5 flex flex-col gap-4"
              style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#E8F5F0' }}
                >
                  <span className="font-bold text-sm" style={{ color: '#0A7E5A' }}>
                    {member.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug truncate" style={{ color: '#111827' }}>
                    {member.full_name}
                  </p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#6B7280' }}>
                    {member.title}
                  </p>
                </div>
              </div>

              <div>
                {member.email === 'christophe.m@carsaministry.org' && (
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded"
                    style={{ backgroundColor: '#0A7E5A', color: 'white' }}
                  >
                    Leader
                  </span>
                )}
                {member.email === 'emmanuel.n@carsaministry.org' && (
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded"
                    style={{ backgroundColor: '#F48221', color: 'black' }}
                  >
                    Admin
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <a
                  href={member.phone ? `https://wa.me/${member.phone}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors duration-150"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#0A7E5A' }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={member.email ? `mailto:${member.email}` : '#'}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors duration-150"
                  style={{ backgroundColor: '#F48221', color: '#000000' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map(member => (
            <div
              key={member.initials}
              className="bg-white rounded-xl p-4 flex items-center gap-4"
              style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#E8F5F0' }}
              >
                <span className="font-bold text-sm" style={{ color: '#0A7E5A' }}>
                  {member.initials}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm" style={{ color: '#111827' }}>
                    {member.full_name}
                  </p>
                  {member.email === 'christophe.m@carsaministry.org' && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#0A7E5A', color: 'white' }}
                    >
                      Leader
                    </span>
                  )}
                  {member.email === 'emmanuel.n@carsaministry.org' && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#F48221', color: 'black' }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>{member.title}</p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={member.phone ? `https://wa.me/${member.phone}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                  style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
                >
                  WhatsApp
                </a>
                <a
                  href={member.email ? `mailto:${member.email}` : '#'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
                  style={{ backgroundColor: '#F48221', color: '#000000' }}
                >
                  Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
