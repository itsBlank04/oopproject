import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import ImageLightbox from '../../components/ImageLightbox'
import ProductCard from '../../components/ProductCard'

type Product = {
  id: number
  name: string
  description: string
  priceBdt: number
  status: string
  category: { id: number; name: string }
  images: { id: number; imageUrl: string; sortOrder: number }[]
}

type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
}

export default function ProductListPage() {
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  const initialCategory = categoryFromUrl ? Number(categoryFromUrl) : null

  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(200000)
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)

  const sliderRef = useRef<HTMLDivElement>(null)

  const getPriceFromPosition = (clientX: number) => {
    if (!sliderRef.current) return 0
    const rect = sliderRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round((pct * 200000) / 1000) * 1000
  }

  const handlePointerDown = (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
    setDragging(thumb)
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const val = getPriceFromPosition(e.clientX)
    if (dragging === 'min' && val <= maxPrice - 1000) setMinPrice(val)
    if (dragging === 'max' && val >= minPrice + 1000) setMaxPrice(val)
  }

  const handlePointerUp = () => setDragging(null)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  })

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => {
      const params: any = { size: 50 }
      if (selectedCategory) params.category = selectedCategory
      return apiClient.get('/api/products', { params }).then(r => {
        const list = r.data?.content ?? r.data ?? []
        return Array.isArray(list) ? list : []
      })
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const products = productsData ?? []
  const filtered = products.filter((p: Product) => p.priceBdt >= minPrice && p.priceBdt <= maxPrice)

  return (
    <div className="min-h-screen bg-[#f8fafc] px-2 py-3 sm:px-4 sm:py-2">
      <div className="mx-auto max-w-[1800px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] min-h-[calc(100vh-3rem)] flex overflow-hidden">
        {/* Mobile filter backdrop */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* Sidebar */}
        <aside className={`w-[280px] shrink-0 border-r border-gray-100 p-6 overflow-y-auto ${showMobileFilters ? 'fixed left-0 top-0 bottom-0 z-50 bg-white animate-in slide-in-from-left' : 'hidden'} md:relative md:z-auto md:block md:animate-none`}>
          <button onClick={() => setShowMobileFilters(false)} className="float-right mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 md:hidden">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Price Range */}
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Price Range</h3>
              <button onClick={() => { setMinPrice(0); setMaxPrice(200000) }} className="text-[10px] text-gray-400 transition-colors hover:text-gray-900">Reset</button>
            </div>

            {/* Histogram */}
            <div className="mb-6 flex h-12 items-end gap-[3px] px-0.5">
              {[
                { h: 8 }, { h: 12 }, { h: 18 }, { h: 25 },
                { h: 35 }, { h: 50 }, { h: 65 }, { h: 75 },
                { h: 85 }, { h: 70 }, { h: 55 }, { h: 40 },
                { h: 28 }, { h: 18 }, { h: 10 },
              ].map((bar, i) => {
                const barStart = (i / 15) * 200000
                const barEnd = ((i + 1) / 15) * 200000
                const inRange = barEnd >= minPrice && barStart <= maxPrice
                return (
                  <div key={i} className="relative flex-1"
                    style={{ height: `${(bar.h / 85) * 100}%` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden rounded-t-[2px]">
                      <div className="absolute inset-0 rounded-t-[2px] bg-gray-100" />
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t-[2px] transition-all duration-500 ease-out"
                        style={{
                          height: inRange ? '100%' : '6%',
                          background: 'linear-gradient(to top, #6366f1, #8b5cf6)',
                          opacity: inRange ? 1 : 0.08,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Dual range slider */}
            <div
              ref={sliderRef}
              className="relative select-none pb-1 pt-1 touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="pointer-events-none absolute inset-y-0 rounded-full transition-all duration-100"
                  style={{
                    left: `${(minPrice / 200000) * 100}%`,
                    width: `${((maxPrice - minPrice) / 200000) * 100}%`,
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 cursor-pointer rounded-full border-2 border-indigo-500 bg-white shadow-sm transition-shadow hover:shadow-md active:shadow-sm"
                style={{ left: `calc(${(minPrice / 200000) * 100}% - 7px)` }}
                onPointerDown={handlePointerDown('min')}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 cursor-pointer rounded-full border-2 border-indigo-500 bg-white shadow-sm transition-shadow hover:shadow-md active:shadow-sm"
                style={{ left: `calc(${(maxPrice / 200000) * 100}% - 7px)` }}
                onPointerDown={handlePointerDown('max')}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-semibold leading-none text-white">৳{minPrice.toLocaleString('en-BD')}</span>
              <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-semibold leading-none text-white">৳{maxPrice.toLocaleString('en-BD')}</span>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</h3>
            <select
              value={selectedCategory ?? ''}
              onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Product grid */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <h1 className="mb-4 text-xl font-semibold text-[#1e293b]">Products</h1>
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="text-sm text-gray-500">{filtered.length} items</span>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filters
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onImageClick={(images, index) => setLightbox({ images, index })}
                />
              ))}
            </div>
          )}
        </main>
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
