import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

export default function CreateUsedListingPage() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', description: '', askingPriceBdt: '', categoryId: '' })

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  })

  const submit = async () => {
    if (!form.title || !form.askingPriceBdt) { toast.error('Title and price are required'); return }
    setSaving(true)
    try {
      const res = await apiClient.post('/api/used-listings', {
        ...form,
        askingPriceBdt: parseFloat(form.askingPriceBdt),
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      })
      const listingId = res.data.id

      for (const url of imageUrls) {
        await apiClient.post(`/api/used-listings/${listingId}/images`, { imageUrl: url }).catch(() => {})
      }
      for (const url of videoUrls) {
        await apiClient.post(`/api/used-listings/${listingId}/videos`, { videoUrl: url }).catch(() => {})
      }

      toast.success('Listing created with media!')
      nav('/used-listings')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create listing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Sell a Used Item</h1>
        <div className="mt-6 space-y-5 rounded-2xl border border-[#e4d6c8] bg-white p-6">
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. iPhone 14 Pro — Like New"
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#221b16]">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
              placeholder="Describe the item condition, any defects, accessories included..."
              className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-[#221b16]">Asking Price (৳) *</label>
              <input type="number" value={form.askingPriceBdt} onChange={e => setForm({ ...form, askingPriceBdt: e.target.value })}
                placeholder="25,000"
                className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#221b16]">Category</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <MediaUploader
            folder="used-items"
            label="Photos (up to 8)"
            maxFiles={8}
            maxSizeMB={10}
            allowVideo={false}
            onUpload={setImageUrls}
          />

          <MediaUploader
            folder="used-items/videos"
            label="Videos (optional, up to 3)"
            maxFiles={3}
            maxSizeMB={50}
            accept="video/mp4,video/webm"
            allowVideo={true}
            onUpload={setVideoUrls}
          />

          <button onClick={submit} disabled={saving}
            className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
            {saving ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>
      </div>
    </div>
  )
}
