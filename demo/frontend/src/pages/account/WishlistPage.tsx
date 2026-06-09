import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const queryClient = useQueryClient()
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.get('/api/wishlist').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev ?? [],
  })

  const removeMutation = useMutation({
    mutationFn: (productId: number) => apiClient.delete(`/api/wishlist/${productId}`),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const prev = queryClient.getQueryData<any[]>(['wishlist'])
      if (prev) queryClient.setQueryData(['wishlist'], prev.filter(i => i.product?.id !== productId))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['wishlist'], ctx.prev)
      toast.error('Failed')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
    onSuccess: () => toast.success('Removed from wishlist'),
  })

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Wishlist</h1>
        {isLoading ? (
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
                <button type="button" onClick={() => setLightboxUrl(w.product?.images?.[0]?.imageUrl)}
                  className="h-20 w-20 rounded-xl bg-[#f9f5f0] flex items-center justify-center text-xs text-[#8c7564] shrink-0 overflow-hidden">
                  {w.product?.images?.[0] ? <img src={w.product.images[0].imageUrl} loading="lazy" className="h-full w-full rounded-xl object-cover" /> : 'No img'}
                </button>
                <div className="flex-1">
                  <Link to={`/products/${w.product?.id}`} className="font-semibold text-[#221b16] hover:underline">{w.product?.name}</Link>
                  <p className="mt-1 text-lg font-bold text-[#221b16]">৳{w.product?.priceBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={() => removeMutation.mutate(w.product?.id)} className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightboxUrl && (
        <ImageLightbox
          images={[{ url: lightboxUrl }]}
          initialIndex={0}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  )
}
