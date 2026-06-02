import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import AuctionCountdown from '../../components/AuctionCountdown'

type AuctionStatusFilter = 'ACTIVE' | 'PREPARING' | 'CLOSED' | 'ALL'

type AuctionImage = { imageUrl: string }

type AuctionLot = {
  id: number
  title: string
  currentBidBdt?: number
  startingPriceBdt?: number
  minBidIncrementBdt?: number
  status: string
  conditionNote?: string
  images?: AuctionImage[]
}

type Auction = {
  id: number
  title: string
  type: string
  status: string
  startTime?: string
  endTime?: string
  vendor?: { displayName?: string; redFlagCount?: number } | null
  lots?: AuctionLot[]
}

const tabs: { id: AuctionStatusFilter; label: string; hint: string }[] = [
  { id: 'ACTIVE', label: 'Live Floor', hint: 'Bidding now' },
  { id: 'PREPARING', label: 'Upcoming', hint: 'Watch before open' },
  { id: 'CLOSED', label: 'Results', hint: 'Recently ended' },
  { id: 'ALL', label: 'All Lots', hint: 'Full board' },
]

function money(value: unknown) {
  const amount = Number(value ?? 0)
  return `BDT ${amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
}

function currentPrice(lot?: AuctionLot) {
  if (!lot) return 0
  return Math.max(Number(lot.currentBidBdt ?? 0), Number(lot.startingPriceBdt ?? 0))
}

function sellerTrust(vendor?: Auction['vendor']) {
  const redFlags = Number(vendor?.redFlagCount ?? 0)
  return Math.max(62, 98 - redFlags * 12)
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'border-emerald-300 bg-emerald-50 text-emerald-700'
  if (status === 'PREPARING') return 'border-amber-300 bg-amber-50 text-amber-700'
  if (status === 'CLOSED') return 'border-slate-300 bg-slate-50 text-slate-600'
  return 'border-stone-300 bg-stone-50 text-stone-600'
}

function auctionHeat(auction: Auction) {
  const lots = auction.lots ?? []
  const bidLikeLots = lots.filter(lot => Number(lot.currentBidBdt ?? 0) > Number(lot.startingPriceBdt ?? 0)).length
  const statusBoost = auction.status === 'ACTIVE' ? 28 : auction.status === 'PREPARING' ? 12 : 0
  return Math.min(100, 18 + statusBoost + lots.length * 4 + bidLikeLots * 18)
}

function topLot(auction: Auction) {
  return [...(auction.lots ?? [])].sort((a, b) => currentPrice(b) - currentPrice(a))[0]
}

function firstImages(auction: Auction) {
  return (auction.lots ?? [])
    .flatMap(lot => (lot.images ?? []).map(image => ({ ...image, lotTitle: lot.title })))
    .slice(0, 4)
}

export default function AuctionsPage() {
  const [tab, setTab] = useState<AuctionStatusFilter>('ACTIVE')

  const { data: auctions = [], isLoading, isFetching } = useQuery<Auction[]>({
    queryKey: ['auctions', tab],
    queryFn: () => apiClient.get('/api/auctions', { params: tab === 'ALL' ? undefined : { status: tab } })
      .then(r => Array.isArray(r.data) ? r.data : r.data.content || []),
    staleTime: 2_000,
    refetchInterval: tab === 'ACTIVE' || tab === 'PREPARING' || tab === 'ALL' ? 1500 : 10_000,
    placeholderData: previous => previous ?? [],
  })

  const visibleAuctions = useMemo(() => {
    if (tab === 'ALL') return auctions
    return auctions.filter(auction => auction.status === tab)
  }, [auctions, tab])

  const stats = useMemo(() => {
    const lots = visibleAuctions.flatMap(auction => auction.lots ?? [])
    const topCurrent = lots.reduce((max, lot) => Math.max(max, currentPrice(lot)), 0)
    return {
      auctions: visibleAuctions.length,
      lots: lots.length,
      live: visibleAuctions.filter(auction => auction.status === 'ACTIVE').length,
      topCurrent,
    }
  }, [visibleAuctions])

  return (
    <div className="min-h-screen overflow-hidden bg-[#110f0b] text-[#fffaf0]">
      <section className="relative border-b border-white/10 px-6 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(245,158,11,0.22),transparent_28%),radial-gradient(circle_at_82%_6%,rgba(16,185,129,0.18),transparent_24%),linear-gradient(135deg,#110f0b_0%,#211a12_48%,#0f1612_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-emerald-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                Real-time Auction Board
              </div>
              <h1 className="mt-5 font-[Fraunces] text-5xl leading-tight text-[#fff8e8] md:text-7xl">AtomDrops Live Auction Floor</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cbbda8] md:text-base">
                Watch upcoming drops, track live price movement, and compete with locked bidding rules that sync straight to the database.
              </p>
            </div>
            <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Auctions" value={stats.auctions} />
              <Metric label="Lots" value={stats.lots} />
              <Metric label="Live" value={stats.live} />
              <Metric label="Top bid" value={money(stats.topCurrent)} compact />
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {tabs.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`group rounded-2xl border p-4 text-left transition-all ${tab === item.id ? 'border-[#f2b84b] bg-[#f2b84b] text-[#1b1308] shadow-[0_20px_60px_rgba(242,184,75,0.25)]' : 'border-white/10 bg-white/[0.06] text-[#fff8e8] hover:border-white/25 hover:bg-white/[0.1]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black uppercase tracking-[0.18em]">{item.label}</span>
                  {item.id === 'ACTIVE' && <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />}
                </div>
                <p className={`mt-1 text-xs ${tab === item.id ? 'text-[#4e3510]' : 'text-[#b9ac99]'}`}>{item.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2b84b]">{tab === 'ALL' ? 'Full board' : tab.toLowerCase()}</p>
            <h2 className="mt-1 font-[Fraunces] text-3xl text-[#fff8e8]">{visibleAuctions.length} auction{visibleAuctions.length === 1 ? '' : 's'} available</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-[#cbbda8]">
            {isFetching ? 'Syncing database...' : 'Synced'}
          </div>
        </div>

        {isLoading && visibleAuctions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-12 text-center text-[#cbbda8]">Loading auction floor...</div>
        ) : visibleAuctions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-12 text-center">
            <p className="font-[Fraunces] text-2xl text-[#fff8e8]">No {tab.toLowerCase()} auctions right now.</p>
            <p className="mt-2 text-sm text-[#b9ac99]">Check another board or come back when sellers publish new lots.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleAuctions.map(auction => {
              const heat = auctionHeat(auction)
              const featuredLot = topLot(auction)
              const images = firstImages(auction)
              const trust = sellerTrust(auction.vendor)
              return (
                <Link key={auction.id} to={`/auctions/${auction.id}`}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a160f] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-1 hover:border-[#f2b84b]/60 hover:shadow-[0_28px_90px_rgba(242,184,75,0.15)]">
                  <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-full bg-[#f2b84b]/10 blur-2xl transition group-hover:bg-[#f2b84b]/20" />
                  <div className="relative grid gap-5 md:grid-cols-[180px_1fr]">
                    <div className="space-y-3">
                      <div className="grid h-44 grid-cols-2 gap-2 overflow-hidden rounded-3xl bg-black/30 p-2">
                        {images.length > 0 ? images.map((image, index) => (
                          <img key={`${image.imageUrl}-${index}`} src={image.imageUrl} alt={image.lotTitle} loading="lazy" className="h-full w-full rounded-2xl object-cover" />
                        )) : (
                          <div className="col-span-2 flex h-full items-center justify-center rounded-2xl border border-dashed border-white/15 text-xs text-[#8d806d]">No lot photos yet</div>
                        )}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-[#9f927f]"><span>Heat</span><span>{heat}%</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-[#f2b84b] to-rose-400 transition-all" style={{ width: `${heat}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${statusTone(auction.status)}`}>{auction.status}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#cbbda8]">{auction.type}</span>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold text-emerald-200">Trust {trust}/100</span>
                      </div>
                      <h3 className="mt-4 truncate font-[Fraunces] text-3xl text-[#fff8e8] group-hover:text-[#f2b84b]">{auction.title}</h3>
                      <p className="mt-1 text-sm text-[#a99a85]">Seller: {auction.vendor?.displayName || 'Verified seller'}</p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <BoardStat label="Lots" value={auction.lots?.length || 0} />
                        <BoardStat label="Current leader" value={featuredLot ? money(currentPrice(featuredLot)) : 'No lots'} />
                        <BoardStat label="Increment" value={featuredLot ? money(featuredLot.minBidIncrementBdt ?? 0) : '—'} />
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9f927f]">Featured lot</p>
                            <p className="mt-1 truncate font-semibold text-[#fff8e8]">{featuredLot?.title || 'Waiting for lots'}</p>
                            {featuredLot?.conditionNote && <p className="mt-1 text-xs text-[#a99a85]">Condition: {featuredLot.conditionNote}</p>}
                          </div>
                          <div className="text-left sm:text-right">
                            {auction.status === 'PREPARING' && auction.startTime && <AuctionCountdown endTime={auction.startTime} compact />}
                            {auction.status === 'ACTIVE' && auction.endTime && <AuctionCountdown endTime={auction.endTime} compact />}
                            {auction.status === 'CLOSED' && <span className="font-semibold text-rose-300">Closed</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Metric({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a99a85]">{label}</p>
      <p className={`mt-1 font-[Fraunces] text-[#fff8e8] ${compact ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    </div>
  )
}

function BoardStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9f927f]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#fff8e8]">{value}</p>
    </div>
  )
}
