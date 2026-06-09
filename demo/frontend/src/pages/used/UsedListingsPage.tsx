import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import ImageLightbox from '../../components/ImageLightbox'

type Category = { id: number; name: string; slug: string; parentId: number | null }
type Review = { id: number; rating: number }
type UsedListing = {
  id: number
  title: string
  description: string
  priceBdt: number
  askingPriceBdt?: number
  status: string
  condition: { label: string } | null
  conditionLevel?: { label: string } | null
  category: { id: number; name: string } | null
  seller: { id?: number; displayName: string; avatarUrl?: string } | null
  images: { imageUrl: string }[]
  createdAt: string
}

const ICON_BY_SLUG: Record<string, string> = {
  electronics: 'devices',
  tech: 'devices',
  phone: 'phone_iphone',
  phones: 'phone_iphone',
  computer: 'computer',
  computers: 'computer',
  laptop: 'computer',
  camera: 'photo_camera',
  cameras: 'photo_camera',
  watch: 'watch',
  watches: 'watch',
  furniture: 'chair',
  chair: 'chair',
  home: 'chair',
  kitchen: 'kitchen',
  fashion: 'styler',
  clothing: 'styler',
  apparel: 'styler',
  shoes: 'styler',
  jewelry: 'diamond',
  outdoors: 'directions_bike',
  sports: 'sports_esports',
  fitness: 'fitness_center',
  bike: 'directions_bike',
  books: 'menu_book',
  book: 'menu_book',
  collectibles: 'auto_stories',
  art: 'palette',
  music: 'music_note',
  toys: 'toys',
  pets: 'pets',
  baby: 'child_care',
  gaming: 'sports_esports',
  garden: 'yard',
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

function resolveCategoryIcon(slug: string | undefined, name: string | undefined): string {
  const s = (slug || name || '').toLowerCase()
  if (ICON_BY_SLUG[s]) return ICON_BY_SLUG[s]
  const key = Object.keys(ICON_BY_SLUG).find(k => s.includes(k))
  return key ? ICON_BY_SLUG[key] : 'category'
}

function UsedListingCard({
  listing,
  onImageClick,
}: {
  listing: UsedListing
  onImageClick: (imgs: { url: string }[], idx: number) => void
}) {
  const navigate = useNavigate()
  const [favorited, setFavorited] = useState(false)
  const [imgHovered, setImgHovered] = useState(false)

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
            {reviewCount > 0 && (
              <span className="ml-auto flex items-center text-[11px] font-semibold text-auction-gold">
                <span className="material-symbols-outlined mr-0.5 text-[12px] icon-fill">star</span>
                {avgRating.toFixed(1)}
              </span>
            )}
          </div>
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

  const rawCategory = searchParams.get('category')
  const rawSearch = searchParams.get('q') ?? ''
  const parsedCategory = rawCategory ? Number(rawCategory) : NaN
  const selectedCategory = Number.isFinite(parsedCategory) && parsedCategory > 0 ? parsedCategory : null
  const submittedSearch = rawSearch

  const [searchInput, setSearchInput] = useState(rawSearch)
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  const [catCarouselIdx, setCatCarouselIdx] = useState(0)
  const [catCarouselPaused, setCatCarouselPaused] = useState(false)
  const catScrollRef = useRef<HTMLDivElement>(null)
  const catCarouselTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
  })

  const topCategories = useMemo(() => {
    const top = categories.filter(c => c.parentId === null).slice(0, 12)
    return top.length > 0 ? top : FALLBACK_CATEGORIES
  }, [categories])

  const activeCategoryName = useMemo(
    () => topCategories.find(c => c.id === selectedCategory)?.name,
    [topCategories, selectedCategory],
  )

  const { data: listings = [], isLoading } = useQuery<UsedListing[]>({
    queryKey: ['used-listings', submittedSearch, selectedCategory],
    queryFn: () =>
      apiClient
        .get('/api/used-listings', {
          params: {
            search: submittedSearch || undefined,
            category: selectedCategory ?? undefined,
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

  const submitSearch = () => {
    const next = searchInput.trim()
    setSearchParams(
      prev => {
        if (next) prev.set('q', next)
        else prev.delete('q')
        return prev
      },
      { replace: true },
    )
  }
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch()
  }

  const handleCategoryClick = (cat: Category) => {
    if (cat.id === 0) return
    setSearchParams(
      prev => {
        if (selectedCategory === cat.id) prev.delete('category')
        else prev.set('category', String(cat.id))
        return prev
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const catAdvance = useCallback(() => {
    setCatCarouselIdx(i => (i + 1) % topCategories.length)
  }, [topCategories.length])

  useEffect(() => {
    if (catCarouselPaused || topCategories.length <= 1) return
    catCarouselTimer.current = setInterval(catAdvance, 3500)
    return () => { if (catCarouselTimer.current) clearInterval(catCarouselTimer.current) }
  }, [catCarouselPaused, catAdvance, topCategories.length])

  const catPrev = useCallback(() => {
    setCatCarouselPaused(true)
    setCatCarouselIdx(i => (i - 1 + topCategories.length) % topCategories.length)
    setTimeout(() => setCatCarouselPaused(false), 5000)
  }, [topCategories.length])

  const catNext = useCallback(() => {
    setCatCarouselPaused(true)
    setCatCarouselIdx(i => (i + 1) % topCategories.length)
    setTimeout(() => setCatCarouselPaused(false), 5000)
  }, [topCategories.length])

  useEffect(() => {
    const el = catScrollRef.current
    if (!el) return
    const card = el.children[catCarouselIdx] as HTMLElement | undefined
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [catCarouselIdx])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowCategoryDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const clearCategory = () => {
    setSearchParams(
      prev => {
        prev.delete('category')
        return prev
      },
      { replace: true },
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <section className="mx-auto w-full max-w-container-max px-margin-mobile pb-8 pt-12 md:px-margin-desktop">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
              Discover Premium Pre-loved Goods
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Connect directly with verified sellers in your community. Negotiate instantly, buy securely.
            </p>
          </div>
          <button
            onClick={handleSellClick}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-6 py-3 font-label-md text-label-md text-on-primary transition-transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Sell an Item
          </button>
        </div>

        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-base p-2 card-shadow transition-colors focus-within:border-secondary md:flex-row md:p-3">
          <div className="flex w-full flex-1 items-center px-3">
            <span className="material-symbols-outlined mr-3 text-outline">search</span>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search for electronics, furniture, vintage..."
              type="text"
              className="w-full border-none bg-transparent p-0 font-body-md text-body-md text-primary outline-none placeholder:text-outline focus:ring-0"
            />
          </div>
          <div className="hidden h-8 w-px bg-outline-variant md:block" />
          <div ref={dropdownRef} className="relative flex w-full items-center px-3 md:w-auto">
            <span className="material-symbols-outlined mr-2 text-outline">category</span>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(o => !o)}
              className="whitespace-nowrap font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              {selectedCategory
                ? topCategories.find(c => c.id === selectedCategory)?.name ?? `Category ${selectedCategory}`
                : 'All Categories'}
            </button>
            {showCategoryDropdown && (
              <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-outline-variant/50 bg-surface-base py-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setSearchParams(p => { p.delete('category'); return p }, { replace: true }); setShowCategoryDropdown(false) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">all_inclusive</span>
                  All Categories
                </button>
                {categories.filter(c => c.parentId === null).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSearchParams(p => { p.set('category', String(cat.id)); return p }, { replace: true }); setShowCategoryDropdown(false) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline">{resolveCategoryIcon(cat.slug, cat.name)}</span>
                    {cat.name}
                  </button>
                ))}
                <div className="mx-3 my-1 h-px bg-outline-variant/50" />
                <button
                  type="button"
                  onClick={() => { setSearchParams(p => { return p }, { replace: true }); setShowCategoryDropdown(false) }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">more_horiz</span>
                  Others
                </button>
              </div>
            )}
          </div>
          <div className="hidden h-8 w-px bg-outline-variant md:block" />
          <button
            type="button"
            onClick={submitSearch}
            className="w-full whitespace-nowrap rounded-xl bg-secondary px-8 py-3 font-label-md text-label-md text-on-secondary transition-transform hover:scale-[1.02] md:w-auto"
          >
            Search
          </button>
        </div>
      </section>

      <section
        className="group relative mb-section-gap w-full border-b border-outline-variant/30 bg-surface-base/50 backdrop-blur-sm no-scrollbar"
        onMouseEnter={() => setCatCarouselPaused(true)}
        onMouseLeave={() => setCatCarouselPaused(false)}
      >
        <button
          type="button"
          onClick={catPrev}
          aria-label="Previous categories"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-base/70 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-surface-base hover:scale-110 active:scale-95 md:h-11 md:w-11"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={catNext}
          aria-label="Next categories"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-base/70 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-surface-base hover:scale-110 active:scale-95 md:h-11 md:w-11"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div
            ref={catScrollRef}
            className="flex gap-8 overflow-x-auto scroll-smooth no-scrollbar py-6"
          >
            {topCategories.map(cat => {
              const icon = resolveCategoryIcon(cat.slug, cat.name)
              const isActive = cat.id !== 0 && cat.id === selectedCategory
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  aria-pressed={isActive}
                  className="group/cat flex shrink-0 cursor-pointer flex-col items-center gap-3"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-secondary-container ring-2 ring-secondary'
                        : 'bg-surface-container-high group-hover/cat:bg-secondary-container'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[28px] transition-colors ${
                        isActive
                          ? 'text-on-secondary-container'
                          : 'text-primary group-hover/cat:text-on-secondary-container'
                      }`}
                    >
                      {icon}
                    </span>
                  </div>
                  <span
                    className={`font-label-sm text-label-sm text-primary whitespace-nowrap ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-1.5 pb-4">
            {topCategories.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setCatCarouselPaused(true); setCatCarouselIdx(i); setTimeout(() => setCatCarouselPaused(false), 5000) }}
                className={`rounded-full transition-all duration-500 ${
                  i === catCarouselIdx ? 'w-5 bg-secondary' : 'w-1.5 bg-outline hover:bg-secondary'
                }`}
                style={{ height: '6px' }}
                aria-label={`Category ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-section-gap max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-primary">Fresh Listings Near You</h2>
          <Link
            to="/used-listings"
            className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline"
          >
            View All
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {selectedCategory && activeCategoryName && (
          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              onClick={clearCategory}
              className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary-container/10 px-3 py-1.5 font-label-sm text-label-sm font-semibold text-secondary transition-colors hover:bg-secondary-container/20"
            >
              Filtered by: {activeCategoryName}
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
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
                {(() => {
                  const parts: string[] = []
                  if (submittedSearch) parts.push(`for "${submittedSearch}"`)
                  if (activeCategoryName) parts.push(`in ${activeCategoryName}`)
                  return parts.length > 0 ? `No results ${parts.join(' ')}` : 'No used items found yet'
                })()}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {submittedSearch || selectedCategory
                  ? 'Try a different category or search term.'
                  : 'Be the first to list a pre-loved item in your area.'}
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
      </section>

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
