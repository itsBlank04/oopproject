import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

type Product = {
  id: number
  name: string
  description: string
  priceBdt: number
  status: string
  category: { id: number; name: string }
  vendor: { id: number; displayName: string }
  images: { id: number; imageUrl: string; sortOrder: number }[]
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/api/products/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-[#e4d6c8]" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#e4d6c8]" />
            <div className="h-10 w-64 animate-pulse rounded bg-[#e4d6c8]" />
            <div className="h-8 w-40 animate-pulse rounded bg-[#e4d6c8]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-red-500">Product not found</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-[#221b16] underline">
          Back to products
        </Link>
      </div>
    )
  }

  const images = product.images || []

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/products" className="text-sm text-[#6c5b4f] hover:underline">&larr; Back</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-[#f0e8df]">
              {images.length > 0 ? (
                <img src={images[selectedImage]?.imageUrl} alt={product.name}
                  className="h-full w-full object-cover transition-all duration-300" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-[#a28672]">No image</div>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === i ? 'border-[#221b16]' : 'border-[#e4d6c8] hover:border-[#b8a494]'
                    }`}>
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Product info */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#a28672]">
              {product.category?.name}
            </p>
            <h1 className="mt-2 font-[Fraunces] text-4xl text-[#221b16]">{product.name}</h1>
            <p className="mt-4 font-[Fraunces] text-3xl text-[#221b16]">
              ৳{product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>{product.status}</span>
              {images.length > 0 && (
                <span className="text-xs text-[#8c7564]">{images.length} photo{images.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-[#4f4035]">
              {product.description || 'No description available.'}
            </p>
            <div className="mt-6 rounded-xl border border-[#e4d6c8] bg-white p-4">
              <p className="text-sm text-[#6c5b4f]">
                Sold by <span className="font-semibold text-[#221b16]">{product.vendor?.displayName}</span>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await apiClient.post('/api/cart/items', { productId: product.id, qty: 1 })
                    queryClient.invalidateQueries({ queryKey: ['cart'] })
                    toast.success('Added to cart')
                  } catch (err: any) {
                    if (err.response?.status === 401 || err.response?.status === 403) {
                      toast.error('Please sign in first')
                    } else {
                      toast.error(err.response?.data?.error ?? 'Failed to add')
                    }
                  }
                }}
                className="flex-1 rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition"
              >
                Add to Cart — ৳{product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiClient.post(`/api/wishlist/${product.id}`)
                    toast.success('Added to wishlist')
                  } catch (err: any) {
                    toast.error(err.response?.data?.error ?? 'Failed')
                  }
                }}
                className="rounded-xl border border-[#d7c7b8] px-4 py-3 text-lg hover:bg-[#f0e8df] transition"
              >
                ♡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
