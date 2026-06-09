import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'

type Product = {
  id: number
  name: string
  priceBdt: number
  images?: { imageUrl?: string }[]
  vendor?: { id: number }
}

type Review = {
  rating: number
}

function StarRating({ average, count }: { average: number; count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex gap-[1px] text-sm tracking-wider">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= Math.round(average) ? 'text-[#c4956a]' : 'text-[#e4d6c8]'}>★</span>
        ))}
      </span>
      <span className="text-[11px] text-[#8c7564]">({count})</span>
    </span>
  )
}

export default function HeroSection() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['hero-products'],
    queryFn: () =>
      apiClient.get('/api/products', { params: { size: 4 } }).then(r => {
        const list = r.data?.content ?? r.data ?? []
        return Array.isArray(list) ? list : []
      }),
    staleTime: 120_000,
  })

  const latest = products?.find(p => p.images?.some(i => i.imageUrl))

  const { data: vendorProfile } = useQuery<{ displayName: string } | null>({
    queryKey: ['vendor-profile', latest?.vendor?.id],
    queryFn: () =>
      latest?.vendor?.id
        ? apiClient.get(`/api/users/${latest.vendor.id}/profile`).then(r => r.data)
        : Promise.resolve(null),
    enabled: !!latest?.vendor?.id,
    staleTime: 120_000,
  })

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['hero-product-reviews', latest?.id],
    queryFn: () =>
      latest?.id
        ? apiClient.get(`/api/products/${latest.id}/reviews`).then(r => (Array.isArray(r.data) ? r.data : []))
        : Promise.resolve([]),
    enabled: !!latest?.id,
    staleTime: 60_000,
  })

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const productImage = latest?.images?.find(i => i.imageUrl)?.imageUrl

  return (
    <section className="relative bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-14 md:flex-row md:gap-16 md:py-20 lg:px-8 lg:py-24">
        {/* Left */}
        <div className="w-full max-w-lg md:w-1/2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7564]">
            AtomDrops {new Date().getFullYear()}
          </p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7564]">
            New Arrival
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="mt-2 text-[2.8rem] font-light leading-[1.1] tracking-tight text-[#221b16] sm:text-[3.2rem] lg:text-[3.8rem]"
          >
            New Collection
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#6c5b4f]">
            Discover handpicked items from our verified vendors — quality pre-owned tech, exclusive finds, and more.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c4956a] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#a87a4e] hover:shadow-lg active:scale-[0.97]"
          >
            Shop now
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e4d6c8]">01</p>
        </div>

        {/* Right */}
        <div className="flex w-full items-center justify-center md:w-1/2">
          <div className="flex flex-col items-center">
            <div className="flex h-[300px] w-[300px] items-center justify-center rounded-full bg-[#f9f5f0] sm:h-[360px] sm:w-[360px] lg:h-[440px] lg:w-[440px]">
              {productImage ? (
                <img
                  src={productImage}
                  alt={latest!.name}
                  className="h-3/5 w-3/5 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#8c7564]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="text-xs">New arrivals coming soon</span>
                </div>
              )}
            </div>

            {latest && (
              <div className="mt-6 flex items-center gap-5">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#221b16]">{latest.name}</p>
                  <p className="text-sm text-[#8c7564]">৳{latest.priceBdt.toLocaleString('en-BD')}</p>
                  {vendorProfile && (
                    <p className="mt-0.5 text-xs text-[#8c7564]">by {vendorProfile.displayName}</p>
                  )}
                  <StarRating average={avgRating} count={reviews?.length ?? 0} />
                </div>
                <Link
                  to={`/products/${latest.id}`}
                  className="rounded-full border border-[#e4d6c8] px-4 py-1.5 text-xs font-semibold text-[#6c5b4f] transition-colors hover:bg-[#f9f5f0] hover:text-[#221b16]"
                >
                  View
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
