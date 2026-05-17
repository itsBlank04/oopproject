import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

export default function RepairRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', deviceType: '', categoryId: '' })

  useEffect(() => {
    apiClient.get('/api/repair/requests/mine')
      .then(r => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
    apiClient.get('/api/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const submit = async () => {
    if (!form.title || !form.deviceType) { toast.error('Title and device type required'); return }
    setSaving(true)
    try {
      const res = await apiClient.post('/api/repair/requests', {
        ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null
      })
      // Upload media to repair request
      for (const url of mediaUrls) {
        await apiClient.post(`/api/repair/requests/${res.data.id}/media`, { mediaUrl: url }).catch(() => {})
      }
      toast.success('Repair request created')
      setShowForm(false)
      setForm({ title: '', description: '', deviceType: '', categoryId: '' })
      setMediaUrls([])
      // Reload
      const r = await apiClient.get('/api/repair/requests/mine')
      setRequests(Array.isArray(r.data) ? r.data : [])
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-blue-100 text-blue-700'
      case 'QUOTED': return 'bg-amber-100 text-amber-700'
      case 'BOOKED': return 'bg-indigo-100 text-indigo-700'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Repair Requests</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* New repair request form */}
        {showForm && (
          <div className="mt-6 space-y-4 rounded-2xl border border-[#e4d6c8] bg-white p-6">
            <h3 className="font-semibold text-[#221b16]">Describe your repair need</h3>
            <input placeholder="Title (e.g. iPhone screen cracked)" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Device type (e.g. iPhone 14)" value={form.deviceType}
                onChange={e => setForm({ ...form, deviceType: e.target.value })}
                className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]">
                <option value="">Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="Describe the issue in detail..." value={form.description} rows={4}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />

            {/* Media upload for repair photos/videos */}
            <MediaUploader
              folder="repairs"
              label="Photos & Videos of the issue (up to 6)"
              maxFiles={6}
              maxSizeMB={25}
              allowVideo={true}
              onUpload={setMediaUrls}
            />

            <button onClick={submit} disabled={saving}
              className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit Repair Request'}
            </button>
          </div>
        )}

        {/* Requests list */}
        {loading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : requests.length === 0 && !showForm ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center">
            <p className="text-lg text-[#8c7564]">No repair requests yet</p>
            <Link to="/repair/technicians" className="mt-4 inline-block rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
              Browse Technicians
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {requests.map((r: any) => (
              <div key={r.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#221b16]">{r.title || `Request #${r.id}`}</h3>
                    <p className="mt-1 text-xs text-[#8c7564]">{r.deviceType} · {r.category?.name}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#6c5b4f]">{r.description}</p>
                {/* Show uploaded media */}
                {r.media?.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.media.map((m: any, i: number) => (
                      <div key={i} className="h-16 w-16 overflow-hidden rounded-lg border border-[#e4d6c8]">
                        {m.mediaUrl?.includes('.mp4') || m.mediaUrl?.includes('.webm')
                          ? <video src={m.mediaUrl} className="h-full w-full object-cover" />
                          : <img src={m.mediaUrl} className="h-full w-full object-cover" />
                        }
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-[#8c7564]">Created {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
