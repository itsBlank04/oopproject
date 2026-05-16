import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useState, useMemo } from 'react'
import type { Auction } from '@/types'

const STATUS_TABS = ['All', 'ACTIVE', 'PREPARING', 'EXTENDED', 'CLOSED', 'CREATED'] as const
const CATEGORIES = ['All', 'Appliances', 'Audio & Video', 'Computers', 'Furniture', 'Miscellaneous', 'Vehicles'] as const
const PAGE_SIZE = 8

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-600',
  PREPARING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXTENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-teal-100 text-teal-700',
}

export default function Auctions() {
  const { role } = useAuth()
  const isVendor = role === 'VENDOR'

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [page, setPage] = useState(0)

  const { data: auctions, isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => api.get<Auction[]>('/auctions'),
  })

  const filtered = useMemo(() => {
    if (!auctions) return []
    return auctions.filter((a) => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false
      if (categoryFilter !== 'All' && !a.title.toLowerCase().includes(categoryFilter.toLowerCase())) return false
      return true
    })
  }, [auctions, statusFilter, categoryFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink-950">Auctions</h1>
        {isVendor && (
          <Link to="/auctions/new" className="btn btn-primary">Create Auction</Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setPage(0) }}
            className={`btn btn-sm transition-all ${statusFilter === tab ? 'btn-primary' : 'btn-ghost'}`}
          >
            {tab === 'All' ? 'All Lots' : tab === 'PREPARING' ? 'Upcoming' : tab}
            {tab !== 'All' && auctions && (
              <span className="ml-1.5 text-[0.65rem] opacity-70">
                ({auctions.filter(a => a.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <select
          className="input max-w-xs"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      {/* Results info */}
      <p className="text-sm text-ink-400 mb-4">
        {filtered.length} auction{filtered.length !== 1 ? 's' : ''} found
        {statusFilter !== 'All' && <span> · Status: {statusFilter}</span>}
        {categoryFilter !== 'All' && <span> · Category: {categoryFilter}</span>}
      </p>

      {/* Auction grid */}
      {paged.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No auctions match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paged.map((auction) => {
            const endTime = new Date(auction.endTime)
            const isEnded = endTime.getTime() < Date.now()
            const statusCls = statusColors[auction.status] || 'bg-gray-100 text-gray-600'

            return (
              <Link
                key={auction.id}
                to={`/auctions/${auction.id}`}
                className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl text-ink-950 group-hover:text-teal-600 transition-colors">{auction.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider whitespace-nowrap ${statusCls}`}>
                    {auction.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-ink-500">
                  <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-600 text-xs font-medium">{auction.type}</span>
                  {auction.vendorName && <span>by {auction.vendorName}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-ink-400">
                    {isEnded ? 'Ended' : 'Ends'}: {endTime.toLocaleDateString()} {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {auction.reservePriceBdt && (
                    <span className="text-teal-600 font-medium">Reserve: ৳{Number(auction.reservePriceBdt).toLocaleString()}</span>
                  )}
                </div>
                {auction.lots?.length > 0 && (
                  <p className="mt-2 text-xs text-ink-400">{auction.lots.length} lot{auction.lots.length !== 1 ? 's' : ''}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            className="btn btn-ghost btn-sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
