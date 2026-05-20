import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ displayName: '', phone: '', bio: '', location: '', avatarUrl: '' })

  useEffect(() => {
    apiClient.get('/api/profile')
      .then(r => {
        setForm({
          displayName: r.data.displayName || '',
          phone: r.data.phone || '',
          bio: r.data.bio || '',
          location: r.data.location || '',
          avatarUrl: r.data.avatarUrl || ''
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.put('/api/profile', form)
      await refreshUser()
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Loading...</div>

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Profile</h1>

        {/* Avatar upload */}
        <div className="mt-6 rounded-2xl border border-[#e4d6c8] bg-white p-6">
          <p className="text-sm font-semibold text-[#221b16]">Profile Picture</p>
          <div className="mt-4 flex items-center gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#e4d6c8] bg-[#f0e8df]">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#a28672]">
                  {user?.displayName?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <MediaUploader
                folder={`avatars/${user?.id}`}
                maxFiles={1}
                maxSizeMB={5}
                allowVideo={false}
                compact
                onUpload={(urls) => setForm({ ...form, avatarUrl: urls[0] || '' })}
                existingMedia={form.avatarUrl ? [{ url: form.avatarUrl, type: 'image', name: 'avatar' }] : []}
              />
              <p className="mt-2 text-xs text-[#8c7564]">JPG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="mt-4 space-y-4 rounded-2xl border border-[#e4d6c8] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#221b16] text-lg font-bold text-[#f9f5f0]">
              {user?.displayName?.[0] || '?'}
            </div>
            <div>
              <p className="font-semibold text-[#221b16]">{user?.email}</p>
              <div className="mt-1 flex gap-2">
                {user?.roles?.filter((r: string) => r !== 'CUSTOMER' || !user.roles.includes('VENDOR')).map((r: string) => {
                  const labels: Record<string, string> = { CUSTOMER: 'Customer', VENDOR: 'Vendor', TECHNICIAN: 'Technician', ADMIN: 'Admin' }
                  return <span key={r} className="rounded-full bg-[#f0e8df] px-3 py-1 text-xs font-semibold text-[#6c5b4f]">{labels[r] || r}</span>
                })}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Display Name</label>
            <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Location</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
