import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import ImageLightbox from '../../components/ImageLightbox'
import ProductCard from '../../components/ProductCard'

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
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
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
            <ProductCard
              key={product.id}
              product={product}
              onImageClick={(images, index) => setLightbox({ images, index })}
              priceFractionDigits={2}
            />
          ))}
        </div>
      )}
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
