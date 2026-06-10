import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import ProductCard from './ProductCard'
import ImageLightbox from './ImageLightbox'

type Product = {
  id: number
  name: string
  priceBdt: number
  images?: { imageUrl?: string }[]
  category?: { id: number; name: string }
  vendor?: { id: number }
}

type Review = {
  rating: number
}

const tabs = [
  { key: 'latest', label: 'Latest Products' },
  { key: 'topRating', label: 'Top Rating' },
  { key: 'bestSellers', label: 'Best Sellers' },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function HotProducts() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('latest')
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)

  const { data: latestProducts = [], isLoading: latestLoading } = useQuery<Product[]>({
    queryKey: ['hot-latest'],
    queryFn: () =>
      apiClient.get('/api/products', { params: { size: 12 } }).then(r => {
        const list = r.data?.content ?? r.data ?? []
        return Array.isArray(list) ? list : []
      }),
    enabled: activeTab === 'latest',
    staleTime: 120_000,
  })

  const { data: topRatedProducts = [], isLoading: topRatedLoading } = useQuery<Product[]>({
    queryKey: ['hot-top-rated'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/products', { params: { size: 10 } })
      const list = Array.isArray(data?.content ?? data) ? (data?.content ?? data) : []
      const withRatings: (Product & { avgRating: number })[] = await Promise.all(
        list.map(async (p: Product) => {
          try {
            const { data: reviews } = await apiClient.get(`/api/products/${p.id}/reviews`)
            const reviewList: Review[] = Array.isArray(reviews) ? reviews : []
            const avg = reviewList.length > 0
              ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
              : 0
            return { ...p, avgRating: avg }
          } catch {
            return { ...p, avgRating: 0 }
          }
        }),
      )
      return withRatings.filter(p => p.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating)
    },
    enabled: activeTab === 'topRating',
    staleTime: 60_000,
  })

  const isLoading = activeTab === 'latest' ? latestLoading : topRatedLoading
  const displayProducts = useMemo(() => {
    const list = activeTab === 'latest' ? latestProducts : topRatedProducts
    return list.filter((p: Product) => !user || p.vendor?.id !== user.id)
  }, [activeTab, latestProducts, topRatedProducts, user])

  return (
    <section className="bg-white px-6 py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#221b16]">Hot Products</h2>
            <div className="mt-2 h-0.5 w-12 rounded-full bg-[#c4956a]" />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-1 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#221b16]'
                    : 'text-[#8c7564] hover:text-[#221b16]'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#c4956a]" />
                )}
              </button>
            ))}
            <Link
              to="/products"
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16]"
            >
              All products
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {/* Best Sellers empty state */}
          {activeTab === 'bestSellers' && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f9f5f0] bg-[#f9f5f0] py-20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-[#e4d6c8]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <p className="mt-4 text-sm text-[#8c7564]">
                No best sellers to show yet. Once sales pick up and products are flagged as best sellers, they will appear here.
              </p>
            </div>
          )}

          {/* Latest Products empty state */}
          {activeTab === 'latest' && !isLoading && latestProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f9f5f0] bg-[#f9f5f0] py-20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-[#e4d6c8]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <p className="mt-4 text-sm text-[#8c7564]">
                No latest products to show yet. Once products are listed, they will appear here.
              </p>
            </div>
          )}

          {/* Top Rating empty state */}
          {activeTab === 'topRating' && !isLoading && topRatedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f9f5f0] bg-[#f9f5f0] py-20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-[#e4d6c8]">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <p className="mt-4 text-sm text-[#8c7564]">
                No top rated products to show yet. Once customers leave reviews, top rated products will appear here.
              </p>
            </div>
          )}

          {/* Loading state */}
          {(activeTab === 'latest' || activeTab === 'topRating') && isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#f9f5f0]" />
              ))}
            </div>
          )}

          {/* Product grid */}
          {!isLoading && displayProducts.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onImageClick={(images, index) => setLightbox({ images, index })}
                  truncateName
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile "All products" link */}
        <div className="mt-6 text-center md:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16]"
          >
            All products
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  )
}
