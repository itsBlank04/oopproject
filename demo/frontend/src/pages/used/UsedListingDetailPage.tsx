import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import { useConfirmAction } from '../../hooks/useConfirmAction'

export default function UsedListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { askConfirm, showResult, Dialogs } = useConfirmAction()
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMsg, setOfferMsg] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleChat = async () => {
    if (!user) { showResult('Please sign in first', 'error'); return }
    try {
      await apiClient.post('/api/chat/conversations/used', { listingId: parseInt(id!) })
      navigate('/messages')
    } catch (err: any) {
      showResult(err.response?.data?.error ?? 'Could not start conversation', 'error')
    }
  }

  const { data: item, isLoading } = useQuery<any>({
    queryKey: ['used-listing', id],
    queryFn: () => apiClient.get(`/api/used-listings/${id}`).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev: any) => prev,
  })

  const offerMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/used-listings/${id}/offers`, {
      offerAmountBdt: parseFloat(offerAmount), message: offerMsg
    }),
    onSuccess: () => {
      setOfferAmount('')
      setOfferMsg('')
      showResult('Offer sent!', 'success')
    },
    onError: (e: any) => showResult(e.response?.data?.error || 'Failed to send offer', 'error'),
  })

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-[#94A3B8]">Loading...</div>
  if (!item) return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-[#94A3B8]">Item not found</div>

  const images = item.images || []
  const videos = item.videos || []
  const allMedia = [...images.map((i: any) => ({ ...i, type: 'image', url: i.imageUrl })), ...videos.map((v: any) => ({ ...v, type: 'video', url: v.videoUrl }))]

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/used-listings" className="text-sm text-[#94A3B8] hover:underline">← Back to listings</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* Media gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#eef2ff]">
              {allMedia.length > 0 ? (
                  allMedia[selectedImage]?.type === 'video' ? (
                  <video src={allMedia[selectedImage]?.url} controls className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <button type="button" onClick={() => setLightboxIndex(selectedImage)} className="h-full w-full">
                    <img src={allMedia[selectedImage]?.url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-[#94A3B8]">No image</div>
              )}
            </div>
            {allMedia.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {allMedia.map((m: any, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === i ? 'border-[#1e293b]' : 'border-[#e0e7ff] hover:border-[#cbd5e1]'
                    }`}>
                    {m.type === 'video' ? (
                      <>
                        <video src={m.url} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg">▶</div>
                      </>
                    ) : (
                      <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {allMedia.length > 0 && (
              <p className="mt-2 text-xs text-[#94A3B8]">
                {images.length} photo{images.length !== 1 ? 's' : ''}{videos.length > 0 ? ` · ${videos.length} video${videos.length !== 1 ? 's' : ''}` : ''}
              </p>
            )}
          </div>

          {/* Info & offer */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[#94A3B8]">{item.conditionLevel?.label || 'Used'} · {item.category?.name}</p>
            <h1 className="mt-2 font-[Fraunces] text-3xl text-[#1e293b]">{item.title}</h1>
            <p className="mt-4 text-3xl font-bold text-[#1e293b]">৳{item.askingPriceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#64748b]">{item.description}</p>
            <div className="mt-4 rounded-xl border border-[#e0e7ff] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">Sold by {item.seller?.displayName}</p>
                  <p className="text-xs text-[#94A3B8]">Listed {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                {user && item.seller?.id !== user.id && (
                  <button onClick={handleChat}
                    className="rounded-lg border border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#1e293b] transition hover:bg-[#eef2ff]">
                    Chat with Seller
                  </button>
                )}
              </div>
            </div>
            {user && item.seller?.id !== user.id && item.status === 'ACTIVE' && (
              <div className="mt-6 space-y-3 rounded-2xl border border-[#e0e7ff] bg-white p-5">
                <p className="font-semibold text-[#1e293b]">Make an Offer</p>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  placeholder="Your offer in ৳" className="w-full rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm outline-none focus:border-[#1e293b]" />
                <textarea value={offerMsg} onChange={e => setOfferMsg(e.target.value)}
                  placeholder="Message to seller (optional)" rows={2}
                  className="w-full rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm outline-none focus:border-[#1e293b]" />
                <button onClick={() => {
                  if (!item) return
                  const amount = parseFloat(offerAmount)
                  askConfirm({
                    title: 'Submit offer',
                    description: `Submit offer of ৳${amount.toLocaleString('en-BD')} for "${item.title}"? Seller has 24h to respond.`,
                    label: 'Offer submitted',
                    request: () => offerMutation.mutateAsync(),
                  })
                }} disabled={!offerAmount || offerMutation.isPending}
                  className="w-full rounded-xl bg-[#1e293b] py-3 font-semibold text-[#f8fafc] disabled:opacity-50">
                  {offerMutation.isPending ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
        {lightboxIndex !== null && (
        <ImageLightbox
          images={allMedia.map((m: any) => ({ url: m.url, name: m.name, type: m.type }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {Dialogs}
    </div>
  )
}
