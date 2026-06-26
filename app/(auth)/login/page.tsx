'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setStatus('error')
      setErrorMessage('Incorrect email or password. Please try again.')
      return
    }

    router.push('/directory')
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
          <h1 className="text-lg font-semibold text-[#111827]">Welcome to TeamConnect</h1>
          <p className="text-sm text-[#6B7280] mt-1">CARSA Internal Platform</p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#111827] mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="yourname@carsaministry.org"
            className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#111827] mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
          onClick={handleLogin}
          disabled={status === 'loading'}
          className="w-full py-3 rounded-lg text-sm font-bold text-black transition-colors duration-150"
          style={{
            backgroundColor: status === 'loading' ? '#E5E7EB' : '#F48221',
          }}
        >
          {status === 'loading' ? 'Signing in...' : 'Sign in to TeamConnect'}
        </button>

        <p className="text-xs text-center text-[#6B7280] mt-6">
          First time? Use the password given to you by your administrator.
        </p>
      </div>
    </div>
  )
}
