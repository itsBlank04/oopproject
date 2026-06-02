import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

export default function RepairRequestsPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', description: '', deviceType: '', categoryId: '' })
  const [lightbox, setLightbox] = useState<{ images: { url: string; type?: string }[]; index: number } | null>(null)

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['repair-requests'],
    queryFn: () => apiClient.get('/api/repair/requests/mine').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  })

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/repair/requests', {
        ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null
      })
      for (const url of mediaUrls) {
        await apiClient.post(`/api/repair/requests/${res.data.id}/media`, { mediaUrl: url }).catch(() => {})
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Repair request created')
      setShowForm(false)
      setForm({ title: '', description: '', deviceType: '', categoryId: '' })
      setMediaUrls([])
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create'),
  })

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

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-[#6c5b4f]">Sign in to manage your repair requests.</p>
        <Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {!hasRole('TECHNICIAN') && (
          <div className="mb-6 rounded-3xl border border-[#e4d6c8] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e8df]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-[#221b16]">
                    <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.28 10.23" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a28672]">Upgrade</p>
                  <p className="mt-1 text-sm font-semibold text-[#221b16]">Become a Craftsman</p>
                  <p className="mt-1 text-xs text-[#8c7564]">Accept repair bookings, set your pricing, and build reputation.</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#6c5b4f]">
                    <span className="rounded-full border border-[#e4d6c8] bg-[#f9f5f0] px-3 py-1">One-time 99 TK</span>
                    <span className="rounded-full border border-[#e4d6c8] bg-[#f9f5f0] px-3 py-1">Instant activation</span>
                  </div>
                </div>
              </div>
              <Link to="/profile#role-upgrade" className="inline-flex items-center gap-2 rounded-full bg-[#221b16] px-5 py-2.5 text-xs font-semibold text-[#f9f5f0]">
                Upgrade in Profile
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Repair Requests</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

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
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="Describe the issue in detail..." value={form.description} rows={4}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />

            <MediaUploader
              folder="repairs"
              label="Photos & Videos of the issue (up to 6)"
              maxFiles={6}
              maxSizeMB={25}
              allowVideo={true}
              onUpload={setMediaUrls}
            />

            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
              {createMutation.isPending ? 'Submitting...' : 'Submit Repair Request'}
            </button>
          </div>
        )}

        {isLoading ? (
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
                    {r.media?.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {r.media.map((m: any, i: number) => (
                          <button key={i} type="button" onClick={() => setLightbox({
                            images: r.media.map((mm: any) => ({ url: mm.mediaUrl, type: mm.mediaUrl?.includes('.mp4') || mm.mediaUrl?.includes('.webm') ? 'video' : 'image' })),
                            index: i
                          })}
                            className="h-16 w-16 overflow-hidden rounded-lg border border-[#e4d6c8]">
                            {m.mediaUrl?.includes('.mp4') || m.mediaUrl?.includes('.webm')
                              ? <video src={m.mediaUrl} className="h-full w-full object-cover" />
                              : <img src={m.mediaUrl} className="h-full w-full object-cover" />
                            }
                          </button>
                        ))}
                      </div>
                    )}
                <p className="mt-2 text-xs text-[#8c7564]">Created {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
