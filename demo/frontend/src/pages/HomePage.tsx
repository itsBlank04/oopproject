import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../lib/apiClient'

type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
}

type Product = {
  id: number
  name: string
  priceBdt: number
  category: { name: string }
  images: { imageUrl: string }[]
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(200000)
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

  useEffect(() => {
    apiClient.get('/api/categories').then(r => {
      if (Array.isArray(r.data)) setCategories(r.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: any = { size: 50 }
    if (selectedCategory) params.categoryId = selectedCategory
    apiClient.get('/api/products', { params })
      .then(r => {
        const list = r.data?.content ?? r.data ?? []
        setProducts(Array.isArray(list) ? list : [])
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [selectedCategory])

  const filtered = products.filter(p => p.priceBdt >= minPrice && p.priceBdt <= maxPrice)

  return (
    <div className="min-h-screen bg-[#f9f5f0] py-3 px-2 sm:py-2 sm:px-4">
      <div className="mx-auto max-w-[1800px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] min-h-[calc(100vh-3rem)] flex overflow-hidden">
        {/* Sidebar */}
        {/* Mobile filter backdrop */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* Sidebar */}
        <aside className={`w-[280px] shrink-0 border-r border-gray-100 p-6 overflow-y-auto ${showMobileFilters ? 'fixed left-0 top-0 bottom-0 z-50 bg-white animate-in slide-in-from-left' : 'hidden'} md:relative md:z-auto md:block md:animate-none`}>
          {/* Mobile close */}
          <button onClick={() => setShowMobileFilters(false)} className="md:hidden float-right w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price Range</h3>
              <button onClick={() => { setMinPrice(0); setMaxPrice(200000) }} className="text-[10px] text-gray-400 hover:text-gray-900 transition-colors">Reset</button>
            </div>
            
            {/* Histogram */}
            <div className="flex items-end gap-[3px] h-12 mb-6 px-0.5">
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
                  <div key={i} className="flex-1 relative"
                    style={{ height: `${(bar.h / 85) * 100}%` }}
                  >
                    <div className="absolute bottom-0 inset-x-0 overflow-hidden h-full rounded-t-[2px]">
                      <div className="absolute inset-0 bg-gray-100 rounded-t-[2px]" />
                      <div
                        className="absolute bottom-0 inset-x-0 rounded-t-[2px] transition-all duration-500 ease-out"
                        style={{
                          height: inRange ? '100%' : '6%',
                          background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
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
              className="relative pt-1 pb-1 select-none touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              {/* Track */}
              <div className="w-full h-1 bg-gray-200 rounded-full relative overflow-hidden">
                {/* Filled range */}
                <div
                  className="absolute inset-y-0 rounded-full pointer-events-none transition-all duration-100"
                  style={{
                    left: `${(minPrice / 200000) * 100}%`,
                    width: `${((maxPrice - minPrice) / 200000) * 100}%`,
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              {/* Min thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-sm cursor-pointer hover:shadow-md active:shadow-sm transition-shadow"
                style={{ left: `calc(${(minPrice / 200000) * 100}% - 7px)` }}
                onPointerDown={handlePointerDown('min')}
              />
              {/* Max thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-sm cursor-pointer hover:shadow-md active:shadow-sm transition-shadow"
                style={{ left: `calc(${(maxPrice / 200000) * 100}% - 7px)` }}
                onPointerDown={handlePointerDown('max')}
              />
            </div>
            {/* Price pills */}
            <div className="flex items-center justify-between mt-3">
              <span className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded-full leading-none">৳{minPrice.toLocaleString('en-BD')}</span>
              <span className="px-2.5 py-1 bg-gray-900 text-white text-[10px] font-semibold rounded-full leading-none">৳{maxPrice.toLocaleString('en-BD')}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category</h3>
            <select
              value={selectedCategory ?? ''}
              onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all appearance-none cursor-pointer"
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
          {/* Mobile filter toggle */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="text-sm text-gray-500">{filtered.length} items</span>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filters
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filtered.map(product => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="group bg-white rounded-2xl border border-gray-100 p-4 flex flex-col hover:shadow-md hover:border-gray-200 transition-all duration-300"
                >
                  <div className="bg-gray-50 rounded-xl h-48 mb-4 flex items-center justify-center p-4 overflow-hidden">
                    {product.images?.length > 0 ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs">No image</span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">{product.category?.name}</p>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{product.name}</h3>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-900">৳{product.priceBdt.toLocaleString('en-BD')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
