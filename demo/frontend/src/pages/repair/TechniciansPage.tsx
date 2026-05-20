import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

export default function TechniciansPage() {
  const [spec, setSpec] = useState('')

  const { data: technicians = [], isLoading } = useQuery<any[]>({
    queryKey: ['technicians', spec],
    queryFn: () => apiClient.get('/api/technicians', { params: spec ? { specialization: spec } : {} })
      .then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const specs = ['', 'Electronics', 'Electrical', 'Furniture', 'Appliances']

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Repair Technicians</h1>
        <p className="mt-2 text-sm text-[#8c7564]">Find certified technicians for your repair needs</p>
        <div className="mt-6 flex gap-2">
          {specs.map(s => (
            <button key={s} onClick={() => setSpec(s)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${spec === s ? 'bg-[#221b16] text-[#f9f5f0]' : 'border border-[#d7c7b8] text-[#221b16] hover:bg-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {isLoading && technicians.length === 0 ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : technicians.length === 0 ? (
          <div className="mt-12 text-center text-[#8c7564]">No technicians found.</div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {technicians.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#221b16] text-sm font-bold text-[#f9f5f0]">
                    {t.user?.displayName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#221b16]">{t.user?.displayName}</p>
                    <p className="text-xs text-[#8c7564]">{t.specialization}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.level === 'EXPERT' ? 'bg-amber-100 text-amber-700' : t.level === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.level}
                  </span>
                  <span className="rounded-full border border-[#d7c7b8] px-3 py-1 text-xs text-[#8c7564]">
                    {t.completedJobs || 0} jobs
                  </span>
                </div>
                {t.serviceArea && <p className="mt-3 text-xs text-[#6c5b4f]">📍 {t.serviceArea}</p>}
                <Link to={`/repair/request?tech=${t.id}`} className="mt-4 block rounded-xl bg-[#221b16] px-4 py-2.5 text-center text-sm font-semibold text-[#f9f5f0]">
                  Request Repair
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
