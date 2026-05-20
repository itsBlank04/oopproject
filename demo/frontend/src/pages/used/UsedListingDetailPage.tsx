import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function UsedListingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMsg, setOfferMsg] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: item, isLoading } = useQuery<any>({
    queryKey: ['used-listing', id],
    queryFn: () => apiClient.get(`/api/used-listings/${id}`).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const offerMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/used-listings/${id}/offers`, {
      offerAmountBdt: parseFloat(offerAmount), message: offerMsg
    }),
    onSuccess: () => {
      toast.success('Offer sent!')
      setOfferAmount('')
      setOfferMsg('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to send offer'),
  })

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Loading...</div>
  if (!item) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Item not found</div>

  const images = item.images || []
  const videos = item.videos || []
  const allMedia = [...images.map((i: any) => ({ ...i, type: 'image', url: i.imageUrl })), ...videos.map((v: any) => ({ ...v, type: 'video', url: v.videoUrl }))]

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/used-listings" className="text-sm text-[#8c7564] hover:underline">← Back to listings</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* Media gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#f0e8df]">
              {allMedia.length > 0 ? (
                allMedia[selectedImage]?.type === 'video' ? (
                  <video src={allMedia[selectedImage]?.url} controls className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <img src={allMedia[selectedImage]?.url} alt={item.title} className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-[#a28672]">No image</div>
              )}
            </div>
            {allMedia.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {allMedia.map((m: any, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === i ? 'border-[#221b16]' : 'border-[#e4d6c8] hover:border-[#b8a494]'
                    }`}>
                    {m.type === 'video' ? (
                      <>
                        <video src={m.url} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg">▶</div>
                      </>
                    ) : (
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {allMedia.length > 0 && (
              <p className="mt-2 text-xs text-[#8c7564]">
                {images.length} photo{images.length !== 1 ? 's' : ''}{videos.length > 0 ? ` · ${videos.length} video${videos.length !== 1 ? 's' : ''}` : ''}
              </p>
            )}
          </div>

          {/* Info & offer */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[#a28672]">{item.conditionLevel?.label || 'Used'} · {item.category?.name}</p>
            <h1 className="mt-2 font-[Fraunces] text-3xl text-[#221b16]">{item.title}</h1>
            <p className="mt-4 text-3xl font-bold text-[#221b16]">৳{item.askingPriceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#6c5b4f]">{item.description}</p>
            <div className="mt-4 rounded-xl border border-[#e4d6c8] bg-white p-4">
              <p className="text-sm font-semibold text-[#221b16]">Sold by {item.seller?.displayName}</p>
              <p className="text-xs text-[#8c7564]">Listed {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            {user && item.seller?.id !== user.id && item.status === 'ACTIVE' && (
              <div className="mt-6 space-y-3 rounded-2xl border border-[#e4d6c8] bg-white p-5">
                <p className="font-semibold text-[#221b16]">Make an Offer</p>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  placeholder="Your offer in ৳" className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
                <textarea value={offerMsg} onChange={e => setOfferMsg(e.target.value)}
                  placeholder="Message to seller (optional)" rows={2}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
                <button onClick={() => offerMutation.mutate()} disabled={!offerAmount || offerMutation.isPending}
                  className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
                  {offerMutation.isPending ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
