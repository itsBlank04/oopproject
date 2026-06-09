import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import ImageLightbox from '../../components/ImageLightbox'

type Category = { id: number; name: string; slug: string; parentId: number | null }
type Review = { id: number; rating: number }
type Condition = { id: number; label: string }
type UsedListing = {
  id: number
  title: string
  description: string
  priceBdt: number
  askingPriceBdt?: number
  status: string
  location?: string
  condition: { label: string } | null
  conditionLevel?: { label: string } | null
  category: { id: number; name: string } | null
  seller: { id?: number; displayName: string; avatarUrl?: string } | null
  images: { imageUrl: string }[]
  createdAt: string
}

const AVATAR_PALETTE = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-error-container text-on-error-container',
]

const FALLBACK_CATEGORIES: Category[] = [
  { id: 0, name: 'Tech', slug: 'tech', parentId: null },
  { id: 0, name: 'Furniture', slug: 'furniture', parentId: null },
  { id: 0, name: 'Fashion', slug: 'fashion', parentId: null },
  { id: 0, name: 'Outdoors', slug: 'outdoors', parentId: null },
  { id: 0, name: 'Collectibles', slug: 'collectibles', parentId: null },
]

function getAvatarStyle(name: string): string {
  if (!name) return AVATAR_PALETTE[0]
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatBdt(value: number | undefined | null): string {
  if (value == null) return '—'
  return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function UsedListingCard({
  listing,
  onImageClick,
}: {
  listing: UsedListing
  onImageClick: (imgs: { url: string }[], idx: number) => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [imgHovered, setImgHovered] = useState(false)
  const isOwnListing = !!user && !!listing.seller?.id && listing.seller.id === user.id

  const sellerId = listing.seller?.id
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () =>
      apiClient.get(`/api/users/${sellerId}/reviews`).then(r => (Array.isArray(r.data) ? r.data : [])),
    enabled: !!sellerId,
    staleTime: 300_000,
  })
  const reviewCount = reviews.length
  const avgRating = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0

  const conditionLabel = listing.conditionLevel?.label || listing.condition?.label || 'Used'
  const isLikeNew = /like new/i.test(conditionLabel)
  const price = listing.askingPriceBdt ?? listing.priceBdt
  const images = (listing.images || []).filter(i => i.imageUrl)
  const sellerName = listing.seller?.displayName || 'Seller'
  const avatarStyle = getAvatarStyle(sellerName)
  const initials = getInitials(sellerName)

  const goDetail = () => navigate(`/used-listings/${listing.id}`)
  const stopNav = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn()
  }
  const toggleFavorite = stopNav(() => setFavorited(f => !f))
  const openMessage = stopNav(() => navigate(`/used-listings/${listing.id}?action=chat`))
  const openOffer = stopNav(() => navigate(`/used-listings/${listing.id}#offer`))
  const openLightbox = stopNav(() => onImageClick(images.map(i => ({ url: i.imageUrl })), 0))

  return (
    <div
      onClick={goDetail}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-base card-shadow card-shadow-hover cursor-pointer"
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-surface-base/90 px-3 py-1 backdrop-blur-md">
        {isLikeNew && (
          <span className="material-symbols-outlined text-[14px] text-action-teal icon-fill">verified</span>
        )}
        <span className="font-label-sm text-label-sm text-primary">{conditionLabel}</span>
      </div>

      {!isOwnListing && (
        <button
          type="button"
          onClick={toggleFavorite}
          className="absolute top-3 right-3 z-10 rounded-full bg-surface-base/90 p-2 text-outline backdrop-blur-md transition-colors hover:text-secondary"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${favorited ? 'icon-fill text-secondary' : ''}`}
          >
            favorite
          </span>
        </button>
      )}

      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high"
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
      >
        {images.length > 0 ? (
          <img
            src={images[0].imageUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-outline">
            <span className="material-symbols-outlined text-[48px]">image</span>
          </div>
        )}
        {imgHovered && images.length > 1 && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-primary/30 to-transparent pb-3 pt-10"
          >
            <span className="rounded-full bg-surface-base/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
              View {images.length} photos
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-grow flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-headline-sm text-headline-sm text-primary">{listing.title}</h3>
          <span className="whitespace-nowrap font-headline-sm text-headline-sm text-primary">
            {formatBdt(price)}
          </span>
        </div>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
          {listing.description || 'No description provided.'}
        </p>
        <div className="mt-auto">
          <div className="mb-4 flex items-center gap-2">
            {listing.seller?.avatarUrl ? (
              <img
                src={listing.seller.avatarUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${avatarStyle}`}
              >
                {initials}
              </div>
            )}
            <span className="font-label-sm text-label-sm text-on-surface-variant">{sellerName}</span>
            {listing.location && (
              <span className="ml-2 flex items-center text-[11px] text-[#8c7564]">
                <span className="material-symbols-outlined mr-0.5 text-[11px]">location_on</span>
                {listing.location}
              </span>
            )}
            {reviewCount > 0 && (
              <span className="ml-auto flex items-center text-[11px] font-semibold text-auction-gold">
                <span className="material-symbols-outlined mr-0.5 text-[12px] icon-fill">star</span>
                {avgRating.toFixed(1)}
              </span>
            )}
          </div>
          {!isOwnListing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openMessage}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container py-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                Message
              </button>
              <button
                type="button"
                onClick={openOffer}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-action-teal/10 py-2.5 font-label-md text-label-md font-semibold text-action-teal transition-colors hover:bg-action-teal/20"
              >
                <span className="material-symbols-outlined text-[18px]">handshake</span>
                Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UsedListingsPage() {
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const submittedSearch = searchParams.get('q') ?? ''
  const rawCategory = searchParams.get('category')
  const isOtherCategory = rawCategory === 'other'
  const parsedCategory = rawCategory ? Number(rawCategory) : NaN
  const selectedCategory = !isOtherCategory && Number.isFinite(parsedCategory) && parsedCategory > 0 ? parsedCategory : null
  const rawMinPrice = searchParams.get('minPrice')
  const minPrice = rawMinPrice ? Number(rawMinPrice) : undefined
  const rawMaxPrice = searchParams.get('maxPrice')
  const maxPrice = rawMaxPrice ? Number(rawMaxPrice) : undefined
  const rawCondition = searchParams.get('condition')
  const parsedCondition = rawCondition ? Number(rawCondition) : NaN
  const selectedCondition = Number.isFinite(parsedCondition) && parsedCondition > 0 ? parsedCondition : null
  const rawMaxDistance = searchParams.get('maxDistance')
  const maxDistance = rawMaxDistance ? Number(rawMaxDistance) : undefined

  const [searchInput, setSearchInput] = useState(submittedSearch)
  const [priceMin, setPriceMin] = useState(minPrice?.toString() ?? '')
  const [priceMax, setPriceMax] = useState(maxPrice?.toString() ?? '')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
  })

  const topCategories = useMemo(() => {
    const top = categories.filter(c => c.parentId === null).slice(0, 30)
    return top.length > 0 ? top : FALLBACK_CATEGORIES
  }, [categories])

  const { data: conditions = [] } = useQuery<Condition[]>({
    queryKey: ['conditions'],
    queryFn: () => apiClient.get('/api/used-listings/conditions').then(r => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 300_000,
  })

  const { data: listings = [], isLoading } = useQuery<UsedListing[]>({
    queryKey: ['used-listings', submittedSearch, selectedCategory, minPrice, maxPrice, selectedCondition, isOtherCategory, maxDistance],
    queryFn: () =>
      apiClient
        .get('/api/used-listings', {
          params: {
            search: submittedSearch || undefined,
            category: selectedCategory ?? undefined,
            minPrice: minPrice ?? undefined,
            maxPrice: maxPrice ?? undefined,
            condition: selectedCondition ?? undefined,
          },
        })
        .then(r => {
          const data = Array.isArray(r.data) ? r.data : r.data.content || []
          return data.map((item: UsedListing) => ({
            ...item,
            askingPriceBdt: item.askingPriceBdt ?? item.priceBdt,
            conditionLevel: item.conditionLevel ?? item.condition,
          }))
        }),
    staleTime: 120_000,
    placeholderData: prev => prev,
  })

  const handleSellClick = () => {
    if (user) navigate('/used-listings/new')
    else openModal('signin')
  }

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams(prev => {
      for (const [key, value] of Object.entries(updates)) {
        if (value) prev.set(key, value)
        else prev.delete(key)
      }
      return prev
    }, { replace: true })
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (!val) updateParams({ category: undefined })
    else if (val === 'other') updateParams({ category: 'other' })
    else updateParams({ category: val })
  }

  const submitSearch = () => {
    updateParams({ q: searchInput.trim() || undefined })
  }

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch()
  }

  const applyPrice = () => {
    updateParams({
      minPrice: priceMin || undefined,
      maxPrice: priceMax || undefined,
    })
  }

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ condition: e.target.value || undefined })
  }

  const handleDistanceChange = (value: number | undefined) => {
    updateParams({ maxDistance: value ? String(value) : undefined })
  }

  const resetFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  const activeCategoryName = useMemo(
    () => isOtherCategory ? 'Other Items' : topCategories.find(c => c.id === selectedCategory)?.name,
    [topCategories, selectedCategory, isOtherCategory],
  )

  const activeConditionName = useMemo(
    () => conditions.find(c => c.id === selectedCondition)?.label,
    [conditions, selectedCondition],
  )

  const hasActiveFilters = !!(selectedCategory || isOtherCategory || minPrice || maxPrice || selectedCondition || maxDistance || submittedSearch)

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
              Buy & Sell Used Items
            </h1>
            <p className="mt-1 text-sm text-[#8c7564]">
              {listings.length} {listings.length === 1 ? 'item' : 'items'} found
            </p>
          </div>
          <button
            onClick={handleSellClick}
            className="flex items-center gap-2 rounded-xl bg-[#221b16] px-6 py-3 font-label-md text-label-md text-white transition-all hover:bg-[#3a3028] hover:shadow-lg active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Sell an Item
          </button>
        </div>

        <div className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-[#e4d6c8]/50 bg-white p-3 shadow-sm transition-colors focus-within:border-[#c4956a]">
          <span className="material-symbols-outlined ml-1 text-[#8c7564]">search</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search used items..."
            type="text"
            className="flex-1 border-none bg-transparent p-0 font-body-md text-body-md text-[#221b16] outline-none placeholder:text-[#8c7564] focus:ring-0"
          />
          <button
            onClick={submitSearch}
            className="rounded-xl bg-[#c4956a] px-6 py-2.5 font-label-md text-label-md text-white transition-all hover:bg-[#a87a4e] hover:shadow-md active:scale-[0.97]"
          >
            Search
          </button>
        </div>

        <button
          onClick={() => setShowMobileFilters(o => !o)}
          className="mb-4 flex items-center gap-2 rounded-lg border border-[#e4d6c8] bg-white px-4 py-2 text-sm font-semibold text-[#221b16] transition-colors hover:bg-[#f9f5f0] md:hidden"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
          {hasActiveFilters && (
            <span className="ml-1 flex h-2 w-2 rounded-full bg-[#c4956a]" />
          )}
        </button>

        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <aside
            className={`w-full shrink-0 overflow-y-auto md:w-[260px] md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] ${
              showMobileFilters ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="rounded-2xl border border-[#e4d6c8]/40 bg-white p-5">
              <div className="mb-5">
                <h3 className="mb-3 font-headline-sm text-headline-sm text-[#221b16]">Category</h3>
                <select
                  value={isOtherCategory ? 'other' : selectedCategory ? String(selectedCategory) : ''}
                  onChange={handleCategoryChange}
                  className="w-full rounded-lg border border-[#e4d6c8] px-3 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#c4956a]"
                >
                  <option value="">All Categories</option>
                  {topCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="other">Other Items</option>
                </select>
              </div>

              <hr className="my-5 border-[#e4d6c8]/50" />

              <div className="mb-5">
                <h3 className="mb-3 font-headline-sm text-headline-sm text-[#221b16]">Price Range (৳)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-lg border border-[#e4d6c8] px-3 py-2 text-sm text-[#221b16] outline-none placeholder:text-[#8c7564] focus:border-[#c4956a]"
                  />
                  <span className="text-[#8c7564]">—</span>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-lg border border-[#e4d6c8] px-3 py-2 text-sm text-[#221b16] outline-none placeholder:text-[#8c7564] focus:border-[#c4956a]"
                  />
                </div>
                <button
                  onClick={applyPrice}
                  className="mt-2 w-full rounded-lg bg-[#c4956a] px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-[#a87a4e] hover:shadow-md active:scale-[0.97]"
                >
                  Apply
                </button>
              </div>

              <hr className="my-5 border-[#e4d6c8]/50" />

              <div className="mb-5">
                <h3 className="mb-3 font-headline-sm text-headline-sm text-[#221b16]">Condition</h3>
                <select
                  value={selectedCondition ?? ''}
                  onChange={handleConditionChange}
                  className="w-full rounded-lg border border-[#e4d6c8] px-3 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#c4956a]"
                >
                  <option value="">All Conditions</option>
                  {conditions.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <hr className="my-5 border-[#e4d6c8]/50" />

              <div className="mb-5">
                <h3 className="mb-3 font-headline-sm text-headline-sm text-[#221b16]">Distance from me</h3>
                <div className="flex flex-wrap gap-2">
                  {[undefined, 1, 10, 20, 30, 50, 100].map(d => (
                    <button
                      key={d ?? 'any'}
                      onClick={() => handleDistanceChange(d)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        maxDistance === d
                          ? 'bg-[#c4956a] text-white shadow-sm'
                          : 'border border-[#e4d6c8] text-[#6c5b4f] hover:bg-[#f9f5f0] hover:border-[#c4956a]/50'
                      }`}
                    >
                      {d == null ? 'Any' : `${d} km`}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e4d6c8] px-4 py-2.5 text-sm font-semibold text-[#6c5b4f] transition-colors hover:bg-[#f9f5f0] hover:text-[#221b16]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Reset All Filters
                </button>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {submittedSearch && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    Search: "{submittedSearch}"
                  </span>
                )}
                {activeCategoryName && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    {activeCategoryName}
                  </span>
                )}
                {minPrice != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    Min: ৳{minPrice.toLocaleString()}
                  </span>
                )}
                {maxPrice != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    Max: ৳{maxPrice.toLocaleString()}
                  </span>
                )}
                {activeConditionName && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    {activeConditionName}
                  </span>
                )}
                {maxDistance != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#c4956a]/30 bg-[#c4956a]/10 px-3 py-1 text-xs font-semibold text-[#a87a4e]">
                    <span className="material-symbols-outlined text-[12px]">near_me</span>
                    Within {maxDistance} km
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-xl bg-surface-container"
                  />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-outline-variant/60 bg-surface-base/50 py-20 text-center">
                <span className="material-symbols-outlined text-[64px] text-outline">inventory_2</span>
                <div>
                  <p className="font-headline-sm text-headline-sm text-primary">
                    {hasActiveFilters ? 'No items match your filters' : 'No used items found yet'}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {hasActiveFilters
                      ? 'Try adjusting your filters or search terms.'
                      : 'Be the first to list a pre-loved item.'}
                  </p>
                </div>
                <button
                  onClick={handleSellClick}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary transition-transform hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Sell an Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map(item => (
                  <UsedListingCard
                    key={item.id}
                    listing={item}
                    onImageClick={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
