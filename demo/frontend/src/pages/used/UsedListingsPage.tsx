import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

type UsedListing = {
  id: number
  title: string
  description: string
  askingPriceBdt: number
  status: string
  conditionLevel: { label: string } | null
  category: { name: string } | null
  seller: { displayName: string } | null
  images: { imageUrl: string }[]
  createdAt: string
}

export default function UsedListingsPage() {
  const [search, setSearch] = useState('')

  const { data: listings = [], isLoading } = useQuery<UsedListing[]>({
    queryKey: ['used-listings', search],
    queryFn: () => apiClient.get('/api/used-listings', { params: { search: search || undefined } })
      .then(r => Array.isArray(r.data) ? r.data : r.data.content || []),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Used Items</h1>
          <Link to="/used-listings/new" className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
            + Sell an Item
          </Link>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search used items..."
          className="mt-6 w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-3 text-sm outline-none focus:border-[#221b16]"
        />
        {isLoading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="mt-12 text-center text-[#8c7564]">No used items found. Be the first to list one!</div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(item => (
              <Link key={item.id} to={`/used-listings/${item.id}`}
                className="group rounded-2xl border border-[#e4d6c8] bg-white overflow-hidden transition hover:shadow-lg">
                <div className="aspect-[4/3] bg-[#f0e8df] flex items-center justify-center text-sm text-[#a28672]">
                  {item.images?.[0] ? <img src={item.images[0].imageUrl} alt={item.title} className="h-full w-full object-cover" /> : 'No image'}
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wider text-[#a28672]">{item.conditionLevel?.label || 'Used'} · {item.category?.name}</p>
                  <p className="mt-1 font-semibold text-[#221b16] group-hover:underline">{item.title}</p>
                  <p className="mt-1 text-lg font-bold text-[#221b16]">৳{item.askingPriceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                  <p className="mt-1 text-xs text-[#8c7564]">by {item.seller?.displayName}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
