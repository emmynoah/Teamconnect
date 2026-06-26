'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = async () => {
    if (!password || !confirm) {
      setErrorMessage('Please fill in both fields.')
      setStatus('error')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      setStatus('error')
      return
    }

    if (password !== confirm) {
      setErrorMessage('Passwords do not match.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl p-8"
        style={{ border: '1px solid #E5E7EB' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: '#0A7E5A' }}
          >
            <span className="text-white font-bold text-base">TC</span>
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Set your password</h1>
          <p className="text-sm text-[#6B7280] mt-1 text-center">
            Welcome to TeamConnect. Please create your own password to continue.
          </p>
        </div>

        {/* New Password */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#111827] mb-1">
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            onKeyDown={e => e.key === 'Enter' && handleChange()}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#111827] mb-1">
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            onKeyDown={e => e.key === 'Enter' && handleChange()}
          />
        </div>

        {/* Error */}
        {status === 'error' && (
          <p className="text-sm mb-4" style={{ color: '#F48221' }}>
            {errorMessage}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleChange}
          disabled={status === 'loading'}
          className="w-full py-3 rounded-lg text-sm font-bold text-black transition-colors duration-150"
          style={{
            backgroundColor: status === 'loading' ? '#E5E7EB' : '#F48221',
          }}
        >
          {status === 'loading' ? 'Saving...' : 'Set my password'}
        </button>

        <p className="text-xs text-center text-[#6B7280] mt-4">
          You can always change your password later from your profile.
        </p>
      </div>
    </div>
  )
}
