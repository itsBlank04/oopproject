import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

type Product = {
  id: number
  name: string
  description: string
  priceBdt: number
  status: string
  category: { id: number; name: string }
  images: { id: number; imageUrl: string; sortOrder: number }[]
}

type PageResponse = {
  content: Product[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export default function ProductListPage() {
  const { data, isLoading, error } = useQuery<PageResponse>({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/products').then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Products</h1>
      {isLoading && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-[#e4d6c8]" />
          ))}
        </div>
      )}
      {error && (
        <p className="mt-8 text-red-500">Failed to load products</p>
      )}
      {data && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.content.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group rounded-2xl border border-[#e4d6c8] bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {product.images.length > 0 ? (
                <img
                  src={product.images[0].imageUrl}
                  alt={product.name}
                  className="h-48 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl bg-[#f9f5f0] text-[#a28672]">
                  No image
                </div>
              )}
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#a28672]">
                {product.category?.name}
              </p>
              <p className="mt-1 font-semibold text-[#221b16] group-hover:underline">
                {product.name}
              </p>
              <p className="mt-1 font-[Fraunces] text-xl">
                ৳{product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
