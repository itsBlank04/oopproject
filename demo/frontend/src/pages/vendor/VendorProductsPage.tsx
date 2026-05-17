import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import MediaUploader from '../../components/MediaUploader'
import toast from 'react-hot-toast'

type Category = { id: number; name: string }
type Product = { id: number; name: string; priceBdt: number; status: string; category: { name: string }; images?: { imageUrl: string }[] }

export default function VendorProductsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])

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
        name: form.name,
        description: form.description,
        priceBdt: parseFloat(form.priceBdt),
        category: { id: parseInt(form.categoryId) },
      })
      // Save images to the product
      const productId = res.data.id
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${productId}/images`, { imageUrl: url }).catch(() => {})
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      setShowForm(false)
      setForm({ name: '', description: '', priceBdt: '', categoryId: '' })
      setImageUrls([])
      toast.success('Product created with images')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to create'),
  })

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Products</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-[#221b16] px-5 py-2 text-sm font-semibold text-[#f9f5f0]">
            {showForm ? 'Cancel' : '+ New Product'}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 space-y-4 rounded-2xl border border-[#e4d6c8] bg-white p-6">
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

            {/* Product image upload */}
            <MediaUploader
              folder="products"
              label="Product Photos (up to 10)"
              maxFiles={10}
              maxSizeMB={10}
              allowVideo={false}
              onUpload={setImageUrls}
            />

            <button onClick={() => createProduct.mutate()} disabled={createProduct.isPending}
              className="w-full rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50">
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {products?.length === 0 && <p className="text-center text-[#6c5b4f]">No products yet</p>}
          {products?.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-[#e4d6c8] bg-white p-4">
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-[#f0e8df]">
                {p.images?.[0] ? (
                  <img src={p.images[0].imageUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#a28672]">📷</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#221b16]">{p.name}</p>
                <p className="text-sm text-[#6c5b4f]">{p.category?.name} — ৳{p.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="rounded-full border border-[#d7c7b8] px-3 py-0.5 text-xs">{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
