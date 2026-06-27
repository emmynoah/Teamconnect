'use client'

import { useParams, useRouter } from 'next/navigation'
import { CARSA_TEAM } from '@/lib/team'
import Link from 'next/link'

export default function StaffProfilePage() {
  const params = useParams()
  const router = useRouter()
  const emailParam = decodeURIComponent(params.email as string)
  const member = CARSA_TEAM.find(m => m.email === emailParam)

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6B7280]">Staff member not found.</p>
        <Link href="/directory" className="text-[#0A7E5A] text-sm mt-4 inline-block">Back to Directory</Link>
      </div>
    )
  }

  const isLeader = member.email === 'christophe.m@carsaministry.org'
  const isAdmin = member.email === 'emmanuel.n@carsaministry.org'

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-sm text-[#6B7280] mb-6 flex items-center gap-1 hover:text-[#111827] transition-colors"
      >
        Back to Directory
      </button>

      <div className="bg-white rounded-xl p-8" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F5F0' }}>
            <span className="font-bold text-lg" style={{ color: '#0A7E5A' }}>{member.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#111827]">{member.full_name}</h1>
              {isLeader && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: '#0A7E5A', color: 'white' }}>Leader</span>
              )}
              {isAdmin && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: '#F48221', color: 'black' }}>Admin</span>
              )}
            </div>
            <p className="text-[#6B7280] text-sm mt-1">{member.title}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <span className="text-xs font-semibold text-[#6B7280] w-28">Email</span>
            <a href={`mailto:${member.email}`} className="text-sm" style={{ color: '#0A7E5A' }}>{member.email}</a>
          </div>
          <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <span className="text-xs font-semibold text-[#6B7280] w-28">Title</span>
            <span className="text-sm text-[#374151]">{member.title}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <span className="text-xs font-semibold text-[#6B7280] w-28">Phone</span>
            <span className="text-sm text-[#374151]">{member.phone || 'Not listed'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {member.phone && (
            <a
              href={`https://wa.me/${member.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
              style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
            >
              WhatsApp
            </a>
          )}
          <a
            href={`mailto:${member.email}`}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center text-black transition-colors"
            style={{ backgroundColor: '#F48221' }}
          >
            Email
          </a>
        </div>
      </div>
    </div>
  )
}
