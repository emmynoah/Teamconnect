import Link from 'next/link'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

const navLinks = [
  { href: '/directory', label: 'Directory' },
  { href: '/reports', label: 'Reports' },
  { href: '/calendar', label: 'Calendar' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* Navigation Bar */}
      <nav className="bg-[#111827] h-16 flex items-center px-6 justify-between sticky top-0 z-50">

        {/* Logo + Wordmark */}
        <div className="flex items-center gap-3">
          {/* Logo mark — TC in emerald */}
          <div className="w-8 h-8 rounded-md bg-[#0A7E5A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm tracking-tight">TC</span>
          </div>
          <span className="text-white font-semibold text-base tracking-wide">
            TeamConnect
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Staff name + avatar placeholder */}
        <div className="flex items-center gap-3">
          <span className="text-[#9CA3AF] text-sm">Emmanuel N.</span>
          <div className="w-8 h-8 rounded-full bg-[#0A7E5A] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">EN</span>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  )
}
