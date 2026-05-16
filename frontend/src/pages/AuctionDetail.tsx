import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { connectAuction, disconnectAuction } from '@/api/websocket'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Auction, AuctionLot, Bid } from '@/types'

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-600',
  PREPARING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXTENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-purple-100 text-purple-700',
}

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [bidAmount, setBidAmount] = useState('')
  const [liveCurrentBid, setLiveCurrentBid] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [showAgreement, setShowAgreement] = useState(false)
  const [liveBidFeed, setLiveBidFeed] = useState<Bid[]>([])
  const [activeBidders, setActiveBidders] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.get<Auction>(`/auctions/${id}`),
    enabled: !!id,
  })

  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.get<{ id: number; lotId: number }[]>('/watchlist'),
    enabled: !!user,
  })

  const { data: agreementStatus } = useQuery({
    queryKey: ['agreement-status'],
    queryFn: () => api.get<{ terms: boolean; privacy: boolean; auctionRules: boolean }>('/agreements/status'),
    enabled: !!user,
  })

  const acceptAuctionRules = useMutation({
    mutationFn: () => api.post('/agreements/accept', { type: 'AUCTION_RULES' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement-status'] })
      setShowAgreement(false)
      toast.success('Auction rules accepted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const lot = auction?.lots?.[0]
  const currentBid = liveCurrentBid ?? lot?.currentBidBdt ?? 0
  const isWatched = lot ? watchlist?.some((w) => w.lotId === lot.id) ?? false : false
  const watchEntry = lot ? watchlist?.find((w) => w.lotId === lot.id) : undefined
  const hasAcceptedRules = agreementStatus?.auctionRules ?? false
  const isActive = auction?.status === 'ACTIVE' || auction?.status === 'EXTENDED'

  const { data: bids } = useQuery({
    queryKey: ['bids', lot?.id],
    queryFn: () => api.get<Bid[]>(`/auctions/lots/${lot!.id}/bids`),
    enabled: !!lot,
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeLeft = () => {
    if (!auction) return ''
    const diff = new Date(auction.endTime).getTime() - now
    if (diff <= 0) return 'Auction ended'
    const d = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff % 86_400_000) / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1000)
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
    return `${h}h ${m}m ${s}s`
  }

  const addWatch = useMutation({
    mutationFn: (lotId: number) => api.post(`/watchlist?lotId=${lotId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const removeWatch = useMutation({
    mutationFn: (entryId: number) => api.delete(`/watchlist/${entryId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const handleBid = async () => {
    if (!user) return toast.error('Login to bid')
    if (!lot) return
    if (!hasAcceptedRules) {
      setShowAgreement(true)
      return
    }

    const amount = Number(bidAmount)
    const minimum = lot.startingPriceBdt
      ? lot.currentBidBdt
        ? Math.max(lot.currentBidBdt, lot.startingPriceBdt) + 1
        : lot.startingPriceBdt + 1
      : 1
    if (!bidAmount || amount < minimum) {
      return toast.error(`Minimum bid is ৳${minimum}`)
    }

    try {
      const result = await api.post<Bid>(`/auctions/lots/${lot.id}/bids`, { amountBdt: amount })
      setBidAmount('')
      setLiveCurrentBid(result.amountBdt)
      toast.success('Bid placed!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bid failed'
      toast.error(msg)
    }
  }

  const onBid = useCallback((bid: Bid) => {
    setLiveCurrentBid(bid.amountBdt)
    setLiveBidFeed(prev => [bid, ...prev].slice(0, 50))
    setActiveBidders(prev => prev + 1)
    queryClient.invalidateQueries({ queryKey: ['bids'] })
    // Auto-scroll feed
    setTimeout(() => feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100)
  }, [queryClient])

  const onLotUpdate = useCallback((data: unknown) => {
    const updated = data as AuctionLot
    if (updated.currentBidBdt !== undefined) {
      setLiveCurrentBid(updated.currentBidBdt)
    }
  }, [])

  const onBidRef = useRef(onBid)
  const onLotUpdateRef = useRef(onLotUpdate)
  onBidRef.current = onBid
  onLotUpdateRef.current = onLotUpdate

  useEffect(() => {
    if (lot?.id) {
      connectAuction(lot.id, onBidRef.current, onLotUpdateRef.current)
      if (bids) {
        const uniqueBidders = new Set(bids.map(b => b.bidderId))
        setActiveBidders(uniqueBidders.size)
      }
    }
    return () => {
      disconnectAuction()
    }
  }, [lot?.id])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-ink-400">Auction not found</p>
        <Link to="/auctions" className="btn btn-secondary mt-4">Back to auctions</Link>
      </div>
    )
  }

  const statusCls = statusColors[auction.status] || 'bg-gray-100 text-gray-600'
  const timeLeftStr = timeLeft()
  const isEnded = timeLeftStr === 'Auction ended'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/auctions" className="text-sm text-teal-600 hover:underline mb-6 inline-block">
        &larr; Back to auctions
      </Link>

      <div className="card p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl text-ink-950">{auction.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${statusCls}`}>
                {auction.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-500">
              <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-600 text-xs font-medium">{auction.type}</span>
              {auction.vendorName && <span>by {auction.vendorName}</span>}
            </div>
            <p className="text-sm text-ink-500 mt-2">Ends: {new Date(auction.endTime).toLocaleString()}</p>
          </div>

          {/* Timer + active bidders */}
          <div className="text-right space-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-400">Time left</p>
              <p className={`text-2xl font-bold tabular-nums ${isEnded ? 'text-red-500' : 'text-ink-900'}`}>
                {timeLeftStr}
              </p>
            </div>
            {isActive && (
              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-ink-500">{activeBidders} bidder{activeBidders !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {lot && (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="aspect-[4/3] bg-cream-100 rounded-xl flex items-center justify-center text-ink-300 text-5xl overflow-hidden">
                {lot.images?.[0]?.imageUrl ? (
                  <img src={lot.images[0].imageUrl} alt={lot.title} className="w-full h-full object-cover" />
                ) : (
                  '⚡'
                )}
              </div>

              {/* Bid panel */}
              <div>
                <div className="flex items-start justify-between">
                  <h2 className="font-display text-2xl text-ink-950">{lot.title}</h2>
                  {user && (
                    <button
                      onClick={() => isWatched && watchEntry ? removeWatch.mutate(watchEntry.id) : addWatch.mutate(lot.id)}
                      className={`text-sm px-3 py-1 rounded-full border transition ${isWatched ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-ink-300 text-ink-500 hover:border-teal-400'}`}
                    >
                      {isWatched ? '★ Watching' : '☆ Watch'}
                    </button>
                  )}
                </div>
                <p className="text-ink-600 mt-2">{lot.description}</p>
                <p className="mt-4 text-sm text-ink-400">Starting price: ৳{Number(lot.startingPriceBdt).toLocaleString()}</p>

                {/* Current bid display */}
                <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cream-50 border border-teal-200">
                  <p className="text-xs uppercase tracking-wider text-teal-600 font-medium">Current Highest Bid</p>
                  <p className="text-4xl font-bold text-teal-700 mt-1">৳{Number(currentBid).toLocaleString()}</p>
                </div>

                {/* Bid input */}
                {isActive && (
                  <div className="mt-6">
                    <label className="label">Your bid</label>
                    <div className="flex gap-3">
                      <input
                        className="input flex-1"
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min ৳${Number(currentBid) + 1}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleBid()}
                      />
                      <button className="btn btn-primary btn-lg" onClick={handleBid}>
                        Place bid
                      </button>
                    </div>
                  </div>
                )}

                {/* Agreement modal */}
                {showAgreement && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                      <h3 className="font-display text-xl text-ink-950 mb-3">Auction Rules Agreement</h3>
                      <p className="text-sm text-ink-600 mb-4">
                        You must accept the Auction Rules before placing a bid. This includes agreeing to pay the full
                        amount if you win, and understanding that non-payment may result in account restrictions.
                      </p>
                      <div className="flex gap-3">
                        <button
                          className="btn btn-primary flex-1"
                          onClick={() => acceptAuctionRules.mutate()}
                          disabled={acceptAuctionRules.isPending}
                        >
                          {acceptAuctionRules.isPending ? 'Accepting...' : 'Accept & Continue'}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowAgreement(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Bid Room */}
            <div className="mt-10 border-t border-cream-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl text-ink-950">
                  {isActive ? '🔴 Live Bid Room' : 'Bid History'}
                </h3>
                {isActive && liveBidFeed.length > 0 && (
                  <span className="text-sm text-ink-400 animate-pulse">Live updates active</span>
                )}
              </div>

              {/* Live bid feed */}
              {isActive && liveBidFeed.length > 0 && (
                <div ref={feedRef} className="mb-4 space-y-1.5 max-h-48 overflow-y-auto rounded-xl bg-cream-50 p-4 border border-cream-200">
                  {liveBidFeed.map((bid, i) => (
                    <div key={`live-${bid.id}-${i}`} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg text-sm animate-[slideIn_0.3s_ease]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-ink-600 font-medium">{bid.bidderName || 'Anonymous'}</span>
                      </div>
                      <span className="font-bold text-teal-700">৳{Number(bid.amountBdt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Full bid history */}
              {!bids?.length && !liveBidFeed.length ? (
                <p className="text-ink-400 text-sm">No bids yet — be the first!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...(bids || [])].reverse().map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between py-2 px-4 bg-cream-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink-600">{bid.bidderName || 'Anonymous'}</span>
                        <span className="text-xs text-ink-400">{new Date(bid.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className="font-semibold text-teal-700">৳{Number(bid.amountBdt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional lot images gallery */}
            {lot.images && lot.images.length > 1 && (
              <div className="mt-8 border-t border-cream-200 pt-8">
                <h3 className="font-display text-xl text-ink-950 mb-4">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lot.images.map((img) => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-cream-100">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
