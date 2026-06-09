/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

export default function TechniciansPage() {
  const [searchParams] = useSearchParams()
  const initialSpec = searchParams.get('specialization') || ''
  const initialSearch = searchParams.get('search') || ''

  const [spec, setSpec] = useState(initialSpec)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const { data: technicians = [], isLoading } = useQuery<any[]>({
    queryKey: ['technicians', spec],
    queryFn: () => apiClient.get('/api/technicians', { params: spec ? { specialization: spec } : {} })
      .then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
  })

  const specs = [
    { name: 'All', value: '' },
    { name: 'Electronics', value: 'Electronics' },
    { name: 'Appliances', value: 'Appliances' },
    { name: 'Plumbing', value: 'Plumbing' },
    { name: 'Electrical', value: 'Electrical' },
    { name: 'AC & Cooling', value: 'Air Conditioner' },
    { name: 'Mobile & Laptop', value: 'Mobile/Laptop' }
  ]

  // Filter technicians on client side for search query (by name or specialized category)
  const filteredTechnicians = technicians.filter((t: any) => {
    const nameMatch = t.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    const specMatch = t.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    const bioMatch = t.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || specMatch || bioMatch
  })

  return (
    <div className="min-h-screen bg-background px-margin-mobile md:px-margin-desktop py-12 text-on-surface">
      <div className="mx-auto max-w-container-max">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-label-sm text-on-surface-variant font-medium mb-8">
          <Link to="/repair" className="hover:text-primary transition">Repair Hub</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Technicians</span>
        </div>

        {/* Heading */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-sm text-on-surface mb-2 font-bold">Expert Craftsmen</h1>
          <p className="text-body-md text-on-surface-variant">Find verified, background-checked repair specialists in Bangladesh</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Category Quick Tags */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {specs.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSpec(s.value)}
                  className={`rounded-full px-4 py-2 text-label-sm font-semibold transition ${
                    spec === s.value
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'border border-outline-variant text-on-surface-variant bg-transparent hover:bg-surface-container-low'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-96 flex items-center border border-outline-variant bg-surface-bright rounded-xl px-4 py-3 text-body-md">
              <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by name, specialization..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-on-surface placeholder:text-outline outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tech list container */}
        {isLoading && filteredTechnicians.length === 0 ? (
          <div className="mt-16 text-center text-body-md text-on-surface-variant">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            Searching active craftsmen ledger...
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="mt-16 text-center text-body-md text-on-surface-variant py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            No technicians matching criteria found. Try resetting filters.
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTechnicians.map((t: any) => (
              <div key={t.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-sm flex flex-col justify-between hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] hover:border-primary-container transition-all duration-300">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover border border-outline-variant shadow-sm" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary text-base font-bold">
                          {t.user?.displayName?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-body-md text-on-surface">{t.user?.displayName}</h3>
                        <p className="text-label-md text-on-surface-variant">{t.specialization}</p>
                      </div>
                    </div>
                    
                    <span className={`rounded-full px-3 py-1 text-label-sm font-bold ${
                      t.level === 'EXPERT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.level === 'EXPERT' ? 'Master Tech' : (t.level || 'VERIFIED')}
                    </span>
                  </div>

                  {/* Rating / Completed jobs stats row */}
                  <div className="mt-6 flex flex-wrap gap-2 text-label-sm">
                    <span className="flex items-center gap-1 rounded bg-surface-container-low px-2.5 py-1 font-medium border border-outline-variant/10 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-tertiary icon-fill">star</span>
                      {t.ratingAvg ? t.ratingAvg.toFixed(1) : '5.0'}
                    </span>
                    <span className="flex items-center gap-1 rounded bg-surface-container-low px-2.5 py-1 font-medium border border-outline-variant/10 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">handyman</span>
                      {t.completedJobs || 0} repairs
                    </span>
                    <span className="flex items-center gap-1 rounded bg-surface-container-low px-2.5 py-1 font-medium border border-outline-variant/10 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                      {t.experienceYears || 3}+ yrs exp
                    </span>
                  </div>

                  {t.bio && (
                    <p className="mt-5 text-body-md text-on-surface-variant line-clamp-3 leading-relaxed italic">
                      "{t.bio}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                  {t.serviceArea && (
                    <span className="text-label-sm text-on-surface-variant flex items-center gap-1 max-w-[130px] truncate" title={t.serviceArea}>
                      <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                      {t.serviceArea}
                    </span>
                  )}
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/repair/technicians/${t.id}`}
                      className="rounded-xl border border-outline-variant px-4 py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition text-center"
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/repair/requests?open=true&techId=${t.id}&techName=${encodeURIComponent(t.user?.displayName || '')}`}
                      className="rounded-xl bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition text-center inline-flex items-center gap-1 shadow-sm hover:scale-[1.02] active:scale-95"
                    >
                      Book <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

