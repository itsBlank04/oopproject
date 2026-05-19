import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

type Category = { id: number; name: string }
type Product = { id: number; name: string; description?: string; priceBdt: number; status: string; category: { id: number; name: string }; images?: { imageUrl: string }[] }
type Inventory = { id: number; stockQty: number; lowStockThreshold: number }

export default function VendorProductsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [stockCache, setStockCache] = useState<Record<number, { stockQty: number; lowStockThreshold: number }>>({})

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const res = await apiClient.get('/api/products')
      return Array.isArray(res.data) ? res.data : res.data?.content ?? []
    },
    enabled: !!user,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then((r) => r.data.value ?? r.data),
  })

  const fetchInventoryBatch = useCallback(async (productIds: number[]) => {
    const results = await Promise.allSettled(
      productIds.map(id =>
        apiClient.get(`/api/products/${id}/inventory`).then(r => ({ id, data: r.data as Inventory }))
      )
    )
    const cache: Record<number, { stockQty: number; lowStockThreshold: number }> = {}
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.data) {
        cache[r.value.id] = { stockQty: r.value.data.stockQty, lowStockThreshold: r.value.data.lowStockThreshold }
      }
    }
    setStockCache(prev => ({ ...prev, ...cache }))
  }, [])

  useEffect(() => {
    if (products && products.length > 0) {
      fetchInventoryBatch(products.map(p => p.id))
    }
  }, [products, fetchInventoryBatch])

  const createProduct = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/products', {
        name: form.name, description: form.description,
        priceBdt: parseFloat(form.priceBdt), category: { id: parseInt(form.categoryId) },
      })
      const pid = res.data.id
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${pid}/images`, { imageUrl: url }).catch(() => {})
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      resetForm()
      toast.success('Product created')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to create'),
  })

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!editProductId) return
      await apiClient.put(`/api/products/${editProductId}`, {
        name: form.name, description: form.description,
        priceBdt: parseFloat(form.priceBdt), category: { id: parseInt(form.categoryId) },
      })
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${editProductId}/images`, { imageUrl: url }).catch(() => {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      resetForm()
      toast.success('Product updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to update'),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      setDeleteConfirmId(null)
      toast.success('Product removed')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to delete'),
  })

  const updateStock = async (productId: number, stockQty: number, lowStockThreshold: number) => {
    try {
      await apiClient.put(`/api/products/${productId}/inventory`, { stockQty, lowStockThreshold })
      setStockCache(prev => ({ ...prev, [productId]: { stockQty, lowStockThreshold } }))
      toast.success('Stock updated')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update stock')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditProductId(null)
    setForm({ name: '', description: '', priceBdt: '', categoryId: '' })
    setImageUrls([])
  }

  const startEdit = (p: Product) => {
    setEditProductId(p.id)
    setShowForm(true)
    setForm({
      name: p.name,
      description: p.description || '',
      priceBdt: p.priceBdt.toString(),
      categoryId: p.category?.id?.toString() || '',
    })
    setImageUrls([])
  }

  const stockFor = (p: Product) => stockCache[p.id] || { stockQty: 0, lowStockThreshold: 5 }

  const stockLevel = (p: Product): { label: string; color: string; barColor: string; percent: number } => {
    const s = stockFor(p)
    const max = Math.max(s.stockQty, s.lowStockThreshold * 2, 10)
    const percent = Math.min((s.stockQty / max) * 100, 100)
    if (s.stockQty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', barColor: 'bg-red-500', percent: 0 }
    if (s.stockQty <= s.lowStockThreshold) return { label: `Low (${s.stockQty})`, color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500', percent }
    return { label: `${s.stockQty} in stock`, color: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500', percent }
  }

  const stats = products ? {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    lowStock: products.filter(p => stockFor(p).stockQty > 0 && stockFor(p).stockQty <= stockFor(p).lowStockThreshold).length,
    outOfStock: products.filter(p => stockFor(p).stockQty === 0).length,
  } : null

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
      <div className="border-b border-[#e4d6c8] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-[Fraunces] text-3xl tracking-tight text-[#221b16]">Products</h1>
              <p className="mt-1 text-sm text-[#8c7564]">Manage your inventory, stock levels, and listings</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(!showForm) }}
              className="flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a2d24] active:scale-[0.97]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {showForm ? 'Cancel' : 'Add Product'}
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Products', value: stats.total, color: 'text-[#221b16]', bg: 'bg-[#f9f5f0]' },
                { label: 'Active', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Low Stock', value: stats.lowStock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Out of Stock', value: stats.outOfStock, color: stats.outOfStock > 0 ? 'text-red-600' : 'text-[#8c7564]', bg: stats.outOfStock > 0 ? 'bg-red-50' : 'bg-[#f9f5f0]' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl ${s.bg} px-4 py-3`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-[#8c7564]">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit slide-over */}
      {(showForm || editProductId) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-from-right">
            <div className="sticky top-0 z-10 border-b border-[#e4d6c8] bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">{editProductId ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={resetForm} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c7564] hover:bg-[#f9f5f0] transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-[#6c5b4f] uppercase tracking-wider">Product Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Wireless Bluetooth Headphones"
                  className="mt-1.5 w-full rounded-xl border border-[#d7c7b8] bg-[#faf8f6] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white focus:ring-1 focus:ring-[#221b16]/10" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c5b4f] uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  placeholder="Describe your product..."
                  className="mt-1.5 w-full rounded-xl border border-[#d7c7b8] bg-[#faf8f6] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white focus:ring-1 focus:ring-[#221b16]/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#6c5b4f] uppercase tracking-wider">Price (৳)</label>
                  <input type="number" step="0.01" value={form.priceBdt} onChange={e => setForm({ ...form, priceBdt: e.target.value })}
                    placeholder="0.00"
                    className="mt-1.5 w-full rounded-xl border border-[#d7c7b8] bg-[#faf8f6] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white focus:ring-1 focus:ring-[#221b16]/10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6c5b4f] uppercase tracking-wider">Category</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#d7c7b8] bg-[#faf8f6] px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16] focus:bg-white focus:ring-1 focus:ring-[#221b16]/10">
                    <option value="">Select</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c5b4f] uppercase tracking-wider">Photos</label>
                <div className="mt-1.5">
                  <MediaUploader
                    folder="products" label="Upload photos"
                    maxFiles={10} maxSizeMB={10} allowVideo={false} onUpload={setImageUrls}
                  />
                </div>
              </div>
              <button onClick={() => editProductId ? updateProduct.mutate() : createProduct.mutate()}
                disabled={createProduct.isPending || updateProduct.isPending || !form.name || !form.priceBdt || !form.categoryId}
                className="w-full rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-[#f9f5f0] transition hover:bg-[#3a2d24] disabled:opacity-40 active:scale-[0.98]">
                {createProduct.isPending || updateProduct.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving...
                  </span>
                ) : editProductId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative rounded-2xl bg-white p-6 shadow-2xl w-[360px] max-w-[90vw]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <p className="mt-4 text-center font-semibold text-[#221b16]">Remove Product?</p>
            <p className="mt-1 text-center text-sm text-[#8c7564]">This will soft-delete the product. It can be recovered later.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl border border-[#d7c7b8] py-2.5 text-sm font-semibold text-[#221b16] hover:bg-[#f9f5f0] transition">
                Cancel
              </button>
              <button onClick={() => deleteProduct.mutate(deleteConfirmId)} disabled={deleteProduct.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50">
                {deleteProduct.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {productsLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-white p-5 animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-gray-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
                <div className="mt-4 h-2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#e4d6c8] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
              <svg className="h-8 w-8 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <p className="mt-4 font-semibold text-[#221b16]">No products yet</p>
            <p className="mt-1 text-sm text-[#8c7564]">Click "Add Product" to create your first listing</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => {
              const s = stockFor(p)
              const level = stockLevel(p)
              return (
                <div key={p.id} className="group relative rounded-2xl bg-white shadow-sm ring-1 ring-[#e4d6c8]/60 transition-all hover:shadow-md hover:ring-[#d7c7b8]">
                  {/* Status badge */}
                  <div className="absolute left-3 top-3 z-10">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>{p.status}</span>
                  </div>

                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden rounded-t-2xl bg-[#f9f5f0]">
                    {p.images?.[0] ? (
                      <img src={p.images[0].imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-10 w-10 text-[#d7c7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-[#221b16]">{p.name}</h3>
                        <p className="mt-0.5 text-xs text-[#8c7564]">{p.category?.name}</p>
                      </div>
                      <p className="shrink-0 font-bold text-[#221b16]">৳{p.priceBdt.toLocaleString('en-BD')}</p>
                    </div>

                    {/* Stock bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${level.color}`}>{level.label}</span>
                        <span className="text-[#8c7564]">Low: {s.lowStockThreshold}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full transition-all duration-500 ${level.barColor}`} style={{ width: `${level.percent}%` }} />
                      </div>
                    </div>

                    {/* Stock controls */}
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => updateStock(p.id, Math.max(0, s.stockQty - 1), s.lowStockThreshold)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7c7b8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                      </button>
                      <input
                        type="number" min="0"
                        value={s.stockQty}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0
                          updateStock(p.id, val, s.lowStockThreshold)
                        }}
                        className="w-16 rounded-lg border border-[#d7c7b8] bg-[#faf8f6] px-2 py-1.5 text-center text-xs font-semibold text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateStock(p.id, s.stockQty + 1, s.lowStockThreshold)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7c7b8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>
                      <div className="ml-auto flex items-center gap-1">
                        <label className="text-[10px] text-[#8c7564]">Alert:</label>
                        <input
                          type="number" min="0"
                          value={s.lowStockThreshold}
                          onChange={e => updateStock(p.id, s.stockQty, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 rounded-lg border border-[#d7c7b8] bg-[#faf8f6] px-1.5 py-1 text-center text-[10px] text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => startEdit(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0] active:scale-[0.97]">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        Edit
                      </button>
                      <button onClick={() => setDeleteConfirmId(p.id)}
                        className="flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 active:scale-[0.97]">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-from-right {
          animation: slide-in-from-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
