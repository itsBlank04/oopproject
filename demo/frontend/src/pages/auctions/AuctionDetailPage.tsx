import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import AuctionCountdown from '../../components/AuctionCountdown'
import toast from 'react-hot-toast'

type Seller = { id: number; displayName?: string; redFlagCount?: number }
type AuctionImage = { id?: number; imageUrl: string; sortOrder?: number }
type AuctionLot = {
  id: number
  title: string
  description?: string
  conditionNote?: string
  startingPriceBdt?: number
  reservePriceBdt?: number | null
  currentBidBdt?: number
  minBidIncrementBdt?: number
  extensionDurationMinutes?: number
  extensionsCount?: number
  maxExtensions?: number
  status: string
  images?: AuctionImage[]
  category?: { id: number; name: string }
}
type Auction = {
  id: number
  title: string
  type: string
  status: string
  startTime?: string
  endTime?: string
  vendor?: Seller | null
  lots?: AuctionLot[]
}
type Bid = {
  id: number
  amountBdt: number
  createdAt: string
  winning?: boolean
  isWinning?: boolean
  bidder?: Seller | null
}
type Winner = {
  id: number
  lot?: AuctionLot
  finalPriceBdt?: number
  paymentStatus?: string
  paymentDeadline?: string
  reserveMet?: boolean
}
type WatchlistEntry = { id: number; lot?: { id: number } }
type BidMap = Record<number, Bid[]>

