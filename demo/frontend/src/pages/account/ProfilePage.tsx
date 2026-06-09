import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

type ProfileForm = {
  displayName: string
  phone: string
  bio: string
  location: string
  avatarUrl: string
  websiteUrl: string
  gender: string
  dateOfBirth: string
}

type FieldErrors = Partial<Record<keyof ProfileForm, string>>

const emptyForm: ProfileForm = {
  displayName: '',
  phone: '',
  bio: '',
  location: '',
  avatarUrl: '',
  websiteUrl: '',
  gender: '',
  dateOfBirth: '',
}

const genders = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
]

export default function ProfilePage() {
  const { user, refreshUser, activeRole, setActiveRole, subscribedRoles } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const upgradeRef = useRef<HTMLDivElement | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const [lightboxAvatar, setLightboxAvatar] = useState(false)
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/api/profile').then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: addresses = [] } = useQuery<any[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/api/addresses').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev ?? [],
  })

  useEffect(() => {
    if (profile) {
      const next = {
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        avatarUrl: profile.avatarUrl || '',
        websiteUrl: profile.websiteUrl || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth || '',
      }
      setForm(next)
      setSavedProfile(next)
      setErrors({})
      setSubmitAttempted(false)
    }
  }, [profile])

  const draftCompletion = useMemo(() => {
    const fields: Array<keyof ProfileForm> = ['displayName', 'phone', 'bio', 'location', 'avatarUrl', 'websiteUrl', 'gender', 'dateOfBirth']
    const filled = fields.filter(k => (form[k] || '').toString().trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  const savedCompletion = useMemo(() => {
    const fields: Array<keyof ProfileForm> = ['displayName', 'phone', 'bio', 'location', 'avatarUrl', 'websiteUrl', 'gender', 'dateOfBirth']
    const filled = fields.filter(k => (savedProfile[k] || '').toString().trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [savedProfile])

  const isDirty = useMemo(() => {
    const fields: Array<keyof ProfileForm> = ['displayName', 'phone', 'bio', 'location', 'avatarUrl', 'websiteUrl', 'gender', 'dateOfBirth']
    return fields.some(k => (form[k] || '').toString() !== (savedProfile[k] || '').toString())
  }, [form, savedProfile])

  const savedName = savedProfile.displayName || user?.displayName || ''
  const savedAvatar = savedProfile.avatarUrl || user?.avatarUrl || ''
  const savedInitial = savedName?.[0] || '?'

  const defaultAddress = useMemo(() => addresses.find(a => a.isDefault) || addresses[0], [addresses])

  const validate = (data: ProfileForm): FieldErrors => {
    const next: FieldErrors = {}
    if (!data.displayName.trim()) {
      next.displayName = 'Display name is required'
    } else if (data.displayName.trim().length < 2) {
      next.displayName = 'Display name is too short'
    }
    if (data.phone && !/^[+0-9()\-\s]{7,20}$/.test(data.phone)) {
      next.phone = 'Enter a valid phone number'
    }
    if (data.websiteUrl && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(data.websiteUrl)) {
      next.websiteUrl = 'Enter a valid website URL'
    }
    if (data.dateOfBirth) {
      const parsed = new Date(data.dateOfBirth)
      if (Number.isNaN(parsed.getTime())) {
        next.dateOfBirth = 'Invalid date'
      } else if (parsed > new Date()) {
        next.dateOfBirth = 'Date cannot be in the future'
      }
    }
    return next
  }

  const saveMutation = useMutation({
    mutationFn: (payload: ProfileForm) => apiClient.put('/api/profile', payload).then(r => r.data),
    onSuccess: async (data) => {
      const next = {
        displayName: data.displayName || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        avatarUrl: data.avatarUrl || '',
        websiteUrl: data.websiteUrl || '',
        gender: data.gender || '',
        dateOfBirth: data.dateOfBirth || '',
      }
      setForm(next)
      setSavedProfile(next)
      setErrors({})
      setSubmitAttempted(false)
      queryClient.setQueryData(['profile'], data)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.setQueryData(['auth-user'], (old: any) => old ? {
        ...old,
        displayName: data.displayName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      } : old)
      await refreshUser()
      toast.success('Profile updated')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || 'Failed to update')
    },
  })

  const handleSave = () => {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setSubmitAttempted(true)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Fix the highlighted fields')
      return
    }
    saveMutation.mutate({
      ...form,
      displayName: form.displayName.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      websiteUrl: form.websiteUrl.trim(),
    })
  }

  const handleReset = () => {
    setForm(savedProfile)
    setErrors({})
    setSubmitAttempted(false)
  }

  const scrollToUpgrade = () => {
    setActiveTab('settings')
    requestAnimationFrame(() => {
      upgradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    if (location.hash === '#role-upgrade') {
      setActiveTab('settings')
      requestAnimationFrame(() => {
        upgradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [location.hash])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-[#efe6dd]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="h-[420px] animate-pulse rounded-3xl border border-[#e4d6c8] bg-white" />
            <div className="h-[560px] animate-pulse rounded-3xl border border-[#e4d6c8] bg-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Account</p>
            <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Profile</h1>
            {(!user?.roles?.includes('VENDOR') || !user?.roles?.includes('TECHNICIAN')) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8c7564]">
                <span className="rounded-full bg-[#f0e8df] px-2.5 py-1 font-semibold text-[#6c5b4f]">New</span>
                <span>Unlock Merchant or Craftsman tools from your profile.</span>
                <button onClick={scrollToUpgrade} className="text-xs font-semibold text-[#221b16] underline">
                  Explore upgrades
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {(!user?.roles?.includes('VENDOR') || !user?.roles?.includes('TECHNICIAN')) && (
              <button
                type="button"
                onClick={scrollToUpgrade}
                className="hidden items-center gap-2 rounded-full border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#221b16] sm:inline-flex"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[#a28672]">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.75a.75.75 0 0 0-1.5 0V10c0 .414.336.75.75.75h3.5a.75.75 0 0 0 0-1.5h-2.75V6.25Z" clipRule="evenodd" />
                </svg>
                Upgrade Roles
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e4d6c8] bg-white p-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTab === 'overview' ? 'bg-[#221b16] text-[#f9f5f0]' : 'text-[#221b16] hover:bg-[#f9f5f0]'}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTab === 'settings' ? 'bg-[#221b16] text-[#f9f5f0]' : 'text-[#221b16] hover:bg-[#f9f5f0]'}`}
            >
              Edit Settings
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c7564]">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${isDirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isDirty ? 'Draft changes' : 'Saved'}
            </span>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setLightboxAvatar(true)} className="h-16 w-16 overflow-hidden rounded-2xl border border-[#e4d6c8] bg-[#f0e8df]">
                    {savedAvatar ? (
                      <img src={savedAvatar} alt="Avatar" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#a28672]">
                        {savedInitial}
                      </div>
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-[#221b16]">{savedName || 'Your name'}</p>
                    <p className="text-xs text-[#8c7564]">{user?.email}</p>
                    <p className="mt-1 text-[11px] text-emerald-700">Saved profile</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Profile Completion</p>
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-[#e7ddd3]">
                      <div className="h-2 rounded-full bg-[#221b16]" style={{ width: `${savedCompletion}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#221b16]">{savedCompletion}% complete</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Roles &amp; Access</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { key: 'VENDOR', label: 'Vendor', icon: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                      { key: 'TECHNICIAN', label: 'Technician', icon: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.087 4.113', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    ].map(({ key, label, icon, color }) => {
                      const hasRole = user?.roles?.includes(key)
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${hasRole ? color : 'border-[#e4d6c8] bg-[#f9f5f0] text-[#6c5b4f]'}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-5 w-5 shrink-0 ${hasRole ? '' : 'text-[#a28672]'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                          </svg>
                          <span className="flex-1 text-sm font-semibold">{label}</span>
                          {hasRole ? (
                            <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                          ) : (
                            <button
                              onClick={scrollToUpgrade}
                              className="rounded-full bg-[#221b16] px-3 py-1 text-[11px] font-semibold text-[#f9f5f0] hover:bg-[#3a2f28]"
                            >
                              Upgrade
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Active Mode</p>
                    <p className="mt-0.5 text-[11px] text-[#a28672]">Toggle a mode to switch your experience</p>
                    <div className="mt-3 flex flex-col gap-3">
                      {subscribedRoles.includes('vendor') && (
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e4d6c8] bg-white px-4 py-3 transition-all hover:border-[#a28672]">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📦</span>
                            <div>
                              <p className="text-sm font-medium text-[#221b16]">Merchant Mode</p>
                              <p className="text-[11px] text-[#a28672]">Manage shops, products & orders</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveRole(activeRole === 'vendor' ? null : 'vendor')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${activeRole === 'vendor' ? 'bg-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]' : 'bg-[#d7c7b8]'} focus:outline-none`}
                          >
                            <span className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform duration-300 ${activeRole === 'vendor' ? 'translate-x-[24px]' : 'translate-x-[2px]'}`} />
                          </button>
                        </label>
                      )}
                      {subscribedRoles.includes('technician') && (
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e4d6c8] bg-white px-4 py-3 transition-all hover:border-[#a28672]">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🔧</span>
                            <div>
                              <p className="text-sm font-medium text-[#221b16]">Repair Mode</p>
                              <p className="text-[11px] text-[#a28672]">Manage repair requests & jobs</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveRole(activeRole === 'technician' ? null : 'technician')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${activeRole === 'technician' ? 'bg-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]' : 'bg-[#d7c7b8]'} focus:outline-none`}
                          >
                            <span className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform duration-300 ${activeRole === 'technician' ? 'translate-x-[24px]' : 'translate-x-[2px]'}`} />
                          </button>
                        </label>
                      )}
                    </div>
                    {activeRole !== null && (
                      <p className="mt-2 text-[10px] text-[#a28672]">Toggle the active mode off to return to normal browsing.</p>
                    )}
                  </div>
                </div>
              </div>

              {(!user?.roles?.includes('VENDOR') || !user?.roles?.includes('TECHNICIAN')) && (
                <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0e8df]">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#a28672]">
                        <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Upgrade</p>
                      <p className="text-sm font-semibold text-[#221b16]">Unlock more capabilities</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        key: 'VENDOR',
                        label: 'Merchant',
                        desc: 'Sell products, run auctions, manage your shop',
                        benefits: ['List products', 'Run auctions', 'Manage orders', 'Shop page'],
                        owned: user?.roles?.includes('VENDOR'),
                      },
                      {
                        key: 'TECHNICIAN',
                        label: 'Craftsman',
                        desc: 'Offer repair services, accept bookings',
                        benefits: ['List services', 'Accept bookings', 'Set pricing', 'Build reputation'],
                        owned: user?.roles?.includes('TECHNICIAN'),
                      },
                    ].filter(r => !r.owned).map(({ key, label, desc, benefits }) => (
                      <div
                        key={key}
                        className="rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-4 transition hover:border-[#d0c0b0]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#221b16]">{label}</p>
                            <p className="mt-0.5 text-xs text-[#8c7564]">{desc}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#f0e8df] px-2.5 py-1 text-[11px] font-semibold text-[#6c5b4f]">99 TK</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                          {benefits.map((b) => (
                            <div key={b} className="flex items-center gap-1.5 text-[11px] text-[#6c5b4f]">
                              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-emerald-600">
                                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                              </svg>
                              {b}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={scrollToUpgrade}
                          className="mt-3 w-full rounded-xl bg-[#221b16] py-2 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a2f28]"
                        >
                          Upgrade to {label} — 99 TK
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Address</p>
                    <p className="mt-1 text-sm font-semibold text-[#221b16]">Primary Address</p>
                  </div>
                  <Link to="/addresses" className="rounded-xl border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0]">
                    Manage
                  </Link>
                </div>
                <p className="mt-1 text-xs text-[#8c7564]">Used for checkout and service requests.</p>
                <div className="mt-4 rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
                  {defaultAddress ? (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#221b16]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-[#f9f5f0]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#221b16]">{defaultAddress.label || 'Address'}</p>
                          {defaultAddress.isDefault && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Default</span>
                          )}
                        </div>
                        {defaultAddress.fullName && <p className="mt-0.5 text-xs text-[#6c5b4f]">{defaultAddress.fullName}</p>}
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-[#6c5b4f]">{defaultAddress.addressLine}</p>
                          {defaultAddress.city && (
                            <p className="text-xs text-[#6c5b4f]">{defaultAddress.city}{defaultAddress.area ? `, ${defaultAddress.area}` : ''}{defaultAddress.postalCode ? ` ${defaultAddress.postalCode}` : ''}</p>
                          )}
                          {defaultAddress.phone && <p className="text-xs text-[#8c7564]">{defaultAddress.phone}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0e8df]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-[#a28672]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#8c7564]">No address on file yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Personal</p>
                <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Saved Details</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#221b16]">Display Name</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.displayName || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Gender</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.gender || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Date of Birth</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.dateOfBirth || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Contact</p>
                <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Saved Contact</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Email</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Phone</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.phone || 'Not set'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#221b16]">Location</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.location || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">About</p>
                <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Saved Bio</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Bio</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.bio || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Website</label>
                    <p className="mt-1 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]">
                      {savedProfile.websiteUrl || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setLightboxAvatar(true)} className="h-16 w-16 overflow-hidden rounded-2xl border border-[#e4d6c8] bg-[#f0e8df]">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Avatar" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#a28672]">
                        {user?.displayName?.[0] || '?'}
                      </div>
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-[#221b16]">{form.displayName || 'Your name'}</p>
                    <p className="text-xs text-[#8c7564]">{user?.email}</p>
                    <p className={`mt-1 text-[11px] ${isDirty ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isDirty ? 'Draft changes' : 'Saved profile'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Profile Completion (Draft)</p>
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-[#e7ddd3]">
                      <div className="h-2 rounded-full bg-[#221b16]" style={{ width: `${draftCompletion}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#221b16]">{draftCompletion}% complete</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#221b16]"
                  >
                    Reset Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="rounded-full bg-[#221b16] px-5 py-2 text-xs font-semibold text-[#f9f5f0] disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-sm font-semibold text-[#221b16]">Profile Picture</p>
                <p className="mt-1 text-xs text-[#8c7564]">Update your avatar shown across the marketplace.</p>
                <div className="mt-4">
                  <MediaUploader
                    folder={`avatars/${user?.id}`}
                    maxFiles={1}
                    maxSizeMB={5}
                    allowVideo={false}
                    compact
                    onUpload={(urls) => setForm(prev => ({ ...prev, avatarUrl: urls[0] || '' }))}
                    existingMedia={form.avatarUrl ? [{ url: form.avatarUrl, type: 'image', name: 'avatar' }] : []}
                  />
                </div>
                <p className="mt-2 text-xs text-[#8c7564]">JPG, PNG, or WebP. Max 5MB.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Personal</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Edit Details</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#221b16]">Display Name</label>
                    <input
                      value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${errors.displayName && submitAttempted ? 'border-red-400' : 'border-[#d7c7b8] focus:border-[#221b16]'}`}
                    />
                    {errors.displayName && submitAttempted && (
                      <p className="mt-1 text-xs text-red-600">{errors.displayName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Gender</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                    >
                      {!form.gender && <option value="" disabled>Select gender</option>}
                      {genders.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Date of Birth</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${errors.dateOfBirth && submitAttempted ? 'border-red-400' : 'border-[#d7c7b8] focus:border-[#221b16]'}`}
                    />
                    {errors.dateOfBirth && submitAttempted && (
                      <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Contact</p>
                <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Edit Contact</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Email</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className="mt-1 w-full rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#8c7564]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${errors.phone && submitAttempted ? 'border-red-400' : 'border-[#d7c7b8] focus:border-[#221b16]'}`}
                    />
                    {errors.phone && submitAttempted && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#221b16]">Location</label>
                    <input
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="City or region"
                      className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">About</p>
                <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Edit Bio</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                      placeholder="Share a quick intro for the community"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#221b16]">Website</label>
                    <input
                      value={form.websiteUrl}
                      onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                      placeholder="https://"
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${errors.websiteUrl && submitAttempted ? 'border-red-400' : 'border-[#d7c7b8] focus:border-[#221b16]'}`}
                    />
                    {errors.websiteUrl && submitAttempted && (
                      <p className="mt-1 text-xs text-red-600">{errors.websiteUrl}</p>
                    )}
                  </div>
                </div>
              </div>

              <div ref={upgradeRef} id="role-upgrade">
                <RoleUpgradeSection />
              </div>
            </div>
          </div>
        )}
      </div>
      {lightboxAvatar && (
        <ImageLightbox
          images={[{ url: savedAvatar || form.avatarUrl || '' }]}
          initialIndex={0}
          onClose={() => setLightboxAvatar(false)}
        />
      )}
    </div>
  )
}

function RoleUpgradeSection() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [pendingRole, setPendingRole] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [paymentRole, setPaymentRole] = useState<string | null>(null)
  const [paymentUpgradeId, setPaymentUpgradeId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'CARD'>('BKASH')
  const [providerRef, setProviderRef] = useState('')
  const [successRole, setSuccessRole] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select')

  const roleOptions = [
    {
      key: 'VENDOR',
      label: 'Merchant (Vendor)',
      desc: 'Sell products, run auctions, manage a shop',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
      benefits: ['List unlimited products', 'Run your own auctions', 'Manage orders & inventory', 'Get a personalized shop page'],
    },
    {
      key: 'TECHNICIAN',
      label: 'Craftsman (Repairer)',
      desc: 'Offer repair services, accept bookings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
          <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.28 10.23" />
        </svg>
      ),
      benefits: ['List repair services', 'Accept booking requests', 'Set your own schedule & pricing', 'Build your service reputation'],
    },
  ]

  const createUpgrade = async (role: string) => {
    setPendingRole(role)
    try {
      const res = await apiClient.post('/api/upgrades', { role })
      setPaymentRole(res.data.role)
      setPaymentUpgradeId(res.data.id)
      setStep('payment')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start upgrade')
    } finally {
      setPendingRole(null)
    }
  }

  const payUpgrade = async () => {
    if (!paymentRole || !paymentUpgradeId) return
    setPaying(true)
    try {
      await apiClient.post(`/api/upgrades/${paymentUpgradeId}/pay`, {
        method: paymentMethod,
        providerRef: providerRef || `${paymentMethod}-${Date.now()}`,
        success: true,
      })
      await queryClient.invalidateQueries({ queryKey: ['my-upgrades'] })
      await refreshUser()
      setSuccessRole(paymentRole)
      setStep('success')
      setPaymentRole(null)
      setPaymentUpgradeId(null)
      setProviderRef('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const resetFlow = () => {
    setStep('select')
    setPaymentRole(null)
    setPaymentUpgradeId(null)
    setProviderRef('')
    setSuccessRole(null)
  }

  return (
    <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Upgrade</p>
            <h2 className="mt-1 text-lg font-semibold text-[#221b16]">Unlock new roles</h2>
          </div>
          {step !== 'select' && (
            <button onClick={resetFlow} className="text-xs font-semibold text-[#8c7564] hover:text-[#221b16]">
              &larr; Back
            </button>
          )}
        </div>
      </div>

      {step === 'select' && (
        <>
          <p className="mb-4 mt-3 text-xs leading-relaxed text-[#8c7564]">
            Upgrade costs <span className="font-semibold text-[#221b16]">99 TK</span> per role — a one-time payment. Roles activate instantly after payment.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {roleOptions.map((r) => {
              const alreadyHas = user?.roles?.includes(r.key)
              return (
                <div
                  key={r.key}
                  className={`group relative flex flex-col rounded-2xl border p-5 transition-all ${
                    alreadyHas
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-[#d7c7b8] bg-white hover:border-[#221b16] hover:shadow-md'
                  }`}
                >
                  {alreadyHas && (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      Active
                    </div>
                  )}

                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    alreadyHas ? 'bg-emerald-100 text-emerald-600' : 'bg-[#f0e8df] text-[#221b16]'
                  }`}>
                    {r.icon}
                  </div>

                  <p className="mt-4 text-sm font-semibold text-[#221b16]">{r.label}</p>
                  <p className="mt-0.5 text-xs text-[#8c7564]">{r.desc}</p>

                  <ul className="mt-4 space-y-1.5">
                    {r.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#6c5b4f]">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3 w-3 shrink-0 text-[#a28672]">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5">
                    {alreadyHas ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-700">
                        Already active on your account
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => createUpgrade(r.key)}
                        disabled={pendingRole !== null || paying}
                        className="w-full rounded-xl bg-[#221b16] px-4 py-2.5 text-xs font-semibold text-[#f9f5f0] transition-all hover:bg-[#3a2f28] disabled:opacity-50"
                      >
                        {pendingRole === r.key ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Starting...
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2">
                            Upgrade — 99 TK
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-3">
            {[
              { label: 'Instant activation', desc: 'Role is active right after payment' },
              { label: 'One-time payment', desc: 'No recurring fees or subscriptions' },
              { label: 'Secure checkout', desc: 'BKASH / Nagad / Card payment' },
            ].map((trust, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#6c5b4f]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                <span><span className="font-semibold text-[#221b16]">{trust.label}</span> — {trust.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 'payment' && paymentRole && (
        <div className="mt-5">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Order Summary</p>
              <div className="mt-3 flex items-center justify-between border-b border-[#e4d6c8] pb-3">
                <div>
                  <p className="text-sm font-semibold text-[#221b16]">{paymentRole === 'VENDOR' ? 'Merchant (Vendor)' : 'Craftsman (Repairer)'}</p>
                  <p className="text-xs text-[#8c7564]">Role upgrade — one-time fee</p>
                </div>
                <p className="text-sm font-bold text-[#221b16]">99 TK</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#221b16]">Total</p>
                <p className="text-base font-bold text-[#221b16]">99 TK</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#221b16]">Payment Method</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {([
                  { id: 'BKASH', label: 'bKash', icon: '💳' },
                  { id: 'NAGAD', label: 'Nagad', icon: '💳' },
                  { id: 'CARD', label: 'Card', icon: '💳' },
                ] as const).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-all ${
                      paymentMethod === m.id
                        ? 'border-[#221b16] bg-[#221b16] text-white'
                        : 'border-[#d7c7b8] bg-white text-[#221b16] hover:border-[#221b16]'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      paymentMethod === m.id ? 'bg-white/20' : 'bg-[#f0e8df]'
                    }`}>
                      {paymentMethod === m.id ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#a28672]">
                          <path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4Z" />
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM4 13a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1Zm5-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H9Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs">{m.label}</p>
                      <p className="text-[10px] opacity-70">Pay with {m.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#221b16]">Transaction Reference <span className="font-normal text-[#8c7564]">(optional)</span></label>
              <input
                value={providerRef}
                onChange={e => setProviderRef(e.target.value)}
                placeholder="Enter transaction ID from your payment app"
                className="mt-1 w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={payUpgrade}
                disabled={paying}
                className="flex-1 rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-[#f9f5f0] transition-all hover:bg-[#3a2f28] disabled:opacity-50"
              >
                {paying ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing payment...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Pay 99 TK via {paymentMethod === 'BKASH' ? 'bKash' : paymentMethod === 'NAGAD' ? 'Nagad' : 'Card'}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                disabled={paying}
                className="rounded-xl border border-[#d7c7b8] bg-white px-5 py-3 text-sm font-semibold text-[#221b16] hover:bg-[#f9f5f0] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && successRole && (
        <div className="mt-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-semibold text-[#221b16]">Role Activated!</p>
          <p className="mt-1 text-sm text-[#6c5b4f]">
            You are now a <span className="font-semibold text-[#221b16]">{successRole === 'VENDOR' ? 'Merchant (Vendor)' : 'Craftsman (Repairer)'}</span>.
          </p>
          <p className="mt-1 text-xs text-[#8c7564]">All features are available on your account now.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {successRole === 'VENDOR' && (
              <Link to="/vendor/dashboard" className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
                Go to Vendor Dashboard
              </Link>
            )}
            {successRole === 'TECHNICIAN' && (
              <Link to="/repair/requests" className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
                Manage Service Requests
              </Link>
            )}
            <button onClick={resetFlow} className="rounded-xl border border-[#d7c7b8] px-5 py-2.5 text-sm font-semibold text-[#221b16]">
              Upgrade another role
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
