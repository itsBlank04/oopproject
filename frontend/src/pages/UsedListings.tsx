import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import type { UsedListing, Category } from '@/types'
import { useState } from 'react'

export default function UsedListings() {
  const { user } = useAuth()
  const [categoryId, setCategoryId] = useState<number | ''>('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  })

  const { data: listings, isLoading } = useQuery({
    queryKey: ['used-listings', categoryId],
    queryFn: () => {
      const q = categoryId ? `?categoryId=${categoryId}` : ''
      return api.get<UsedListing[]>(`/used-listings${q}`)
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-ink-950">Used Marketplace</h1>
        {user && (
          <Link to="/used/new" className="btn btn-primary">
            List Used Item
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-8">
        <select
          className="input sm:max-w-xs"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/used/${listing.id}`}
              className="card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-cream-100 flex items-center justify-center text-ink-300 text-4xl">
                {listing.images?.[0]?.url ? (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '↻'
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-ink-950 truncate">{listing.title}</h3>
                <p className="mt-1 text-sm text-ink-400 truncate">{listing.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-teal-700">৳{Number(listing.priceBdt).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.warrantyFlag === 'YES' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {listing.warrantyFlag === 'YES' ? '✓ Warranty' : '✗ No warranty'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No used listings yet</p>
        </div>
      )}
    </div>
  )
}
