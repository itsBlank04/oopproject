import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

type Category = { id: number; name: string }
type Product = { id: number; name: string; description?: string; priceBdt: number; status: string; category: { id: number; name: string }; images?: { imageUrl: string }[] }

export default function VendorProductsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [stockInputs, setStockInputs] = useState<Record<number, { stockQty: string; lowStockThreshold: string }>>({})

  const { data: products } = useQuery<Product[]>({
    queryKey: ['vendor-products'],
    queryFn: () => apiClient.get('/api/products').then((r) => r.data.content),
    enabled: !!user,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then((r) => r.data.value ?? r.data),
  })

  const createProduct = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/products', {
        name: form.name, description: form.description,
        priceBdt: parseFloat(form.priceBdt), category: { id: parseInt(form.categoryId) },
      })
      const productId = res.data.id
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${productId}/images`, { imageUrl: url }).catch(() => {})
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

  const updateStock = async (productId: number) => {
    const input = stockInputs[productId]
    if (!input) return
    try {
      await apiClient.put(`/api/products/${productId}/inventory`, {
        stockQty: parseInt(input.stockQty) || 0,
        lowStockThreshold: parseInt(input.lowStockThreshold) || 5,
      })
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Products</h1>
          <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="rounded-full bg-[#221b16] px-5 py-2 text-sm font-semibold text-[#f9f5f0]">
            {showForm ? 'Cancel' : '+ New Product'}
          </button>
        </div>

        {(showForm || editProductId) && (
          <div className="mt-6 space-y-4 rounded-2xl border border-[#e4d6c8] bg-white p-6">
            <p className="text-sm font-semibold text-[#221b16]">{editProductId ? 'Edit Product' : 'New Product'}</p>
            <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Price (BDT)" type="number" step="0.01" value={form.priceBdt} onChange={(e) => setForm({ ...form, priceBdt: e.target.value })}
                className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]">
                <option value="">Select category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <MediaUploader
              folder="products" label="Product Photos (up to 10)"
              maxFiles={10} maxSizeMB={10} allowVideo={false} onUpload={setImageUrls}
            />
            <button onClick={() => editProductId ? updateProduct.mutate() : createProduct.mutate()}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="w-full rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50">
              {createProduct.isPending || updateProduct.isPending ? 'Saving...' : editProductId ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {products?.length === 0 && <p className="text-center text-[#6c5b4f]">No products yet</p>}
          {products?.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#e4d6c8] bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-[#f0e8df] flex-shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0].imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#a28672]">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#221b16] truncate">{p.name}</p>
                  <p className="text-xs text-[#6c5b4f]">{p.category?.name} — ৳{p.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="rounded-full border border-[#d7c7b8] px-3 py-0.5 text-xs flex-shrink-0">{p.status}</span>
                <button onClick={() => startEdit(p)} className="rounded-lg border border-[#d7c7b8] px-3 py-1.5 text-xs text-[#221b16] hover:bg-[#f9f5f0] flex-shrink-0">
                  Edit
                </button>
              </div>

              {/* Stock management */}
              <div className="mt-3 flex items-center gap-3 pt-3 border-t border-[#f0e8df]">
                <span className="text-xs text-[#8c7564]">Stock:</span>
                <input
                  type="number" min="0"
                  placeholder="Qty"
                  value={stockInputs[p.id]?.stockQty ?? ''}
                  onChange={e => setStockInputs(prev => ({ ...prev, [p.id]: { ...prev[p.id], stockQty: e.target.value, lowStockThreshold: prev[p.id]?.lowStockThreshold || '5' } }))}
                  className="w-20 rounded-lg border border-[#d7c7b8] px-2.5 py-1.5 text-xs outline-none focus:border-[#221b16]"
                />
                <span className="text-xs text-[#8c7564]">Low alert:</span>
                <input
                  type="number" min="0"
                  placeholder="Alert"
                  value={stockInputs[p.id]?.lowStockThreshold ?? ''}
                  onChange={e => setStockInputs(prev => ({ ...prev, [p.id]: { ...prev[p.id], stockQty: prev[p.id]?.stockQty || '', lowStockThreshold: e.target.value } }))}
                  className="w-20 rounded-lg border border-[#d7c7b8] px-2.5 py-1.5 text-xs outline-none focus:border-[#221b16]"
                />
                <button onClick={() => updateStock(p.id)}
                  className="rounded-lg bg-[#221b16] px-3 py-1.5 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a2d24]">
                  Save Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
