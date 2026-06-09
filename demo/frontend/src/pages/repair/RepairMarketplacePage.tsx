/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

export default function RepairMarketplacePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['repair-stats'],
    queryFn: () => apiClient.get('/api/repair/stats').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ['popular-technicians'],
    queryFn: () => apiClient.get('/api/technicians').then(r => Array.isArray(r.data) ? r.data.slice(0, 3) : []),
    staleTime: 120_000,
  })

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

  const displayStats = stats || {
    totalTechnicians: 12,
    totalRepairs: 45,
    completedRepairs: 42,
    avgRating: '4.9',
    totalReviews: 28,
  }

  const categoryIcons: Record<string, string> = {
    'Electronics': 'devices',
    'Appliances': 'kitchen',
    'Furniture': 'chair',
    'Automotive': 'directions_car',
    'Plumbing': 'plumbing',
    'Electrical': 'electrical_services',
    'HVAC': 'ac_unit',
    'Bicycles': 'pedal_bike',
    'Jewelry': 'diamond',
    'Clothing': 'checkroom',
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl" />

        <div className="max-w-container-max mx-auto px-margin-desktop text-center relative z-10">
          <h1 className="font-headline-lg text-headline-lg mb-8 max-w-3xl mx-auto">
            Expert repairs for your essential gear.
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary-container/20 blur-2xl group-hover:bg-primary-container/30 transition-all duration-500 rounded-full" />
            <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant p-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined ml-6 text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-4 font-body-lg text-body-lg text-on-surface placeholder-outline outline-none"
                placeholder="What needs fixing? (e.g. Broken iPhone screen)"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/repair/requests"
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              Post a Repair Request
            </Link>
            <Link
              to="/repair/technicians"
              className="bg-surface-container-lowest border border-outline-variant px-8 py-4 rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Browse Technicians
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Quick Category Selection ═══ */}
      <section className="py-12 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {(categories.length > 0 ? categories.slice(0, 6) : [
              { id: 1, name: 'Electronics' },
              { id: 2, name: 'Appliances' },
              { id: 3, name: 'Furniture' },
              { id: 4, name: 'Bicycles' },
              { id: 5, name: 'Jewelry' },
            ]).map((c: any) => (
              <Link
                key={c.id}
                to={`/repair/technicians?specialization=${encodeURIComponent(c.name)}`}
                className="flex flex-col items-center gap-4 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
                  <span className="material-symbols-outlined text-primary scale-125">
                    {categoryIcons[c.name] || 'build'}
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
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.completedRepairs}</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Repairs Done</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.totalTechnicians}</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Certified Techs</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.avgRating} ★</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Average Rating</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{displayStats.totalReviews}</p>
            <p className="mt-1 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Customer Reviews</p>
          </div>
        </div>
      </section>

      {/* ═══ Featured Technicians ═══ */}
      <section className="pb-section-gap pt-16">
        <div className="max-w-container-max mx-auto px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-headline-md text-headline-md mb-2">Top-Rated Pros</h2>
              <p className="text-on-surface-variant max-w-lg">
                Certified technicians with guaranteed workmanship and premium parts.
              </p>
            </div>
            <Link
              to="/repair/technicians"
              className="text-primary font-bold flex items-center gap-2 group hover:gap-4 transition-all duration-300"
            >
              View all experts <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {technicians.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">engineering</span>
                <p className="font-label-md text-label-md">No technicians active at the moment.</p>
              </div>
            ) : (
              technicians.map((t: any) => (
                <Link
                  key={t.id}
                  to={`/repair/technicians/${t.id}`}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] transition-all duration-500 flex flex-col"
                >
                  {/* Image header */}
                  <div className="h-48 relative overflow-hidden bg-surface-container">
                    {t.photoUrl ? (
                      <img
                        src={t.photoUrl}
                        alt={t.user?.displayName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-container/20">
                        <span className="material-symbols-outlined text-6xl text-primary/40">person</span>
                      </div>
                    )}
                    {/* Rating badge */}
                    <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-tertiary text-sm icon-fill">star</span>
                      <span className="text-label-md font-bold">{t.ratingAvg ? t.ratingAvg.toFixed(1) : '5.0'}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm">{t.user?.displayName}</h3>
                        <p className="text-on-surface-variant text-label-md">
                          {t.experienceYears ? `${t.experienceYears} years experience` : t.specialization}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.level === 'EXPERT'
                          ? 'bg-primary-container/20 text-primary-fixed-dim'
                          : 'bg-tertiary-container/20 text-tertiary'
                      }`}>
                        {t.level === 'EXPERT' ? 'Master Tech' : t.level}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {t.specialization && (
                        <span className="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">
                          {t.specialization}
                        </span>
                      )}
                      {t.certifications && (
                        <span className="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">
                          {t.certifications.split(',')[0]}
                        </span>
                      )}
                    </div>

                    <button className="w-full mt-auto bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary/90 transition-colors">
                      Get Quote
                    </button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══ Guarantee Section (Trust Strip) ═══ */}
      <section className="py-16 border-y border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
            <div>
              <h4 className="font-bold mb-1">AtomDrops Verified</h4>
              <p className="text-on-surface-variant text-body-md">
                Every technician undergoes a rigorous 50-point background and skills check.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">security</span>
            <div>
              <h4 className="font-bold mb-1">Repair Protection</h4>
              <p className="text-on-surface-variant text-body-md">
                All services include a 12-month AtomDrops ecosystem warranty on parts and labor.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-4xl">payments</span>
            <div>
              <h4 className="font-bold mb-1">Fixed-Price Quotes</h4>
              <p className="text-on-surface-variant text-body-md">
                No hidden fees. The price you agree on is the final price you pay, guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
