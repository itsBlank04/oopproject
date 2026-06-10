/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Electronics', icon: 'devices' },
  { id: 2, name: 'Furniture', icon: 'chair' },
  { id: 3, name: 'Fashion', icon: 'styler' },
  { id: 5, name: 'Sports', icon: 'sports_tennis' },
  { id: 6, name: 'Books', icon: 'menu_book' },
]

const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': 'devices',
  'Furniture': 'chair',
  'Home Appliances': 'kitchen',
  'Electric': 'bolt',
  'Fashion & Accessories': 'styler',
  'Sports & Outdoors': 'sports_tennis',
  'Beauty & Care': 'spa',
  'Books & Stationery': 'menu_book',
  'Toys & Games': 'toys',
  'Automotive': 'directions_car',
}

export default function UsedMarketplacePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
  })

  const { data: listings = [] } = useQuery<any[]>({
    queryKey: ['used-marketplace-featured'],
    queryFn: () =>
      apiClient.get('/api/used-listings').then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data?.content || []
        return data.slice(0, 6)
      }),
    staleTime: 120_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['used-marketplace-stats'],
    queryFn: () =>
      apiClient.get('/api/used-listings').then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data?.content || []
        return {
          totalListings: data.length,
          activeListings: data.filter((l: any) => l.status === 'ACTIVE').length,
        }
      }),
    staleTime: 60_000,
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/used-listings?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/used-listings')
    }
  }

  const handleSellClick = () => {
    if (user) navigate('/used-listings/new')
    else openModal('signin')
  }

  const displayStats = stats || { totalListings: 0, activeListings: 0 }
  const topCategories = categories.length > 0 ? categories.slice(0, 6) : FALLBACK_CATEGORIES
  const otherListings = useMemo(() =>
    listings.filter((item: any) => !user || item.seller?.id !== user.id),
    [listings, user],
  )

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl" />

        <div className="max-w-container-max mx-auto px-margin-desktop text-center relative z-10">
          <h1 className="font-headline-lg text-headline-lg mb-8 max-w-3xl mx-auto">
            Discover Premium Pre-loved Goods
          </h1>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary-container/20 blur-2xl group-hover:bg-primary-container/30 transition-all duration-500 rounded-full" />
            <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant p-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined ml-6 text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-4 font-body-lg text-body-lg text-on-surface placeholder-outline outline-none"
                placeholder="Search for electronics, furniture, vintage items..."
              />
              <button
                type="submit"
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link
              to="/used-listings"
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              Browse Listings
            </Link>
            <button
              onClick={handleSellClick}
              className="bg-surface-container-lowest border border-outline-variant px-8 py-4 rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Sell an Item
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Quick Category Selection ═══ */}
      <section className="py-12 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {topCategories.map((c: any) => (
              <Link
                key={c.id}
                to={`/used-listings?category=${c.id}`}
                className="flex flex-col items-center gap-4 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
                  <span className="material-symbols-outlined text-primary scale-125">
                    {CATEGORY_ICONS[c.name] || 'inventory_2'}
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="py-10 bg-surface-container-lowest border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.activeListings}+</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Items Listed</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">100%</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Trusted Sellers</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.totalListings}</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Items Sold</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">4.8 ★</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Happy Buyers</p>
          </div>
        </div>
      </section>

      {/* ═══ Featured Listings ═══ */}
      <section className="pb-section-gap pt-16">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-headline-md text-headline-md mb-2">Featured Items</h2>
              <p className="text-on-surface-variant max-w-lg">
                Premium pre-loved goods from verified sellers in your community.
              </p>
            </div>
            <Link
              to="/used-listings"
              className="text-primary font-bold flex items-center gap-2 group hover:gap-4 transition-all duration-300"
            >
              View all items <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherListings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">inventory_2</span>
                <p className="font-label-md text-label-md">No items from other sellers yet.</p>
                <button
                  onClick={handleSellClick}
                  className="mt-4 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors"
                >
                  Be the first to sell
                </button>
              </div>
            ) : (
              otherListings.map((item: any) => {
                const images = item.images || []
                const conditionLabel = item.condition?.label || item.conditionLevel?.label || 'Used'
                const price = item.priceBdt ?? item.askingPriceBdt
                return (
                  <Link
                    key={item.id}
                    to={`/used-listings/${item.id}`}
                    className="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] transition-all duration-500 flex flex-col"
                  >
                    <div className="h-48 relative overflow-hidden bg-surface-container">
                      {images.length > 0 ? (
                        <img
                          src={images[0].imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-container/20">
                          <span className="material-symbols-outlined text-6xl text-primary/40">image</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-label-sm font-semibold shadow-sm">
                        {conditionLabel}
                      </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm mb-2 line-clamp-1">{item.title}</h3>
                      <p className="text-on-surface-variant text-body-md line-clamp-2 mb-4 flex-grow">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-inverse-primary">
                          ৳{price?.toLocaleString('en-BD') || '—'}
                        </span>
                        {item.seller?.displayName && (
                          <span className="text-label-sm text-on-surface-variant">
                            {item.seller.displayName}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* ═══ Trust Strip ═══ */}
      <section className="py-16 border-y border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
            <div>
              <h4 className="font-bold mb-1">AtomDrops Verified</h4>
              <p className="text-on-surface-variant text-body-md">
                Every seller is verified. All listings are reviewed for authenticity and quality.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">security</span>
            <div>
              <h4 className="font-bold mb-1">Secure Transactions</h4>
              <p className="text-on-surface-variant text-body-md">
                Built-in chat and offer system. Transparent negotiations with no hidden fees.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">thumb_up</span>
            <div>
              <h4 className="font-bold mb-1">Quality Guaranteed</h4>
              <p className="text-on-surface-variant text-body-md">
                Items are categorized by condition. What you see is exactly what you get.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
