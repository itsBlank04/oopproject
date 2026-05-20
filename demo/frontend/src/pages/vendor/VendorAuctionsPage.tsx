import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

export default function VendorAuctionsPage() {
  const { data: auctions = [], isLoading } = useQuery<any[]>({
    queryKey: ['vendor-auctions'],
    queryFn: () => apiClient.get('/api/vendor/auctions').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev ?? [],
  })

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Auctions</h1>
          <button className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">+ New Auction</button>
        </div>
        {isLoading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : auctions.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
            No auctions yet. Create your first auction!
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {auctions.map((a: any) => (
              <Link key={a.id} to={`/auctions/${a.id}`}
                className="block rounded-2xl border border-[#e4d6c8] bg-white p-5 transition hover:shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#221b16]">{a.title}</h3>
                    <p className="text-xs text-[#8c7564]">{a.type} · {a.lots?.length || 0} lots</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : a.status === 'CREATED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
