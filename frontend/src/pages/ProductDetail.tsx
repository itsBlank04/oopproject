import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [qty, setQty] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: !!id,
  })

  const isOwner = !!user && !!product && user.id === product.vendor.id
  const isVendor = role === 'VENDOR'

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      toast.success('Product updated')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted')
      navigate('/products')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleBuy = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setOrdering(true)
    try {
      await api.post('/orders', { items: [{ productId: Number(id), qty }] })
      toast.success('Order placed!')
      navigate('/orders')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Order failed'
      toast.error(msg)
    } finally {
      setOrdering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-ink-400">Product not found</p>
        <Link to="/products" className="btn btn-secondary mt-4">Back to products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/products" className="text-sm text-teal-600 hover:underline mb-6 inline-block">
        &larr; Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-[4/3] bg-cream-100 rounded-xl flex items-center justify-center text-ink-300 text-6xl overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            '✦'
          )}
        </div>

        <div>
          {editing ? (
            <div className="space-y-4">
              <h1 className="font-display text-3xl text-ink-950">Edit Product</h1>
              <div>
                <label className="label">Name</label>
                <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div>
                <label className="label">Price (৳)</label>
                <input className="input" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => updateMutation.mutate({ name: editName, description: editDesc || null, priceBdt: Number(editPrice), categoryId: product.category.id })} disabled={updateMutation.isPending}>
                  Save
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-ink-950">{product.name}</h1>
              <p className="mt-2 text-3xl font-bold text-teal-700">৳{Number(product.priceBdt).toLocaleString()}</p>

              {product.description && (
                <p className="mt-4 text-ink-600 leading-relaxed">{product.description}</p>
              )}

              {isOwner && (
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditName(product.name); setEditDesc(product.description || ''); setEditPrice(String(product.priceBdt)); setEditing(true) }}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm('Delete this product?')) deleteMutation.mutate() }} disabled={deleteMutation.isPending}>
                    Delete
                  </button>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <label className="text-sm text-ink-500">Qty:</label>
                <select className="input w-20" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBuy}
                disabled={ordering}
                className="btn btn-primary btn-lg mt-6 w-full sm:w-auto"
              >
                {ordering ? 'Processing...' : 'Buy Now — Dummy Payment'}
              </button>

              {!user && (
                <p className="mt-3 text-sm text-ink-400">
                  <Link to="/login" className="text-teal-600 hover:underline">Sign in</Link> to purchase
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
