import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'

type Category = {
  id: number
  name: string
  slug: string
  parentId: number | null
  iconUrl?: string
}

const GRADIENT_BG = [
  'bg-gradient-to-br from-[#eef2ff] to-[#eef2ff]',
  'bg-gradient-to-br from-[#eef2ff] to-[#e0d0bd]',
  'bg-gradient-to-br from-[#eef2ff] to-[#eef2ff]',
  'bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff]',
  'bg-gradient-to-br from-[#eef2ff] to-[#e0d0bd]',
  'bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff]',
]

export default function CategoryGrid() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
  })

  const topLevel = categories.filter(c => c.parentId === null).slice(0, 6)

  if (topLevel.length === 0) return null

  return (
    <section className="bg-white px-6 py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Browse</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#1e293b]">Shop by Categories</h2>
          </div>
          <Link
            to="/products"
            className="hidden text-xs font-semibold text-[#64748b] transition-colors hover:text-[#1e293b] md:inline-flex md:items-center md:gap-1"
          >
            All categories
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {topLevel.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group flex w-[140px] shrink-0 flex-col items-center gap-3 sm:w-[160px]"
            >
              <div
                className={`flex h-[140px] w-[140px] items-center justify-center rounded-2xl sm:h-[160px] sm:w-[160px] ${GRADIENT_BG[i % GRADIENT_BG.length]} transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-md`}
              >
                {/* Placeholder icon — swap with real image when available */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10 text-[#94A3B8]">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#1e293b] transition-colors group-hover:text-[#64748b]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#64748b] transition-colors hover:text-[#1e293b] md:hidden"
        >
          All categories
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