function money(value: unknown) {
  const amount = Number(value ?? 0)
  return `BDT ${amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
}

function numeric(value: unknown) {
  return Number(value ?? 0)
}

function visibleCurrent(lot: AuctionLot) {
  return Math.max(numeric(lot.currentBidBdt), numeric(lot.startingPriceBdt))
}

function minNextBid(lot: AuctionLot) {
  return visibleCurrent(lot) + numeric(lot.minBidIncrementBdt || 0)
}

function sortedBids(bids?: Bid[]) {
  return [...(bids ?? [])].sort((a, b) => numeric(b.amountBdt) - numeric(a.amountBdt))
}

function uniqueBidderCount(bids?: Bid[]) {
  return new Set((bids ?? []).map(bid => bid.bidder?.id).filter(Boolean)).size
}

function sellerTrust(vendor?: Seller | null) {
  const redFlags = Number(vendor?.redFlagCount ?? 0)
  return Math.max(62, 98 - redFlags * 12)
}

function heatScore(lot: AuctionLot, bids: Bid[], auctionStatus: string) {
  const bidBoost = Math.min(56, bids.length * 9)
  const priceBoost = visibleCurrent(lot) > numeric(lot.startingPriceBdt) ? 18 : 0
  const liveBoost = auctionStatus === 'ACTIVE' && lot.status === 'ACTIVE' ? 24 : 0
  return Math.min(100, 14 + bidBoost + priceBoost + liveBoost)
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'border-emerald-300 bg-emerald-50 text-emerald-700'
  if (status === 'PREPARING') return 'border-amber-300 bg-amber-50 text-amber-700'
  if (status === 'CLOSED') return 'border-slate-300 bg-slate-50 text-slate-600'
  return 'border-[#e4d6c8] bg-[#f9f5f0] text-[#6c5b4f]'
}

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not scheduled'
}

function eventUrl(auctionId: string) {
  const baseUrl = String(apiClient.defaults.baseURL || '').replace(/\/$/, '')
  return `${baseUrl}/api/auctions/${auctionId}/events`
}

export default function AuctionDetailPage() {
  const { id } = useParams()
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [bidDrafts, setBidDrafts] = useState<Record<number, string>>({})
  const [selectedImg, setSelectedImg] = useState<Record<number, number>>({})
  const [lightboxLot, setLightboxLot] = useState<{ lotId: number; index: number } | null>(null)
  const [showUpload, setShowUpload] = useState<number | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<number | null>(null)
  const [realtimeState, setRealtimeState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting')
  const [pulseLotId, setPulseLotId] = useState<number | null>(null)

  const { data: auction, isLoading } = useQuery<Auction>({
    queryKey: ['auction', id],
    queryFn: () => apiClient.get(`/api/auctions/${id}`).then(r => r.data),
    enabled: !!id,
    staleTime: 1_000,
    refetchInterval: query => query.state.data?.status === 'ACTIVE' ? 5_000 : 15_000,
    placeholderData: previous => previous,
  })

  const lotIds = useMemo(() => (auction?.lots ?? []).map(lot => lot.id), [auction?.lots])
  const lotIdsKey = lotIds.join(',')

  const { data: bidMap = {} } = useQuery<BidMap>({
    queryKey: ['auction-bids', id, lotIdsKey],
    enabled: lotIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(lotIds.map(async lotId => {
        const response = await apiClient.get(`/api/auction-lots/${lotId}/bids`)
        return [lotId, Array.isArray(response.data) ? response.data : []] as const
      }))
      return Object.fromEntries(entries) as BidMap
    },
    staleTime: 1_000,
    refetchInterval: auction?.status === 'ACTIVE' ? 2_000 : 12_000,
  })

  const { data: agreement } = useQuery<{ accepted: boolean }>({
    queryKey: ['auction-rules'],
    queryFn: () => apiClient.get('/api/agreements/AUCTION_RULES').then(r => r.data),
    enabled: !!user,
    staleTime: 30_000,
  })

  const { data: myWins = [] } = useQuery<Winner[]>({
    queryKey: ['auction-my-wins'],
    queryFn: () => apiClient.get('/api/auction-winners/me').then(r => r.data),
    enabled: !!user,
    staleTime: 5_000,
  })

  const { data: watchlist = [] } = useQuery<WatchlistEntry[]>({
    queryKey: ['auction-watchlist'],
    queryFn: () => apiClient.get('/api/watchlist').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!user && hasRole('CUSTOMER'),
    staleTime: 5_000,
  })

  useEffect(() => {
    if (!id) return
    setRealtimeState('connecting')
    const source = new EventSource(eventUrl(id), { withCredentials: true })
    const syncAuction = () => {
      setRealtimeState('connected')
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
      queryClient.invalidateQueries({ queryKey: ['auction-bids', id] })
      queryClient.invalidateQueries({ queryKey: ['auction-my-wins'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    const handleBid = (event: MessageEvent) => {
      syncAuction()
      try {
        const payload = JSON.parse(event.data) as { lotId?: number }
        const lotId = Number(payload.lotId)
        if (Number.isFinite(lotId)) {
          setPulseLotId(lotId)
          window.setTimeout(() => setPulseLotId(current => current === lotId ? null : current), 900)
        }
      } catch {
        setPulseLotId(null)
      }
    }
    source.addEventListener('connected', syncAuction)
    source.addEventListener('bid_placed', handleBid)
    source.addEventListener('auction_opened', syncAuction)
    source.addEventListener('auction_closed', syncAuction)
    source.addEventListener('auction_published', syncAuction)
    source.addEventListener('auction_status_changed', syncAuction)
    source.onerror = () => setRealtimeState('reconnecting')
    return () => source.close()
  }, [id, queryClient])

  const watchedLotIds = useMemo(() => new Set(watchlist.map(entry => entry.lot?.id).filter(Boolean)), [watchlist])
  const lots = auction?.lots ?? []
  const isLive = auction?.status === 'ACTIVE'
  const isPreparing = auction?.status === 'PREPARING'
  const isOwner = !!user && user.id === auction?.vendor?.id
  const trust = sellerTrust(auction?.vendor)
  const totalBidCount = lots.reduce((total, lot) => total + (bidMap[lot.id]?.length ?? 0), 0)
  const activeLotCount = lots.filter(lot => lot.status === 'ACTIVE').length
  const topLots = [...lots].sort((a, b) => visibleCurrent(b) - visibleCurrent(a)).slice(0, 4)

  const payWinner = useMutation({
    mutationFn: (winnerId: number) => apiClient.post(`/api/auction-payments/${winnerId}`, { method: 'DUMMY' }),
    onSuccess: () => {
      toast.success('Payment recorded')
      queryClient.invalidateQueries({ queryKey: ['auction-my-wins'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Payment failed'),
  })

  const bidMutation = useMutation({
    mutationFn: ({ lotId, amountBdt }: { lotId: number; amountBdt: number }) => apiClient.post(`/api/auction-lots/${lotId}/bids`, { amountBdt }),
    onSuccess: (_, variables) => {
      toast.success('Bid locked in')
      setBidDrafts(previous => ({ ...previous, [variables.lotId]: '' }))
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
      queryClient.invalidateQueries({ queryKey: ['auction-bids', id] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to place bid'),
  })

  const acceptRules = useMutation({
    mutationFn: () => apiClient.post('/api/agreements/AUCTION_RULES'),
    onSuccess: () => {
      toast.success('Auction rules accepted')
      queryClient.invalidateQueries({ queryKey: ['auction-rules'] })
      setRulesOpen(false)
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Could not accept rules'),
  })

  const watchMutation = useMutation({
    mutationFn: ({ lotId, watched }: { lotId: number; watched: boolean }) => watched ? apiClient.delete(`/api/watchlist/${lotId}`) : apiClient.post(`/api/watchlist/${lotId}`),
    onSuccess: (_, variables) => {
      toast.success(variables.watched ? 'Removed from watchlist' : 'Added to watchlist')
      queryClient.invalidateQueries({ queryKey: ['auction-watchlist'] })
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Watchlist update failed'),
  })

  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ['auction-bookmark', id],
    queryFn: () => apiClient.get(`/api/bookmarks/auctions/${id}`).then(r => r.data),
    enabled: !!user && !!id,
    staleTime: 5_000,
  })

  const bookmarkMutation = useMutation({
    mutationFn: (bookmarked: boolean) => bookmarked
      ? apiClient.delete(`/api/bookmarks/auctions/${id}`)
      : apiClient.post(`/api/bookmarks/auctions/${id}`),
    onSuccess: (_, bookmarked) => {
      toast.success(bookmarked ? 'Bookmark removed' : 'Auction bookmarked')
      queryClient.invalidateQueries({ queryKey: ['auction-bookmark', id] })
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Bookmark update failed'),
  })

  const uploadImagesMutation = useMutation({
    mutationFn: async ({ lotId, urls }: { lotId: number; urls: string[] }) => {
      for (const url of urls) {
        await apiClient.post(`/api/auction-lots/${lotId}/images`, { imageUrl: url })
      }
    },
    onSuccess: () => {
      toast.success('Images uploaded')
      setShowUpload(null)
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Image upload failed'),
  })

  function submitBid(lot: AuctionLot, amountOverride?: number) {
    const amount = amountOverride ?? Number(bidDrafts[lot.id] || 0)
    setSelectedLot(lot.id)
    if (!agreement?.accepted) {
      setBidDrafts(previous => ({ ...previous, [lot.id]: String(amount || minNextBid(lot)) }))
      setRulesOpen(true)
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid bid amount')
      return
    }
    const minimum = minNextBid(lot)
    if (amount < minimum) {
      toast.error(`Minimum next bid is ${money(minimum)}`)
      return
    }
    bidMutation.mutate({ lotId: lot.id, amountBdt: amount })
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#6c5b4f]">Loading auction room...</div>
  if (!auction) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#6c5b4f]">Auction not found</div>

  return (
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16]">
      <header className="relative overflow-hidden border-b border-[#e4d6c8] bg-[#faf8f5] px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(196,149,106,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(13,148,136,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link to="/auctions" className="inline-flex items-center rounded-full border border-[#e4d6c8] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6c5b4f] shadow-sm transition-all hover:border-[#c4956a] hover:text-[#c4956a] hover:shadow-md">Back</Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(auction.status)}`}>{auction.status}</span>
                <span className="rounded-full border border-[#e4d6c8] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5b4f]">{auction.type}</span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Trust {trust}/100</span>
              </div>
              <h1 className="mt-4 font-[Fraunces] text-3xl leading-tight text-[#221b16] md:text-5xl">{auction.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6c5b4f]">
                {auction.vendor?.displayName || 'Verified seller'} is running {lots.length} lot{lots.length === 1 ? '' : 's'} with locked bid increments, live synchronization, and automatic winner capture.
              </p>
            </div>
            <div className="rounded-xl border border-[#e4d6c8] bg-white p-4 shadow-[0_8px_30px_rgba(34,27,22,0.06)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c4956a]">Clock</p>
                <div className="flex items-center gap-2">
                  {user && (
                    <button onClick={() => bookmarkMutation.mutate(!!bookmarkStatus?.bookmarked)}
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 ${bookmarkStatus?.bookmarked ? 'bg-[#c4956a] text-white shadow-sm' : 'border border-[#e4d6c8] text-[#6c5b4f] hover:border-[#c4956a]/50 hover:text-[#c4956a]'}`}>
                      {bookmarkStatus?.bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${realtimeState === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{realtimeState}</span>
                </div>
              </div>
              <div className="mt-2 text-2xl font-black tabular-nums tracking-tight">
                {isPreparing && auction.startTime && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c4956a]">Starts in</p>
                    <AuctionCountdown endTime={auction.startTime} />
                  </div>
                )}
                {isLive && auction.endTime && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Ends in</p>
                    <AuctionCountdown endTime={auction.endTime} />
                  </div>
                )}
                {auction.status === 'CLOSED' && <span className="text-rose-700">Auction closed</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <MiniStat label="Lots" value={lots.length} />
                <MiniStat label="Open" value={activeLotCount} />
                <MiniStat label="Bids" value={totalBidCount} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          {lots.length === 0 ? (
            <div className="rounded-[2rem] border border-[#e4d6c8] bg-white p-10 text-center text-[#6c5b4f]">No lots have been added yet.</div>
          ) : lots.map(lot => {
            const images = lot.images ?? []
            const imageIndex = Math.min(selectedImg[lot.id] ?? 0, Math.max(0, images.length - 1))
            const bids = sortedBids(bidMap[lot.id])
            const topBid = bids[0]
            const nextBid = minNextBid(lot)
            const increment = numeric(lot.minBidIncrementBdt || 0)
            const isHighest = !!user && topBid?.bidder?.id === user.id && lot.status === 'ACTIVE'
            const watched = watchedLotIds.has(lot.id)
            const myWin = myWins.find(win => win.lot?.id === lot.id)
            const heat = heatScore(lot, bids, auction.status)
            const pulse = pulseLotId === lot.id

            return (
              <article key={lot.id} className={`overflow-hidden rounded-2xl border bg-white transition-all ${pulse ? 'border-[#c4956a] shadow-[0_0_0_1px_rgba(238,90,36,0.7),0_8px_32px_rgba(238,90,36,0.18)]' : 'border-[#e4d6c8] shadow-[0_4px_24px_rgba(34,27,22,0.06)]'}`}>
                <div className="grid gap-0 xl:grid-cols-[320px_1fr]">
                  <div className="border-b border-[#e4d6c8] bg-[#f9f5f0] p-3 xl:border-b-0 xl:border-r">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-inner">
                      {images.length > 0 ? (
                        <button type="button" onClick={() => setLightboxLot({ lotId: lot.id, index: imageIndex })} className="h-full w-full">
                          <img src={images[imageIndex]?.imageUrl} alt={lot.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                        </button>
                      ) : (
                        <div className="flex h-full items-center justify-center border border-dashed border-[#e4d6c8] text-xs text-[#8c7564]">No photo</div>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                        {images.map((image, index) => (
                          <button key={`${image.imageUrl}-${index}`} onClick={() => setSelectedImg(previous => ({ ...previous, [lot.id]: index }))}
                            className={`h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${imageIndex === index ? 'border-[#c4956a]' : 'border-[#e4d6c8] opacity-70 hover:opacity-100'}`}>
                            <img src={image.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    {isOwner && (
                      <button onClick={() => setShowUpload(showUpload === lot.id ? null : lot.id)}
                        className="mt-2 w-full rounded-xl border border-[#e4d6c8] bg-white px-3 py-1.5 text-xs font-bold text-[#221b16] transition hover:border-[#c4956a]/50">
                        {showUpload === lot.id ? 'Close' : 'Add photos'}
                      </button>
                    )}
                    {showUpload === lot.id && (
                      <div className="mt-2 rounded-xl border border-[#e4d6c8] bg-white p-2">
                        <MediaUploader folder={`auctions/${auction.id}/lots/${lot.id}`} maxFiles={8} maxSizeMB={10} allowVideo={false} compact onUpload={urls => uploadImagesMutation.mutate({ lotId: lot.id, urls })} />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone(lot.status)}`}>{lot.status}</span>
                          {isHighest && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">Highest</span>}
                          {watched && <span className="rounded-full bg-[#c4956a] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">Watching</span>}
                        </div>
                        <h2 className="mt-2 font-[Fraunces] text-lg text-[#221b16] leading-tight">{lot.title}</h2>
                        <p className="mt-0.5 text-xs text-[#8c7564]">{lot.conditionNote || 'Condition not specified'}{lot.category?.name ? ` · ${lot.category.name}` : ''}</p>
                      </div>
                      {user && hasRole('CUSTOMER') && (
                        <button onClick={() => watchMutation.mutate({ lotId: lot.id, watched })}
                          className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${watched ? 'bg-[#c4956a] text-white' : 'border border-[#e4d6c8] bg-white text-[#221b16] hover:border-[#c4956a]/50'}`}>
                          {watched ? 'Unwatch' : 'Watch'}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <PriceTile label="Current" value={money(visibleCurrent(lot))} highlight />
                      <PriceTile label="Next" value={money(nextBid)} />
                      <PriceTile label="Bids" value={bids.length} />
                      <PriceTile label="Bidders" value={uniqueBidderCount(bids)} />
                    </div>

                    <div className="mt-3 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7564]">Heat</p>
                        <p className="text-xs font-bold text-[#c4956a]">{heat}%</p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e4d6c8]">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#c4956a] to-rose-500 transition-all" style={{ width: `${heat}%` }} />
                      </div>
                    </div>

                    {lot.description && <p className="mt-3 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-3 text-xs leading-6 text-[#6c5b4f]">{lot.description}</p>}

                    {user && isLive && lot.status === 'ACTIVE' && !isOwner && (
                      <div className="mt-3 rounded-xl border border-[#c4956a]/30 bg-[#c4956a]/5 p-3">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input type="number" min={nextBid} value={bidDrafts[lot.id] ?? ''} placeholder={`Min ${money(nextBid)}`}
                            onFocus={() => setSelectedLot(lot.id)}
                            onChange={event => { setSelectedLot(lot.id); setBidDrafts(previous => ({ ...previous, [lot.id]: event.target.value })) }}
                            className="rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm font-bold text-[#221b16] outline-none transition placeholder:text-[#8c7564] focus:border-[#c4956a] focus:shadow-[0_0_0_3px_rgba(196,149,106,0.15)]" />
                          <button onClick={() => submitBid(lot)} disabled={bidMutation.isPending && selectedLot === lot.id}
                            className="rounded-xl bg-[#c4956a] px-6 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(196,149,106,0.3)] transition-all hover:bg-[#a87a4e] hover:shadow-lg active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60">
                            {bidMutation.isPending && selectedLot === lot.id ? 'Locking...' : 'Bid'}
                          </button>
                        </div>
                        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                          {[nextBid, nextBid + increment, nextBid + increment * 2].map(value => (
                            <button key={value} onClick={() => submitBid(lot, value)}
                              className="rounded-xl border border-[#c4956a]/40 bg-[#c4956a]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#c4956a] transition-all hover:bg-[#a87a4e] hover:text-white active:scale-[0.97]">
                              Quick {money(value)}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-[#8c7564]">Increment: {money(increment)}. Race bids recalculated server-side.</p>
                      </div>
                    )}

                    {!user && isLive && lot.status === 'ACTIVE' && (
                      <Link to="/auth/login" className="mt-3 block rounded-xl bg-[#c4956a] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(196,149,106,0.3)] transition-all hover:bg-[#a87a4e] hover:shadow-lg active:scale-[0.97]">Sign in to bid</Link>
                    )}

                    {isOwner && (
                      <div className="mt-3 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-3 text-xs leading-5 text-[#6c5b4f]">
                        Seller cockpit — buyers see this lot live, owners cannot bid.
                      </div>
                    )}

                    {myWin && (
                      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">You won</p>
                        <p className="mt-1 text-xl font-black text-[#221b16]">{money(myWin.finalPriceBdt)}</p>
                        <p className="mt-1 text-xs text-emerald-700">Payment: {myWin.paymentStatus || 'PENDING'} · Deadline: {dateLabel(myWin.paymentDeadline)}</p>
                        {myWin.paymentStatus !== 'PAID' && (
                          <button onClick={() => payWinner.mutate(myWin.id)} className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-emerald-700 active:scale-[0.97]">Pay now</button>
                        )}
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c4956a]">Bids</h3>
                        {topBid && <span className="text-[10px] text-[#8c7564]">Leader: {topBid.bidder?.displayName || 'Bidder'}</span>}
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {bids.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#e4d6c8] px-3 py-2.5 text-xs text-[#8c7564]">No bids yet.</p>
                        ) : bids.slice(0, 5).map((bid, index) => (
                          <div key={bid.id} className={`flex items-center justify-between rounded-xl border px-3 py-2 transition hover:shadow-sm ${index === 0 ? 'border-[#c4956a]/30 bg-white' : 'border-[#e4d6c8] bg-white'}`}>
                            <div>
                              <p className="text-xs font-bold text-[#221b16]">{bid.bidder?.displayName || 'Bidder'} {index === 0 ? <span className="text-[#c4956a]">· leading</span> : ''}</p>
                              <p className="text-[10px] text-[#8c7564]">{dateLabel(bid.createdAt)}</p>
                            </div>
                            <p className="text-sm font-black text-[#c4956a]">{money(bid.amountBdt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-[#e4d6c8] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c4956a]">Details</p>
            <div className="mt-3 space-y-2">
              <InfoRow label="Seller" value={auction.vendor?.displayName || 'Verified seller'} />
              <InfoRow label="Trust" value={`${trust}/100`} />
              <InfoRow label="Opening" value={dateLabel(auction.startTime)} />
              <InfoRow label="Closing" value={dateLabel(auction.endTime)} />
              <InfoRow label="Realtime" value={realtimeState} />
            </div>
          </div>

          <div className="rounded-xl border border-[#e4d6c8] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c4956a]">Leaderboard</p>
            <div className="mt-3 space-y-1.5">
              {topLots.length === 0 ? <p className="text-xs text-[#8c7564]">No lots yet.</p> : topLots.map((lot, index) => (
                <div key={lot.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition hover:shadow-sm ${index === 0 ? 'border-[#c4956a]/30 bg-[#c4956a]/5' : 'border-[#e4d6c8] bg-[#f9f5f0]'}`}>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#221b16]">{index + 1}. {lot.title}</p>
                    <p className="text-[10px] text-[#8c7564]">{lot.status === 'ACTIVE' ? 'Live' : lot.status}</p>
                  </div>
                  <p className="text-xs font-black text-[#c4956a]">{money(visibleCurrent(lot))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e4d6c8] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c4956a]">Integrity Rules</p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-[#6c5b4f]">
              <p className="flex items-start gap-2"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#c4956a]" />Server locks each lot while a bid is validated, so stale race bids are rejected.</p>
              <p className="flex items-start gap-2"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#c4956a]" />Last-minute bids can extend the auction window to reduce sniping.</p>
              <p className="flex items-start gap-2"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#c4956a]" />Rapid price spikes and suspicious bidding bursts are recorded for admin review.</p>
            </div>
          </div>
        </aside>
      </main>

      {lightboxLot && (() => {
        const lot = lots.find(item => item.id === lightboxLot.lotId)
        const lotImages = (lot?.images || []).map(image => ({ url: image.imageUrl }))
        return lotImages.length > 0 ? <ImageLightbox images={lotImages} initialIndex={lightboxLot.index} onClose={() => setLightboxLot(null)} /> : null
      })()}

      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[#e4d6c8] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#c4956a]">Required before bidding</p>
            <h3 className="mt-2 font-[Fraunces] text-3xl text-[#221b16]">Auction Rules</h3>
            <p className="mt-3 text-sm leading-7 text-[#6c5b4f]">Accept the rules to participate. Bids are binding, lower stale bids are rejected, shill bidding is monitored, and unpaid wins may restrict future bidding.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => acceptRules.mutate()} disabled={acceptRules.isPending} className="rounded-2xl bg-[#c4956a] px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-[#a87a4e] hover:shadow-md active:scale-[0.97] disabled:opacity-60">Accept rules</button>
              <button onClick={() => setRulesOpen(false)} className="rounded-2xl border border-[#e4d6c8] px-5 py-2.5 text-sm font-bold text-[#221b16]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-2.5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8c7564]">{label}</p><p className="mt-0.5 font-[Fraunces] text-lg text-[#221b16]">{value}</p></div>
}

function PriceTile({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-2.5 ${highlight ? 'border-[#c4956a]/40 bg-[#c4956a]/5' : 'border-[#e4d6c8] bg-[#f9f5f0]'}`}><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8c7564]">{label}</p><p className={`mt-0.5 text-lg font-black ${highlight ? 'text-[#c4956a]' : 'text-[#221b16]'}`}>{value}</p></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-b border-[#e4d6c8] pb-2 last:border-b-0 last:pb-0"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8c7564]">{label}</span><span className="text-right text-xs font-bold text-[#221b16]">{value || '—'}</span></div>
}
