import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import type { Product, Category } from '@/types'

export default function Products() {
  const { user, role } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  })

  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', '12')
  if (debouncedSearch) params.set('q', debouncedSearch)
  if (categoryId !== '') params.set('categoryId', String(categoryId))

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', page, debouncedSearch, categoryId],
    queryFn: () => api.get<{ content: Product[]; totalPages: number }>(`/products?${params}`),
  })

  const isVendor = role === 'VENDOR'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-ink-950">Products</h1>
        {isVendor && (
          <Link to="/products/new" className="btn btn-primary">
            Add Product
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          className="input sm:max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        />
        <select
          className="input sm:max-w-xs"
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(0) }}
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
      ) : products?.content.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.content.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="card overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-[4/3] bg-cream-100 flex items-center justify-center text-ink-300 text-4xl">
                  {product.images?.[0] ? (
                    <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    '✦'
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-ink-950 group-hover:text-teal-600 transition-colors truncate">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-400 truncate">{product.description}</p>
                  <p className="mt-2 font-semibold text-teal-700">
                    ৳{Number(product.priceBdt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {products && products.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="flex items-center text-sm text-ink-500 px-3">
                Page {page + 1} of {products.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(products.totalPages - 1, page + 1))}
                disabled={page >= products.totalPages - 1}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
