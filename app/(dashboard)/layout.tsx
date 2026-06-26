'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')

      const match = CARSA_TEAM.find(m => m.email === user.email)
      if (match) {
        setUserName(match.full_name.split(' ').slice(0, 2).join(' '))
        setUserInitials(match.initials)
      } else {
        const parts = (user.email || '').split('@')[0].split('.')
        setUserName(parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '))
        setUserInitials(parts.map((p: string) => p.charAt(0).toUpperCase()).join('').slice(0, 2))
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/directory', label: 'Directory' },
    { href: '/reports', label: 'Reports' },
    { href: '/calendar', label: 'Calendar' },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <nav className="bg-[#111827] h-16 flex items-center px-6 justify-between sticky top-0 z-50">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#0A7E5A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">TC</span>
          </div>
          <span className="text-white font-semibold text-base tracking-wide">TeamConnect</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150"
              style={{
                color: pathname === link.href ? 'white' : '#9CA3AF',
                backgroundColor: pathname === link.href ? '#1F2937' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <span className="text-[#9CA3AF] text-sm hidden sm:block">
              {userName.split(' ')[0]} {userName.split(' ')[1]?.[0]}.
            </span>
            <div className="w-8 h-8 rounded-full bg-[#0A7E5A] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{userInitials}</span>
            </div>
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <div className="px-4 py-2 border-b border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#111827] truncate">{userName}</p>
                <p className="text-xs text-[#6B7280] truncate">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
