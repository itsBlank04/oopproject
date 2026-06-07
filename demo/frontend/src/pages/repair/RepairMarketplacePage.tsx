import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Search, Wrench, Shield, CheckCircle, Star, ArrowRight, Activity } from 'lucide-react'

export default function RepairMarketplacePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch repair stats
  const { data: stats } = useQuery({
    queryKey: ['repair-stats'],
    queryFn: () => apiClient.get('/api/repair/stats').then(r => r.data),
    staleTime: 60_000,
  })

  // Fetch technicians
  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['popular-technicians'],
    queryFn: () => apiClient.get('/api/technicians').then(r => Array.isArray(r.data) ? r.data.slice(0, 3) : []),
    staleTime: 120_000,
  })

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/repair/technicians?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Fallback stats if not loaded yet
  const displayStats = stats || {
    totalTechnicians: 12,
    totalRepairs: 45,
    completedRepairs: 42,
    avgRating: '4.9',
    totalReviews: 28,
  }

  const steps = [
    {
      title: 'Post your request',
      desc: 'Describe what needs repair, upload photos, and set your availability.',
      num: '01'
    },
    {
      title: 'Receive custom quotes',
      desc: 'Local certified technicians bid with detailed estimates and parts lists.',
      num: '02'
    },
    {
      title: 'Accept & Schedule',
      desc: 'Choose your technician, verify details, and book your service slot.',
      num: '03'
    },
    {
      title: 'Release funds & Review',
      desc: 'Payment is held in escrow until the repair is done. Inspect and complete.',
      num: '04'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0e8df] to-[#f9f5f0] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c7b8] bg-white px-4 py-1.5 text-xs font-semibold text-[#8c7564] shadow-sm mb-6">
            <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
            <span>Over {displayStats.completedRepairs}+ successful repairs completed</span>
          </div>
          <h1 className="font-[Fraunces] text-4xl font-bold tracking-tight text-[#221b16] sm:text-6xl">
            Professional & Trusted <br />
            <span className="text-[#a28672]">On-Demand Repairs</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-[#6c5b4f] leading-relaxed">
            Connect with skilled craftsmen in Bangladesh for appliance servicing, electronics repair, electrical installation, and more. Transparent pricing, escrow protection, and 100% satisfaction guaranteed.
          </p>

          <form onSubmit={handleSearchSubmit} className="mx-auto mt-10 max-w-lg">
            <div className="relative flex items-center rounded-2xl border border-[#d7c7b8] bg-white p-2 shadow-md">
              <Search className="h-5 w-5 text-[#8c7564] ml-3" />
              <input
                type="text"
                placeholder="Search technicians by specialization, name or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-[#221b16] outline-none placeholder:text-[#8a7a6a]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#221b16] px-6 py-2.5 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a3028]"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/repair/requests"
              className="rounded-xl bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a3028] shadow-sm"
            >
              Post a Repair Request
            </Link>
            <Link
              to="/repair/technicians"
              className="rounded-xl border border-[#d7c7b8] bg-white px-6 py-3 text-sm font-semibold text-[#221b16] transition hover:bg-[#f9f5f0]"
            >
              Browse Technicians
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-[#e4d6c8] bg-white py-8 px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-[Fraunces] text-3xl font-bold text-[#221b16]">{displayStats.completedRepairs}</p>
            <p className="mt-1 text-xs font-semibold text-[#8c7564] uppercase tracking-wider">Repairs Done</p>
          </div>
          <div>
            <p className="font-[Fraunces] text-3xl font-bold text-[#221b16]">{displayStats.totalTechnicians}</p>
            <p className="mt-1 text-xs font-semibold text-[#8c7564] uppercase tracking-wider">Certified Techs</p>
          </div>
          <div>
            <p className="font-[Fraunces] text-3xl font-bold text-[#221b16]">{displayStats.avgRating} ★</p>
            <p className="mt-1 text-xs font-semibold text-[#8c7564] uppercase tracking-wider">Average Rating</p>
          </div>
          <div>
            <p className="font-[Fraunces] text-3xl font-bold text-[#221b16]">{displayStats.totalReviews}</p>
            <p className="mt-1 text-xs font-semibold text-[#8c7564] uppercase tracking-wider">Customer Reviews</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center md:text-left md:flex md:items-end md:justify-between mb-10">
            <div>
              <h2 className="font-[Fraunces] text-3xl font-bold text-[#221b16]">Explore Categories</h2>
              <p className="mt-2 text-sm text-[#8c7564]">Find specialists for every repair type</p>
            </div>
            <Link to="/repair/technicians" className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#221b16] hover:underline">
              View all specialist types <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c: any) => (
              <Link
                key={c.id}
                to={`/repair/technicians?specialization=${encodeURIComponent(c.name)}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#e4d6c8] bg-white p-5 transition hover:border-[#221b16] hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f9f5f0] text-[#221b16] group-hover:bg-[#221b16] group-hover:text-[#f9f5f0] transition-colors">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-[#221b16] group-hover:text-[#a28672] transition-colors">{c.name}</h3>
                  <p className="mt-1 text-xs text-[#8c7564]">{c.description || 'Certified specialists'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white px-6 py-16 border-t border-[#e4d6c8]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-[Fraunces] text-3xl font-bold text-[#221b16]">How AtomDrops Repairs Works</h2>
            <p className="mt-3 text-sm text-[#8c7564]">A seamless, transparent and secure process from posting to completion</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, idx) => (
              <div key={idx} className="relative">
                <div className="font-[Fraunces] text-5xl font-extrabold text-[#f0e8df]">{s.num}</div>
                <h3 className="mt-4 font-semibold text-[#221b16]">{s.title}</h3>
                <p className="mt-2 text-xs text-[#6c5b4f] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features Banner */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-[#221b16] to-[#3a3028] text-[#f9f5f0] p-8 md:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-xl relative z-10">
            <h2 className="font-[Fraunces] text-3xl font-bold leading-tight">Peace of Mind, Guaranteed.</h2>
            <p className="mt-4 text-sm text-[#d7c7b8] leading-relaxed">
              Every job booked through AtomDrops is covered by our service guarantees. Customer funds are held securely in escrow and only released when you verify the work order is successfully resolved.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-medium">Safe Escrow Protection System</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-medium">Verified, Rated & Background-Checked Craftsmen</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-medium">Service warranty included on completed work orders</span>
              </div>
            </div>

            <div className="mt-8">
              <Link to="/repair/requests" className="inline-block rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#221b16] transition hover:bg-[#f9f5f0]">
                Book a Repair Now
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
            <Wrench className="h-80 w-80" />
          </div>
        </div>
      </section>

      {/* Featured Technicians */}
      <section className="bg-white px-6 py-16 border-t border-[#e4d6c8]">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-[Fraunces] text-3xl font-bold text-[#221b16]">Featured Technicians</h2>
              <p className="mt-2 text-sm text-[#8c7564]">Highly rated service experts available now</p>
            </div>
            <Link to="/repair/technicians" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#221b16] hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {technicians.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-[#8c7564]">
                No technicians active at the moment.
              </div>
            ) : (
              technicians.map((t: any) => (
                <div key={t.id} className="rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0]/50 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-[#e4d6c8]" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#221b16] text-sm font-bold text-[#f9f5f0]">
                          {t.user?.displayName?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm text-[#221b16]">{t.user?.displayName}</h3>
                        <p className="text-xs text-[#8c7564]">{t.specialization}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.level === 'EXPERT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {t.level}
                      </span>
                      <span className="rounded-full border border-[#d7c7b8] px-2.5 py-0.5 text-[10px] text-[#8c7564]">
                        ★ {t.ratingAvg ? t.ratingAvg.toFixed(1) : '5.0'} ({t.completedJobs || 0} jobs)
                      </span>
                    </div>

                    {t.bio && (
                      <p className="mt-3 text-xs text-[#6c5b4f] line-clamp-2 italic">
                        "{t.bio}"
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#e4d6c8]/60 flex items-center justify-between">
                    <span className="text-[11px] text-[#8c7564]">📍 {t.serviceArea || 'Dhaka'}</span>
                    <Link to={`/repair/technicians/${t.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#221b16] hover:underline">
                      Profile <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
