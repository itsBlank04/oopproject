import { useEffect, useState } from 'react'
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
  const [priceRange, setPriceRange] = useState(200000)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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

  const filtered = products.filter(p => p.priceBdt <= priceRange)

  return (
    <div className="min-h-screen bg-[#f9f5f0] py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl bg-white rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] min-h-[calc(100vh-3rem)] flex overflow-hidden">
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
          <div className="mb-8 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price Range</h3>
              <button onClick={() => setPriceRange(200000)} className="text-[10px] text-gray-400 hover:text-gray-900 transition-colors">Reset</button>
            </div>
            
            {/* Histogram with gradient bars */}
            <div className="flex items-end gap-[2px] h-14 mb-5 px-0.5">
              {[
                { h: 8, t: '' },
                { h: 12, t: '' },
                { h: 18, t: '' },
                { h: 25, t: '' },
                { h: 35, t: '' },
                { h: 50, t: '' },
                { h: 65, t: '' },
                { h: 75, t: '' },
                { h: 85, t: '' },
                { h: 70, t: '' },
                { h: 55, t: '' },
                { h: 40, t: '' },
                { h: 28, t: '' },
                { h: 18, t: '' },
                { h: 10, t: '' },
              ].map((bar, i) => {
                return (
                  <div key={i} className="flex-1 relative group"
                    style={{ height: `${(bar.h / 85) * 100}%` }}
                  >
                    <div className="absolute bottom-0 inset-x-0 rounded-t-[3px] overflow-hidden"
                      style={{ height: '100%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-50 to-indigo-100/60 rounded-t-[3px]" />
                      <div
                        className="absolute bottom-0 inset-x-0 rounded-t-[3px] transition-all duration-500 ease-out"
                        style={{
                          height: `${Math.min(100, (priceRange / 200000) * 100 * 1.2)}%`,
                          background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                          opacity: i <= Math.floor((priceRange / 200000) * 15) ? 0.85 : 0.15,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Custom range slider */}
            <div className="relative pt-1 pb-2">
              <div className="relative h-7 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="1000"
                  value={priceRange}
                  onChange={e => setPriceRange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-20 h-7"
                />
                {/* Track background */}
                <div className="w-full h-1.5 bg-gradient-to-r from-indigo-100 via-indigo-100 to-gray-200 rounded-full absolute overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
                    style={{
                      width: `${(priceRange / 200000) * 100}%`,
                      background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                    }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute w-5 h-5 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none z-10 transition-none flex items-center justify-center"
                  style={{ left: `calc(${(priceRange / 200000) * 100}% - 10px)` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </div>
              </div>
              {/* Price labels */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">৳0</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                  ৳{priceRange.toLocaleString('en-BD')}
                </span>
              </div>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
