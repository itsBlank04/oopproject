import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Search, Briefcase, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react'

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
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10 text-[#221b16]">
      <div className="mx-auto max-w-6xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#8c7564] font-medium mb-6">
          <Link to="/repair" className="hover:text-[#221b16] transition">Repair Hub</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#221b16]">Technicians</span>
        </div>

        {/* Heading */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h1 className="font-[Fraunces] text-3xl font-bold text-[#221b16] sm:text-4xl">Expert Craftsmen</h1>
          <p className="mt-2 text-xs text-[#8c7564]">Find verified, background-checked repair specialists in Bangladesh</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl border border-[#e4d6c8] bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Category Quick Tags */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {specs.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSpec(s.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition ${
                    spec === s.value
                      ? 'bg-[#221b16] text-[#f9f5f0]'
                      : 'border border-[#d7c7b8] text-[#221b16] bg-transparent hover:bg-[#f9f5f0]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80 flex items-center border border-[#d7c7b8] bg-[#f9f5f0] rounded-xl px-3 py-2 text-xs">
              <Search className="h-4 w-4 text-[#8c7564]" />
              <input
                type="text"
                placeholder="Search by name, specialization, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent ml-2 text-[#221b16] placeholder:text-[#8a7a6a] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tech list container */}
        {isLoading && filteredTechnicians.length === 0 ? (
          <div className="mt-16 text-center text-xs text-[#8c7564]">
            <div className="animate-spin h-5 w-5 border-2 border-[#221b16] border-t-transparent rounded-full mx-auto mb-4"></div>
            Searching active craftsmen ledger...
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="mt-16 text-center text-xs text-[#8c7564]">
            No technicians matching criteria found. Try resetting filters.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTechnicians.map((t: any) => (
              <div key={t.id} className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-[#221b16]/40 transition duration-200">
                <div>
                  <div className="flex items-start justify-between gap-4">
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
                    
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      t.level === 'EXPERT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {t.level || 'VERIFIED'}
                    </span>
                  </div>

                  {/* Rating / Completed jobs stats row */}
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#6c5b4f]">
                    <span className="flex items-center gap-1 rounded bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 font-medium">
                      ★ {t.ratingAvg ? t.ratingAvg.toFixed(1) : '5.0'}
                    </span>
                    <span className="flex items-center gap-1 rounded bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 font-medium">
                      <Briefcase className="h-3 w-3" /> {t.completedJobs || 0} repairs
                    </span>
                    <span className="flex items-center gap-1 rounded bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 font-medium">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> {t.experienceYears || 3}+ yrs exp.
                    </span>
                  </div>

                  {t.bio && (
                    <p className="mt-4 text-xs text-[#6c5b4f] line-clamp-3 leading-relaxed italic">
                      "{t.bio}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#e4d6c8]/60 flex items-center justify-between gap-4">
                  {t.serviceArea && (
                    <span className="text-[10px] text-[#8c7564] flex items-center gap-1 max-w-[120px] truncate" title={t.serviceArea}>
                      📍 {t.serviceArea}
                    </span>
                  )}
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/repair/technicians/${t.id}`}
                      className="rounded-xl border border-[#d7c7b8] px-3.5 py-2 text-[11px] font-semibold text-[#221b16] hover:bg-[#f9f5f0] transition text-center"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/repair/requests?open=true&techId=${t.id}&techName=${encodeURIComponent(t.user?.displayName || '')}`}
                      className="rounded-xl bg-[#221b16] px-3.5 py-2 text-[11px] font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition text-center inline-flex items-center gap-1"
                    >
                      Book <ArrowRight className="h-3 w-3" />
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
