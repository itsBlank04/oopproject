import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

export default function AuctionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [bidAmount, setBidAmount] = useState('')
  const [selectedLot, setSelectedLot] = useState<number | null>(null)
  const [selectedImg, setSelectedImg] = useState<Record<number, number>>({})
  const [showUpload, setShowUpload] = useState<number | null>(null)

  const { data: auction, isLoading } = useQuery<any>({
    queryKey: ['auction', id],
    queryFn: () => apiClient.get(`/api/auctions/${id}`).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  })

  const bidMutation = useMutation({
    mutationFn: (lotId: number) => apiClient.post(`/api/auction-lots/${lotId}/bids`, { amountBdt: parseFloat(bidAmount) }),
    onSuccess: () => {
      toast.success('Bid placed!')
      setBidAmount('')
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to place bid'),
  })

  const uploadImagesMutation = useMutation({
    mutationFn: async ({ lotId, urls }: { lotId: number; urls: string[] }) => {
      for (const url of urls) {
        await apiClient.post(`/api/auction-lots/${lotId}/images`, { imageUrl: url }).catch(() => {})
      }
    },
    onSuccess: () => {
      toast.success('Images uploaded to lot')
      setShowUpload(null)
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
    },
  })

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Loading...</div>
  if (!auction) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Auction not found</div>

  const timeLeft = new Date(auction.endTime).getTime() - Date.now()
  const isLive = auction.status === 'ACTIVE' && timeLeft > 0
  const isOwner = user?.id === auction.vendor?.id

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/auctions" className="text-sm text-[#8c7564] hover:underline">← All auctions</Link>
        <div className="mt-6 rounded-2xl border border-[#e4d6c8] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {isLive ? '🔴 LIVE' : auction.status}
              </span>
              <h1 className="mt-3 font-[Fraunces] text-3xl text-[#221b16]">{auction.title}</h1>
              <p className="mt-1 text-sm text-[#8c7564]">by {auction.vendor?.displayName} · {auction.type}</p>
            </div>
            <div className="text-right text-sm text-[#6c5b4f]">
              <p>Starts: {new Date(auction.startTime).toLocaleString()}</p>
              <p>Ends: {new Date(auction.endTime).toLocaleString()}</p>
              {isLive && <p className="mt-1 font-semibold text-emerald-600">
                {Math.floor(timeLeft / 3600000)}h {Math.floor((timeLeft % 3600000) / 60000)}m left
              </p>}
            </div>
          </div>
        </div>

        <h2 className="mt-8 font-[Fraunces] text-2xl text-[#221b16]">Lots ({auction.lots?.length || 0})</h2>
        <div className="mt-4 space-y-4">
          {(auction.lots || []).map((lot: any) => {
            const images = lot.images || []
            const si = selectedImg[lot.id] || 0
            return (
              <div key={lot.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
                <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
                  {/* Lot images */}
                  <div>
                    <div className="aspect-square overflow-hidden rounded-xl bg-[#f0e8df]">
                      {images.length > 0 ? (
                        <img src={images[si]?.imageUrl} alt={lot.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#a28672]">No image</div>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto">
                        {images.map((img: any, i: number) => (
                          <button key={i} onClick={() => setSelectedImg({ ...selectedImg, [lot.id]: i })}
                            className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 ${si === i ? 'border-[#221b16]' : 'border-[#e4d6c8]'}`}>
                            <img src={img.imageUrl} loading="lazy" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    {isOwner && (
                      <button onClick={() => setShowUpload(showUpload === lot.id ? null : lot.id)}
                        className="mt-2 w-full rounded-lg border border-[#d7c7b8] px-3 py-1.5 text-xs text-[#221b16] hover:bg-[#f9f5f0]">
                        📷 {showUpload === lot.id ? 'Cancel' : 'Add Photos'}
                      </button>
                    )}
                    {showUpload === lot.id && (
                      <div className="mt-2">
                        <MediaUploader folder={`auctions/${auction.id}/lots/${lot.id}`}
                          maxFiles={8} maxSizeMB={10} allowVideo={false} compact
                          onUpload={(urls) => uploadImagesMutation.mutate({ lotId: lot.id, urls })} />
                      </div>
                    )}
                  </div>
                  {/* Lot info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#221b16]">{lot.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lot.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {lot.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#8c7564]">{lot.conditionNote} · Min increment: ৳{lot.minBidIncrementBdt}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-[#f9f5f0] p-3">
                        <p className="text-xs text-[#8c7564]">Starting</p>
                        <p className="mt-1 font-bold text-[#221b16]">৳{lot.startingPriceBdt?.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-[#f9f5f0] p-3">
                        <p className="text-xs text-[#8c7564]">Current</p>
                        <p className="mt-1 font-bold text-emerald-600">৳{lot.currentBidBdt?.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-[#f9f5f0] p-3">
                        <p className="text-xs text-[#8c7564]">Reserve</p>
                        <p className="mt-1 font-bold text-[#221b16]">{lot.reservePriceBdt ? `৳${lot.reservePriceBdt.toLocaleString()}` : 'None'}</p>
                      </div>
                    </div>
                    {user && isLive && lot.status === 'ACTIVE' && (
                      <div className="mt-4 flex gap-3">
                        <input type="number" value={selectedLot === lot.id ? bidAmount : ''} placeholder={`Min ৳${(lot.currentBidBdt + lot.minBidIncrementBdt).toLocaleString()}`}
                          onFocus={() => setSelectedLot(lot.id)}
                          onChange={e => { setSelectedLot(lot.id); setBidAmount(e.target.value) }}
                          className="flex-1 rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
                        <button onClick={() => bidMutation.mutate(lot.id)} disabled={bidMutation.isPending || selectedLot !== lot.id}
                          className="rounded-xl bg-[#221b16] px-6 py-2.5 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50">
                          {bidMutation.isPending && selectedLot === lot.id ? 'Bidding...' : 'Place Bid'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
