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
  if (status === 'ACTIVE') return 'border-emerald-300/40 bg-emerald-300/12 text-emerald-200'
  if (status === 'PREPARING') return 'border-amber-300/40 bg-amber-300/12 text-amber-200'
  if (status === 'CLOSED') return 'border-slate-300/25 bg-slate-300/10 text-slate-300'
  return 'border-stone-300/25 bg-stone-300/10 text-stone-300'
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

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#110f0b] text-[#cbbda8]">Loading auction room...</div>
  if (!auction) return <div className="flex min-h-screen items-center justify-center bg-[#110f0b] text-[#cbbda8]">Auction not found</div>

  return (
    <div className="min-h-screen bg-[#110f0b] text-[#fff8e8]">
      <header className="relative overflow-hidden border-b border-white/10 px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(242,184,75,0.22),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(16,185,129,0.18),transparent_26%),linear-gradient(135deg,#110f0b_0%,#24180d_48%,#0d1713_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <Link to="/auctions" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#cbbda8] transition hover:border-[#f2b84b]/60 hover:text-[#f2b84b]">Back to auctions</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${statusTone(auction.status)}`}>{auction.status}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#cbbda8]">{auction.type}</span>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold text-emerald-200">Seller trust {trust}/100</span>
              </div>
              <h1 className="mt-5 font-[Fraunces] text-5xl leading-tight md:text-7xl">{auction.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#cbbda8]">
                {auction.vendor?.displayName || 'Verified seller'} is running {lots.length} lot{lots.length === 1 ? '' : 's'} with locked bid increments, live synchronization, and automatic winner capture.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2b84b]">Clock</p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${realtimeState === 'connected' ? 'bg-emerald-300/15 text-emerald-200' : 'bg-amber-300/15 text-amber-200'}`}>{realtimeState}</span>
              </div>
              <div className="mt-4 text-2xl font-black tabular-nums">
                {isPreparing && auction.startTime && <AuctionCountdown endTime={auction.startTime} />}
                {isLive && auction.endTime && <AuctionCountdown endTime={auction.endTime} />}
                {auction.status === 'CLOSED' && <span className="text-rose-300">Auction closed</span>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <MiniStat label="Lots" value={lots.length} />
                <MiniStat label="Open" value={activeLotCount} />
                <MiniStat label="Bids" value={totalBidCount} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          {lots.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 text-center text-[#cbbda8]">No lots have been added yet.</div>
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
              <article key={lot.id} className={`overflow-hidden rounded-[2rem] border bg-[#1a160f] transition-all ${pulse ? 'border-[#f2b84b] shadow-[0_0_0_1px_rgba(242,184,75,0.7),0_24px_80px_rgba(242,184,75,0.18)]' : 'border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.24)]'}`}>
                <div className="grid gap-0 xl:grid-cols-[420px_1fr]">
                  <div className="border-b border-white/10 bg-black/25 p-4 xl:border-b-0 xl:border-r">
                    <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-[#0d0b08]">
                      {images.length > 0 ? (
                        <button type="button" onClick={() => setLightboxLot({ lotId: lot.id, index: imageIndex })} className="h-full w-full">
                          <img src={images[imageIndex]?.imageUrl} alt={lot.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                        </button>
                      ) : (
                        <div className="flex h-full items-center justify-center border border-dashed border-white/10 text-sm text-[#8d806d]">No photo yet</div>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                        {images.map((image, index) => (
                          <button key={`${image.imageUrl}-${index}`} onClick={() => setSelectedImg(previous => ({ ...previous, [lot.id]: index }))}
                            className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition ${imageIndex === index ? 'border-[#f2b84b]' : 'border-white/10 opacity-70 hover:opacity-100'}`}>
                            <img src={image.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    {isOwner && (
                      <button onClick={() => setShowUpload(showUpload === lot.id ? null : lot.id)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-[#fff8e8] transition hover:border-[#f2b84b]/50">
                        {showUpload === lot.id ? 'Close uploader' : 'Add lot photos'}
                      </button>
                    )}
                    {showUpload === lot.id && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <MediaUploader folder={`auctions/${auction.id}/lots/${lot.id}`} maxFiles={8} maxSizeMB={10} allowVideo={false} compact onUpload={urls => uploadImagesMutation.mutate({ lotId: lot.id, urls })} />
                      </div>
                    )}
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${statusTone(lot.status)}`}>{lot.status}</span>
                          {isHighest && <span className="rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#0d1713]">You are highest</span>}
                          {watched && <span className="rounded-full bg-[#f2b84b] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#1b1308]">Watching</span>}
                        </div>
                        <h2 className="mt-3 font-[Fraunces] text-3xl text-[#fff8e8]">{lot.title}</h2>
                        <p className="mt-2 text-sm text-[#b9ac99]">{lot.conditionNote || 'Condition not specified'}{lot.category?.name ? ` · ${lot.category.name}` : ''}</p>
                      </div>
                      {user && hasRole('CUSTOMER') && (
                        <button onClick={() => watchMutation.mutate({ lotId: lot.id, watched })}
                          className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${watched ? 'bg-[#f2b84b] text-[#1b1308]' : 'border border-white/10 bg-white/[0.06] text-[#fff8e8] hover:border-[#f2b84b]/50'}`}>
                          {watched ? 'Unwatch' : 'Watch lot'}
                        </button>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                      <PriceTile label="Current" value={money(visibleCurrent(lot))} highlight />
                      <PriceTile label="Next bid" value={money(nextBid)} />
                      <PriceTile label="Bids" value={bids.length} />
                      <PriceTile label="Bidders" value={uniqueBidderCount(bids)} />
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9f927f]">Auction heat</p>
                        <p className="text-xs font-bold text-[#f2b84b]">{heat}%</p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-[#f2b84b] to-rose-400 transition-all" style={{ width: `${heat}%` }} />
                      </div>
                    </div>

                    {lot.description && <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-[#cbbda8]">{lot.description}</p>}

                    {user && isLive && lot.status === 'ACTIVE' && !isOwner && (
                      <div className="mt-5 rounded-3xl border border-[#f2b84b]/25 bg-[#f2b84b]/8 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <input type="number" min={nextBid} value={bidDrafts[lot.id] ?? ''} placeholder={`Minimum ${money(nextBid)}`}
                            onFocus={() => setSelectedLot(lot.id)}
                            onChange={event => { setSelectedLot(lot.id); setBidDrafts(previous => ({ ...previous, [lot.id]: event.target.value })) }}
                            className="rounded-2xl border border-white/10 bg-[#0f0d09] px-4 py-3 text-sm font-bold text-[#fff8e8] outline-none transition placeholder:text-[#8d806d] focus:border-[#f2b84b]" />
                          <button onClick={() => submitBid(lot)} disabled={bidMutation.isPending && selectedLot === lot.id}
                            className="rounded-2xl bg-[#f2b84b] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#1b1308] transition hover:bg-[#ffd36d] disabled:cursor-not-allowed disabled:opacity-60">
                            {bidMutation.isPending && selectedLot === lot.id ? 'Locking...' : 'Place bid'}
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {[nextBid, nextBid + increment, nextBid + increment * 2].map(value => (
                            <button key={value} onClick={() => submitBid(lot, value)}
                              className="rounded-2xl border border-[#f2b84b]/30 bg-[#f2b84b]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#f7ce76] transition hover:bg-[#f2b84b] hover:text-[#1b1308]">
                              Quick {money(value)}
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-[#b9ac99]">Increment rule: every bid must be at least {money(increment)} above the current price. Race bids are recalculated on the server.</p>
                      </div>
                    )}

                    {!user && isLive && lot.status === 'ACTIVE' && (
                      <Link to="/auth/login" className="mt-5 block rounded-3xl bg-[#f2b84b] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#1b1308] transition hover:bg-[#ffd36d]">Sign in to place bids</Link>
                    )}

                    {isOwner && (
                      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm text-[#cbbda8]">
                        Seller cockpit: buyers see this lot live, but owners cannot bid on their own auction.
                      </div>
                    )}

                    {myWin && (
                      <div className="mt-5 rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">You won this lot</p>
                        <p className="mt-2 text-2xl font-black text-[#fff8e8]">{money(myWin.finalPriceBdt)}</p>
                        <p className="mt-1 text-sm text-emerald-100">Payment status: {myWin.paymentStatus || 'PENDING'} · Deadline: {dateLabel(myWin.paymentDeadline)}</p>
                        {myWin.paymentStatus !== 'PAID' && (
                          <button onClick={() => payWinner.mutate(myWin.id)} className="mt-3 rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0d1713]">Pay now</button>
                        )}
                      </div>
                    )}

                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#f2b84b]">Bid tape</h3>
                        {topBid && <span className="text-xs text-[#b9ac99]">Leader: {topBid.bidder?.displayName || 'Bidder'}</span>}
                      </div>
                      <div className="mt-3 space-y-2">
                        {bids.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-[#8d806d]">No bids yet. The first valid bid starts the competition.</p>
                        ) : bids.slice(0, 5).map((bid, index) => (
                          <div key={bid.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                            <div>
                              <p className="text-sm font-bold text-[#fff8e8]">{bid.bidder?.displayName || 'Bidder'} {index === 0 ? '· leading' : ''}</p>
                              <p className="text-xs text-[#8d806d]">{dateLabel(bid.createdAt)}</p>
                            </div>
                            <p className="font-black text-[#f2b84b]">{money(bid.amountBdt)}</p>
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

        <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-[2rem] border border-white/10 bg-[#1a160f] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2b84b]">Control Panel</p>
            <div className="mt-4 space-y-3">
              <InfoRow label="Seller" value={auction.vendor?.displayName || 'Verified seller'} />
              <InfoRow label="Trust" value={`${trust}/100`} />
              <InfoRow label="Opening" value={dateLabel(auction.startTime)} />
              <InfoRow label="Closing" value={dateLabel(auction.endTime)} />
              <InfoRow label="Realtime" value={realtimeState} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#1a160f] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2b84b]">Leaderboard</p>
            <div className="mt-4 space-y-3">
              {topLots.length === 0 ? <p className="text-sm text-[#8d806d]">No lots yet.</p> : topLots.map((lot, index) => (
                <div key={lot.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{index + 1}. {lot.title}</p>
                    <p className="text-xs text-[#8d806d]">{lot.status}</p>
                  </div>
                  <p className="text-sm font-black text-[#f2b84b]">{money(visibleCurrent(lot))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#1a160f] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2b84b]">Integrity Rules</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#cbbda8]">
              <p>Server locks each lot while a bid is validated, so stale race bids are rejected.</p>
              <p>Last-minute bids can extend the auction window to reduce sniping.</p>
              <p>Rapid price spikes and suspicious bidding bursts are recorded for admin review.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#1a160f] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f2b84b]">Required before bidding</p>
            <h3 className="mt-2 font-[Fraunces] text-3xl text-[#fff8e8]">Auction Rules</h3>
            <p className="mt-3 text-sm leading-7 text-[#cbbda8]">Accept the rules to participate. Bids are binding, lower stale bids are rejected, shill bidding is monitored, and unpaid wins may restrict future bidding.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => acceptRules.mutate()} disabled={acceptRules.isPending} className="rounded-2xl bg-[#f2b84b] px-5 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-[#1b1308] disabled:opacity-60">Accept rules</button>
              <button onClick={() => setRulesOpen(false)} className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-bold text-[#fff8e8]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9f927f]">{label}</p><p className="mt-1 font-[Fraunces] text-2xl">{value}</p></div>
}

function PriceTile({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return <div className={`rounded-2xl border p-3 ${highlight ? 'border-[#f2b84b]/40 bg-[#f2b84b]/10' : 'border-white/10 bg-white/[0.04]'}`}><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9f927f]">{label}</p><p className={`mt-1 truncate text-lg font-black ${highlight ? 'text-[#f2b84b]' : 'text-[#fff8e8]'}`}>{value}</p></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0"><span className="text-xs font-black uppercase tracking-[0.18em] text-[#8d806d]">{label}</span><span className="text-right text-sm font-bold text-[#fff8e8]">{value}</span></div>
}
