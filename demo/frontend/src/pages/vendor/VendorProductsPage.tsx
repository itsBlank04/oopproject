import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import { useConfirmAction } from '../../hooks/useConfirmAction'

type Category = { id: number; name: string }
type Product = { id: number; name: string; description?: string; priceBdt: number; status: string; shippingType: string; category: { id: number; name: string }; images?: { imageUrl: string }[] }
type Inventory = { id: number; stockQty: number; lowStockThreshold: number }

export default function VendorProductsPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const { askConfirm, showResult, Dialogs } = useConfirmAction()
  const [showForm, setShowForm] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [stockCache, setStockCache] = useState<Record<number, { stockQty: number; lowStockThreshold: number }>>({})
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)

  const { data: products = [], isFetching: productsFetching } = useQuery<Product[]>({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const res = await apiClient.get('/api/vendor/products')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!user,
    placeholderData: (prev) => prev,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then((r) => r.data.value ?? r.data),
    placeholderData: (prev) => prev,
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
      queryClient.invalidateQueries({ queryKey: ['products'] })
      resetForm()
      showResult('Product created', 'success')
    },
    onError: (err: any) => showResult(err.response?.data?.error ?? 'Failed to create', 'error'),
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
      queryClient.invalidateQueries({ queryKey: ['products'] })
      resetForm()
      showResult('Product updated', 'success')
    },
    onError: (err: any) => showResult(err.response?.data?.error ?? 'Failed to update', 'error'),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const stockTimers = useRef<Record<number, number | undefined>>({})

  const stockCacheRef = useRef(stockCache)
  stockCacheRef.current = stockCache

  const syncStock = useCallback((productId: number, stockQty: number, lowStockThreshold: number) => {
    apiClient.put(`/api/products/${productId}/inventory`, { stockQty, lowStockThreshold })
      .catch((err) => {
        setStockCache(prev => {
          const old = stockCacheRef.current[productId]
          return old ? { ...prev, [productId]: old } : prev
        })
        showResult(err.response?.data?.error ?? 'Failed to update stock', 'error')
      })
  }, [showResult])

  const setStock = (productId: number, stockQty: number, lowStockThreshold: number) => {
    setStockCache(prev => ({ ...prev, [productId]: { stockQty, lowStockThreshold } }))
    if (stockTimers.current[productId]) clearTimeout(stockTimers.current[productId])
    stockTimers.current[productId] = window.setTimeout(() => {
      delete stockTimers.current[productId]
      syncStock(productId, stockQty, lowStockThreshold)
    }, 400)
  }

  const updateShipping = useMutation({
    mutationFn: async ({ productId, shippingType }: { productId: number; shippingType: string }) => {
      await apiClient.put(`/api/vendor/products/${productId}/shipping`, { shippingType })
    },
    onMutate: async ({ productId, shippingType }) => {
      await queryClient.cancelQueries({ queryKey: ['vendor-products'] })
      const prev = queryClient.getQueryData<any[]>(['vendor-products'])
      if (prev) {
        queryClient.setQueryData(['vendor-products'], prev.map(p =>
          p.id === productId ? { ...p, shippingType } : p
        ))
      }
      return { prev }
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['vendor-products'], ctx.prev)
      showResult(err.response?.data?.error ?? err.message ?? 'Failed to update shipping', 'error')
    },
  })

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

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    lowStock: products.filter(p => stockFor(p).stockQty > 0 && stockFor(p).stockQty <= stockFor(p).lowStockThreshold).length,
    outOfStock: products.filter(p => stockFor(p).stockQty === 0).length,
  }

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  if (!hasRole('VENDOR')) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e4d6c8] bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e8df]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-[#221b16]">
              <path d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <p className="mt-4 font-semibold text-[#221b16]">Upgrade to Merchant to access products</p>
          <p className="mt-2 text-sm text-[#8c7564]">List products, manage inventory, and sell with your own shop page.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#6c5b4f]">
            <span className="rounded-full border border-[#e4d6c8] bg-[#f9f5f0] px-3 py-1">One-time 99 TK</span>
            <span className="rounded-full border border-[#e4d6c8] bg-[#f9f5f0] px-3 py-1">Instant activation</span>
          </div>
          <Link to="/profile#role-upgrade" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">
            Upgrade in Profile
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    )
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
          {(
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

      {/* Product grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#e4d6c8] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
              <svg className="h-8 w-8 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <p className="mt-4 font-semibold text-[#221b16]">No products yet</p>
            <p className="mt-1 text-sm text-[#8c7564]">Click "Add Product" to create your first listing</p>
            {productsFetching && (
              <p className="mt-2 text-xs text-[#b8a494]">Checking your catalog...</p>
            )}
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
                  <button type="button" onClick={() => setLightbox({
                    images: (p.images || []).map((i: any) => ({ url: i.imageUrl })),
                    index: 0
                  })}
                    className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[#f9f5f0]"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0].imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-10 w-10 text-[#d7c7b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                      </div>
                    )}
                  </button>

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
                      <button onClick={() => setStock(p.id, Math.max(0, s.stockQty - 1), s.lowStockThreshold)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#d7c7b8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                      </button>
                      <input
                        type="number" min="0"
                        value={s.stockQty}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0
                          setStock(p.id, val, s.lowStockThreshold)
                        }}
                        className="w-16 rounded-lg border border-[#d7c7b8] bg-[#faf8f6] px-2 py-1.5 text-center text-xs font-semibold text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button onClick={() => setStock(p.id, s.stockQty + 1, s.lowStockThreshold)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#d7c7b8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>
                      <div className="ml-auto flex items-center gap-1">
                        <label className="text-[10px] text-[#8c7564]">Alert:</label>
                        <input
                          type="number" min="0"
                          value={s.lowStockThreshold}
                          onChange={e => setStock(p.id, s.stockQty, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 rounded-lg border border-[#d7c7b8] bg-[#faf8f6] px-1.5 py-1 text-center text-[10px] text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Shipping toggle */}
                    <div className="mt-4 border-t border-[#f0e8e0] pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6c5b4f]">Shipping</span>
                        <button
                          onClick={() => updateShipping.mutate({
                            productId: p.id,
                            shippingType: p.shippingType === 'FREE' ? 'PAID' : 'FREE',
                          })}
                          disabled={updateShipping.isPending}
                          className={`relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full transition-all ${
                            p.shippingType === 'PAID' ? 'bg-[#221b16]' : 'bg-[#d7c7b8]'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                            p.shippingType === 'PAID' ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#8c7564]">
                        {p.shippingType === 'PAID' ? 'Customer pays shipping (60/100 tk)' : 'Free shipping'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => startEdit(p)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0] active:scale-[0.97]">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        Edit
                      </button>
                      <button onClick={() => askConfirm({
                        title: 'Delete product',
                        description: `Delete "${p.name}"? It will be soft-deleted and can be recovered later.`,
                        tone: 'danger',
                        label: 'Product deleted',
                        request: () => deleteProduct.mutateAsync(p.id),
                      })}
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
      {Dialogs}

      <style>{`
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-from-right {
          animation: slide-in-from-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
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
