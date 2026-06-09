import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const CATEGORIES = [
  { name: 'Electronics', filter: 'smartphones-tablets,laptops-computers,tvs-home-entertainment,audio-headphones,gaming-consoles,cameras-drones', icon: 'devices', gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]' },
  { name: 'Furniture', filter: null, icon: 'chair', gradient: 'from-[#f9f5f0] via-[#e4d6c8] to-[#d7c7b8]' },
  { name: 'Home Appliances', filter: 'home-appliances', icon: 'kitchen', gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]' },
  { name: 'Electric', filter: null, icon: 'bolt', gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]' },
  { name: 'Fashion & Accessories', filter: 'fashion-accessories', icon: 'styler', gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]' },
  { name: 'Sports & Outdoors', filter: 'sports-outdoors', icon: 'sports_tennis', gradient: 'from-[#f9f5f0] via-[#e4d6c8] to-[#d7c7b8]' },
  { name: 'Beauty & Care', filter: 'beauty-personal-care', icon: 'spa', gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]' },
  { name: 'Books & Stationery', filter: null, icon: 'menu_book', gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]' },
  { name: 'Toys & Games', filter: null, icon: 'toys', gradient: 'from-[#f9f5f0] via-[#e4d6c8] to-[#d7c7b8]' },
  { name: 'Automotive', filter: null, icon: 'directions_car', gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]' },
]

export default function CategoryGrid() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [autoIdx, setAutoIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const scrollTo = useCallback((i: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[i] as HTMLElement | undefined
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [])

  const handlePrev = useCallback(() => {
    setPaused(true)
    setAutoIdx(i => {
      const next = (i - 1 + CATEGORIES.length) % CATEGORIES.length
      scrollTo(next)
      return next
    })
    setTimeout(() => setPaused(false), 3000)
  }, [scrollTo])

  const handleNext = useCallback(() => {
    setPaused(true)
    setAutoIdx(i => {
      const next = (i + 1) % CATEGORIES.length
      scrollTo(next)
      return next
    })
    setTimeout(() => setPaused(false), 3000)
  }, [scrollTo])

  const handleDotClick = useCallback((i: number) => {
    setPaused(true)
    setAutoIdx(i)
    scrollTo(i)
    setTimeout(() => setPaused(false), 3000)
  }, [scrollTo])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setAutoIdx(i => (i + 1) % CATEGORIES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [paused])

  return (
    <section className="bg-[#faf6f2] px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7564]">Categories</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#221b16]">Shop by Category</h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16] md:inline-flex"
          >
            All products
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div
          className="group relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Glass arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous categories"
            className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white/90 hover:scale-110 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-[#221b16]">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            aria-label="Next categories"
            className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white/90 hover:scale-110 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-[#221b16]">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Auto-scrolling track */}
          <div
            ref={scrollRef}
            className="overflow-hidden no-scrollbar"
          >
            <div
              ref={trackRef}
              className={`flex gap-4 ${paused ? '' : 'animate-category-scroll'}`}
              style={{ width: 'max-content' }}
            >
              {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
                <Link
                  key={`${cat.name}-${i}`}
                  to={cat.filter ? `/products?category=${cat.filter}` : '/products'}
                  className="group relative flex min-w-[140px] shrink-0 flex-col items-center rounded-2xl bg-white px-4 py-8 shadow-sm ring-1 ring-[#e4d6c8]/50 transition-all duration-300 hover:shadow-lg hover:ring-[#c4956a]/30 sm:min-w-[160px]"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${(i % CATEGORIES.length) * 0.05}s both`,
                  }}
                >
                  <div className={`flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                    <span className="material-symbols-outlined text-[28px] text-[#6c5b4f]">{cat.icon}</span>
                  </div>
                  <span className="mt-4 text-center text-sm font-medium text-[#221b16] transition-colors group-hover:text-[#6c5b4f]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {CATEGORIES.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={`rounded-full transition-all duration-500 ${
                  i === autoIdx ? 'w-5 bg-[#c4956a]' : 'w-1.5 bg-[#e4d6c8] hover:bg-[#c4956a]'
                }`}
                style={{ height: '6px' }}
                aria-label={`Category ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16] md:hidden"
        >
          All products
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
