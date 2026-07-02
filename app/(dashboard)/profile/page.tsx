'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CARSA_TEAM } from '@/lib/team'

export default function ProfilePage() {
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [initials, setInitials] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const email = user.email || ''
      setUserEmail(email)

      const match = CARSA_TEAM.find(m => m.email === email)
      if (match) {
        setFullName(match.full_name)
        setTitle(match.title)
        setPhone(match.phone)
        setInitials(match.initials)
        setRole(match.role)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', user.id)
        .single()
      if (profile?.photo_url) setPhotoUrl(profile.photo_url)
    }
    init()
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', user.id)
      setPhotoUrl(publicUrl)
    } catch (error) {
      console.error('Photo upload error:', error)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleSave = async () => {
    setStatus('saving')
    setErrorMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone, title }
      })

      if (error) throw error
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both fields.')
      setPasswordStatus('error')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      setPasswordStatus('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      setPasswordStatus('error')
      return
    }

    setPasswordStatus('saving')
    setPasswordError('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordStatus('error')
      setPasswordError('Something went wrong. Please try again.')
      return
    }

    setPasswordStatus('saved')
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordForm(false)
    setTimeout(() => setPasswordStatus('idle'), 3000)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>
        <p className="text-sm text-[#6B7280] mt-1">Your personal information and account settings</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">

        {/* Avatar + Name */}
        <div
          className="bg-white rounded-xl p-6 flex items-center gap-5"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #0A7E5A' }}
        >
          <div
            className="relative w-16 h-16 flex-shrink-0 cursor-pointer group"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile photo"
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '3px solid #0A7E5A' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: '#E8F5F0', color: '#0A7E5A', border: '3px solid #0A7E5A' }}
              >
                {initials}
              </div>
            )}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <span className="text-white text-[10px] font-semibold text-center px-1">{photoUploading ? 'Uploading...' : 'Change photo'}</span>
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <p className="text-lg font-bold text-[#111827]">{fullName}</p>
            <p className="text-sm text-[#6B7280]">{title}</p>
            <p className="text-xs text-[#6B7280] mt-1">{userEmail}</p>
            {role === 'admin' && (
              <span
                className="inline-block mt-2 text-white text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#111827' }}
              >
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Edit Profile */}
        <div
          className="bg-white rounded-xl p-6"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <h2 className="text-base font-semibold text-[#111827] mb-5">
            Edit Profile
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 250788000000"
              className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#111827] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F3F4F6', color: '#6B7280' }}
            />
            <p className="text-xs text-[#6B7280] mt-1">Email cannot be changed. Contact your administrator.</p>
          </div>

          {status === 'saved' && (
            <p className="text-sm mb-4" style={{ color: '#0A7E5A' }}>✅ Profile updated successfully.</p>
          )}
          {status === 'error' && (
            <p className="text-sm mb-4" style={{ color: '#F48221' }}>{errorMessage}</p>
          )}

          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-black transition-colors duration-150"
            style={{ backgroundColor: status === 'saving' ? '#E5E7EB' : '#F48221' }}
          >
            {status === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div
          className="bg-white rounded-xl p-6"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Password</h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-sm font-medium"
              style={{ color: '#0A7E5A' }}
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {!showPasswordForm && (
            <p className="text-sm text-[#6B7280]">
              Your password is set. Click Change Password to update it.
            </p>
          )}

          {showPasswordForm && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#111827] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#111827] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-[#374151] outline-none"
                  style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
                />
              </div>

              {passwordStatus === 'saved' && (
                <p className="text-sm mb-4" style={{ color: '#0A7E5A' }}>✅ Password changed successfully.</p>
              )}
              {passwordStatus === 'error' && (
                <p className="text-sm mb-4" style={{ color: '#F48221' }}>{passwordError}</p>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={passwordStatus === 'saving'}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-black transition-colors duration-150"
                style={{ backgroundColor: passwordStatus === 'saving' ? '#E5E7EB' : '#F48221' }}
              >
                {passwordStatus === 'saving' ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
