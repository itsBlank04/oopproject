import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import AuctionCountdown from './AuctionCountdown'

type AuctionLot = {
  id: number
  currentBidBdt?: number
  startingPriceBdt?: number
  images?: { imageUrl: string }[]
}

type Auction = {
  id: number
  title: string
  endTime?: string
  lots?: AuctionLot[]
  status?: string
}

function firstLot(auction: Auction) {
  return auction.lots ? [...auction.lots].sort((a, b) => {
    const aBid = Math.max(Number(a.currentBidBdt ?? 0), Number(a.startingPriceBdt ?? 0))
    const bBid = Math.max(Number(b.currentBidBdt ?? 0), Number(b.startingPriceBdt ?? 0))
    return bBid - aBid
  })[0] : undefined
}

function firstImage(auction: Auction) {
  const lot = firstLot(auction)
  return lot?.images?.[0]?.imageUrl
}

function currentPrice(auction: Auction) {
  const lot = firstLot(auction)
  if (!lot) return 0
  return Math.max(Number(lot.currentBidBdt ?? 0), Number(lot.startingPriceBdt ?? 0))
}

export default function AuctionHighlight() {
  const { data: auctions = [] } = useQuery<Auction[]>({
    queryKey: ['auction-highlight'],
    queryFn: () =>
      apiClient.get('/api/auctions', { params: { status: 'ACTIVE' } }).then(r =>
        Array.isArray(r.data) ? r.data : r.data.content || []
      ),
    staleTime: 30_000,
  })

  const top = auctions.slice(0, 3)

  if (top.length === 0) return null

  return (
    <section className="bg-white px-6 py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7564]">Bid now</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#221b16]">Live Auctions</h2>
          </div>
          <Link
            to="/auctions"
            className="flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16]"
          >
            View all
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map(auction => {
            const img = firstImage(auction)
            const price = currentPrice(auction)

            return (
              <Link
                key={auction.id}
                to={`/auctions/${auction.id}`}
                className="group rounded-2xl border border-[#f9f5f0] bg-white p-5 transition-all duration-200 hover:border-[#e4d6c8] hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[#f9f5f0]">
                  {img ? (
                    <img src={img} alt={auction.title} className="h-full w-full object-contain mix-blend-multiply" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10 text-[#e4d6c8]">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#221b16]">{auction.title}</h3>
                    <p className="mt-0.5 text-sm font-medium text-[#c4956a]">
                      ৳{price.toLocaleString('en-BD')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#eaf5e6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4a7c38]">
                    Live
                  </span>
                </div>

                {auction.endTime && (
                  <div className="mt-3 border-t border-[#f9f5f0] pt-3 text-xs text-[#8c7564]">
                    <AuctionCountdown endTime={auction.endTime} />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
