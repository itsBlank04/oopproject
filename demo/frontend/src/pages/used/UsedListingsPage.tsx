import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

type UsedListing = {
  id: number
  title: string
  description: string
  priceBdt?: number
  askingPriceBdt?: number
  status: string
  condition?: { label: string } | null
  conditionLevel?: { label: string } | null
  category: { name: string } | null
  seller: { displayName: string } | null
  images: { imageUrl: string }[]
  createdAt: string
}

export default function UsedListingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)

  const { data: listings = [], isLoading } = useQuery<UsedListing[]>({
    queryKey: ['used-listings', search],
    queryFn: () => apiClient.get('/api/used-listings', { params: { search: search || undefined } })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data.content || []
        return data.map((item: UsedListing) => ({
          ...item,
          askingPriceBdt: item.askingPriceBdt ?? item.priceBdt,
          conditionLevel: item.conditionLevel ?? item.condition,
        }))
      }),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const displayListings = listings.map(item => ({
    ...item,
    askingPriceBdt: item.askingPriceBdt ?? item.priceBdt,
    conditionLevel: item.conditionLevel ?? item.condition,
  }))

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Used Items</h1>
          {user ? (
            <Link to="/used-listings/new" className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
              + Sell an Item
            </Link>
          ) : (
            <button onClick={() => { toast('Sign in to sell an item', { icon: '🔒' }); navigate('/auth/login?redirect=/used-listings/new'); }} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
              + Sell an Item
            </button>
          )}
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
            {displayListings.map(item => (
              <div key={item.id} className="group rounded-2xl border border-[#e4d6c8] bg-white overflow-hidden transition hover:shadow-lg">
                <button type="button" onClick={() => setLightbox({
                  images: (item.images || []).map((i: any) => ({ url: i.imageUrl })),
                  index: 0
                })}
                  className="aspect-[4/3] bg-[#f0e8df] flex items-center justify-center text-sm text-[#a28672] w-full"
                >
                  {item.images?.[0] ? <img src={item.images[0].imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" /> : 'No image'}
                </button>
                <Link to={`/used-listings/${item.id}`} className="block p-4">
                  <p className="text-xs uppercase tracking-wider text-[#a28672]">{item.conditionLevel?.label || 'Used'} · {item.category?.name}</p>
                  <p className="mt-1 font-semibold text-[#221b16] group-hover:underline">{item.title}</p>
                  <p className="mt-1 text-lg font-bold text-[#221b16]">৳{item.askingPriceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                  <p className="mt-1 text-xs text-[#8c7564]">by {item.seller?.displayName}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
