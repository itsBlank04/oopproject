import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

type Slide = {
  id: number
  badge: string
  label: string
  title: string
  description: string
  cta: { text: string; to: string }
  icon: string
  gradient: string
  ringColor: string
}

const SLIDES: Slide[] = [
  {
    id: 1,
    badge: 'Marketplace',
    label: 'Discover Brands',
    title: 'New Collection',
    description: 'Discover handpicked items from our verified vendors — quality pre-owned tech, exclusive finds, and more.',
    cta: { text: 'Shop now', to: '/products' },
    icon: 'shopping_bag',
    gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]',
    ringColor: 'ring-[#c4956a]/20',
  },
  {
    id: 2,
    badge: 'Auction',
    label: 'Live Bidding',
    title: 'Auction House',
    description: 'Bid on exclusive items in real-time. From vintage collectibles to high-end electronics — the best deals go to the highest bidder.',
    cta: { text: 'View auctions', to: '/auctions' },
    icon: 'gavel',
    gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]',
    ringColor: 'ring-[#c4956a]/20',
  },
  {
    id: 3,
    badge: 'Repair',
    label: 'Expert Service',
    title: 'Repair Hub',
    description: 'Certified technicians ready to fix your devices. Phones, laptops, appliances — fast turnaround with genuine parts and warranty.',
    cta: { text: 'Find a technician', to: '/repair' },
    icon: 'handyman',
    gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]',
    ringColor: 'ring-[#c4956a]/20',
  },
  {
    id: 4,
    badge: 'Pre-owned',
    label: 'Great Deals',
    title: 'Used & Refurbished',
    description: 'Quality pre-owned items at unbeatable prices. Every listing is verified so you can buy with confidence.',
    cta: { text: 'Browse used items', to: '/used-listings' },
    icon: 'inventory_2',
    gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]',
    ringColor: 'ring-[#c4956a]/20',
  },
]

export default function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [hovering, setHovering] = useState(false)
  const slide = SLIDES[current]

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section
      className="relative overflow-hidden bg-white group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Floating glass arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 ${
          hovering ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        } hover:bg-white/80 hover:scale-110 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-[#221b16]">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className={`absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-500 ${
          hovering ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        } hover:bg-white/80 hover:scale-110 active:scale-95`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-[#221b16]">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-14 md:flex-row md:gap-16 md:py-20 lg:px-8 lg:py-24">
        {/* Left */}
        <div className="w-full max-w-lg md:w-1/2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7564]">
            AtomDrops 2026
          </p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-[#8c7564]">
            {slide.badge}
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="mt-2 text-[2.8rem] font-light leading-[1.1] tracking-tight text-[#221b16] sm:text-[3.2rem] lg:text-[3.8rem]"
          >
            {slide.title}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#6c5b4f]">
            {slide.description}
          </p>
          <Link
            to={slide.cta.to}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c4956a] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#a87a4e] hover:shadow-lg active:scale-[0.97]"
          >
            {slide.cta.text}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="mt-10 flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e4d6c8]">
              {String(current + 1).padStart(2, '0')}
            </p>
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-500 ${
                    i === current ? 'w-6 bg-[#c4956a]' : 'w-1.5 bg-[#e4d6c8] hover:bg-[#c4956a]'
                  }`}
                  style={{ height: '6px' }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={prev}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e4d6c8] text-[#8c7564] transition-all hover:border-[#c4956a] hover:text-[#c4956a] active:scale-90"
                aria-label="Previous slide"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e4d6c8] text-[#8c7564] transition-all hover:border-[#c4956a] hover:text-[#c4956a] active:scale-90"
                aria-label="Next slide"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex w-full items-center justify-center md:w-1/2">
          <div className="flex flex-col items-center">
            <div className="relative flex h-[300px] w-[300px] items-center justify-center sm:h-[360px] sm:w-[360px] lg:h-[440px] lg:w-[440px]">
              {/* Glass circle */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient} ring-1 ${slide.ringColor} backdrop-blur-3xl`}
              />
              <div className="absolute inset-4 rounded-full bg-white/40 backdrop-blur-xl" />
              <div className="relative flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-6xl text-[#6c5b4f]/80 sm:text-7xl lg:text-8xl">
                  {slide.icon}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8c7564]">
                  {slide.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
