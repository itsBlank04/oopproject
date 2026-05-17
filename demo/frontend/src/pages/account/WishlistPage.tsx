import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiClient.get('/api/wishlist')
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const remove = async (productId: number) => {
    try {
      await apiClient.delete(`/api/wishlist/${productId}`)
      setItems(items.filter(i => i.product?.id !== productId))
      toast.success('Removed from wishlist')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Wishlist</h1>
        {loading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center">
            <p className="text-lg text-[#8c7564]">Your wishlist is empty</p>
            <Link to="/products" className="mt-4 inline-block rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 rounded-2xl border border-[#e4d6c8] bg-white p-4">
                <div className="h-20 w-20 rounded-xl bg-[#f0e8df] flex items-center justify-center text-xs text-[#a28672]">
                  {w.product?.images?.[0] ? <img src={w.product.images[0].imageUrl} className="h-full w-full rounded-xl object-cover" /> : 'No img'}
                </div>
                <div className="flex-1">
                  <Link to={`/products/${w.product?.id}`} className="font-semibold text-[#221b16] hover:underline">{w.product?.name}</Link>
                  <p className="mt-1 text-lg font-bold text-[#221b16]">৳{w.product?.priceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={() => remove(w.product?.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
