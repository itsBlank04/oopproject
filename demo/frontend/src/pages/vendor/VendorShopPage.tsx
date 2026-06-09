import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import ProductCard from '../../components/ProductCard'
import MediaUploader from '../../components/MediaUploader'
import { toast } from 'react-hot-toast'
import { Star, MapPin, ShieldCheck, Heart, Share2, Info, BookOpen, Clock, Plus, Package, Trash2 } from 'lucide-react'

export type ShopPublicProfile = {
  id: number
  vendorId: number
  vendorDisplayName: string
  name: string
  slug: string
  logoUrl: string
  bannerUrl: string
  description: string
  location: string
  policies: string
  status: string
  verificationLevel: string
  followerCount: number
  following: boolean
  productCount: number
  reviewCount: number
  avgRating: number
  createdAt: string
}

type Product = {
  id: number
  name: string
  priceBdt: number
  images: { imageUrl: string }[]
  status: string
}

type Review = {
  id: number
  reviewer: { id: number; displayName: string; avatarUrl: string }
  rating: number
  comment: string
  createdAt: string
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

export default function VendorShopPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  
  // Follower state for real-time toggle responsiveness
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  // Owner product management
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [stockCache, setStockCache] = useState<Record<number, { stockQty: number; lowStockThreshold: number }>>({})

  const { data: shop, isLoading: shopLoading } = useQuery<ShopPublicProfile>({
    queryKey: ['shop-by-slug', slug],
    queryFn: () => apiClient.get(`/api/shops/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  })

  // Sync follow state once data is loaded
  useEffect(() => {
    if (shop) {
      setIsFollowing(shop.following)
      setFollowersCount(shop.followerCount)
    }
  }, [shop])

  const shopId = shop?.id
  const vendorId = shop?.vendorId
  const isOwner = !!user && vendorId === user.id

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['shop-products', shopId],
    queryFn: () => apiClient.get(`/api/shops/${shopId}/products`).then((r) => r.data),
    enabled: !!shopId,
  })

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['shop-reviews', vendorId],
    queryFn: () => apiClient.get(`/api/users/${vendorId}/reviews`).then((r) => r.data),
    enabled: !!vendorId,
  })

  const { data: categories } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then((r) => r.data.value ?? r.data),
  })

  const fetchInventoryBatch = useCallback(async (productIds: number[]) => {
    if (!isOwner) return
    const results = await Promise.allSettled(
      productIds.map(id =>
        apiClient.get(`/api/products/${id}/inventory`).then(r => ({ id, data: r.data as { stockQty: number; lowStockThreshold: number } }))
      )
    )
    const cache: Record<number, { stockQty: number; lowStockThreshold: number }> = {}
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.data) {
        cache[r.value.id] = { stockQty: r.value.data.stockQty, lowStockThreshold: r.value.data.lowStockThreshold }
      }
    }
    setStockCache(prev => ({ ...prev, ...cache }))
  }, [isOwner])

  useEffect(() => {
    if (products.length > 0) fetchInventoryBatch(products.map(p => p.id))
  }, [products, fetchInventoryBatch])

  const createProduct = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/products', {
        name: form.name,
        description: form.description,
        priceBdt: parseFloat(form.priceBdt),
        category: { id: parseInt(form.categoryId) },
        shop: { id: shopId }
      })
      const pid = res.data.id
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${pid}/images`, { imageUrl: url }).catch(() => {})
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products', shopId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] })
      setShowForm(false)
      setForm({ name: '', description: '', priceBdt: '', categoryId: '' })
      setImageUrls([])
      toast.success('Product created')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to create'),
  })

  const deleteProduct = useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/api/products/${productId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products', shopId] })
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const syncStock = useCallback((productId: number, stockQty: number, lowStockThreshold: number) => {
    apiClient.put(`/api/products/${productId}/inventory`, { stockQty, lowStockThreshold }).catch(() => {})
  }, [])

  const handleFollowToggle = async () => {
    if (!shopId) return
    try {
      const response = await apiClient.post(`/api/shops/${shopId}/toggle-follow`)
      setIsFollowing(response.data.following)
      setFollowersCount(response.data.followerCount)
    } catch (err) {
      console.error('Failed to toggle follow status', err)
    }
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-64 animate-pulse rounded-2xl bg-[#e0e7ff]/40" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-[#e0e7ff]/40" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-[#e0e7ff] rounded-2xl max-w-md shadow-sm">
          <h2 className="font-[Fraunces] text-2xl text-[#1e293b] mb-2">Shop Not Found</h2>
          <p className="text-[#94A3B8] text-sm mb-6">The shop you're looking for does not exist or has been deactivated.</p>
          <Link to="/products" className="inline-block px-5 py-2.5 bg-[#94A3B8] text-white rounded-lg text-sm font-semibold hover:bg-[#64748b] transition-all">
            Browse Market
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-r from-[#e0e7ff] via-[#eef2ff] to-[#e0e7ff]">
        {shop.bannerUrl ? (
          <img src={shop.bannerUrl} alt={shop.name} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="font-[Fraunces] text-8xl text-white select-none">ATOMDROPS</span>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Shop Info Card */}
        <div className="relative -mt-20 mb-8 rounded-2xl border border-[#e0e7ff]/60 bg-white p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Left: Logo and Titles */}
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-[#e0e7ff] border-4 border-white shadow-sm">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-[Fraunces] text-4xl text-[#64748b]">
                    {shop.name.charAt(0)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-[Fraunces] text-3xl font-bold text-[#1e293b]">
                    {shop.name}
                  </h1>
                  {shop.verificationLevel !== 'STANDARD' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {shop.verificationLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#94A3B8] mt-1 font-medium">Owned by {shop.vendorDisplayName}</p>
                
                {/* Meta stats */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" />
                    {shop.location || 'Dhaka, Bangladesh'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#94A3B8]" />
                    Est. {new Date(shop.createdAt).getFullYear()}
                  </span>
                  <span>&bull;</span>
                  <span>{products.length} Product{products.length !== 1 ? 's' : ''}</span>
                  <span>&bull;</span>
                  <span>{followersCount} Follower{followersCount !== 1 ? 's' : ''}</span>
                  {shop.reviewCount > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <StarRating value={Math.round(shop.avgRating)} />
                        <span className="font-semibold text-[#1e293b]">({shop.avgRating.toFixed(1)})</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              {isOwner ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#1e293b] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#4338ca]"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isFollowing
                      ? 'bg-[#94A3B8] text-white hover:bg-[#64748b]'
                      : 'border border-[#94A3B8] text-[#94A3B8] hover:bg-[#94A3B8]/5'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFollowing ? 'fill-white' : ''}`} />
                  {isFollowing ? 'Following' : 'Follow Shop'}
                </button>
              )}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Shop link copied!')
                }}
                className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all"
                title="Share shop"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Description */}
          {shop.description && (
            <div className="mt-6 border-t border-[#e0e7ff]/40 pt-4">
              <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">About the Shop</h3>
              <p className="text-sm leading-relaxed text-[#475569]">{shop.description}</p>
            </div>
          )}
        </div>

        {/* Layout Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main: Products list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[Fraunces] text-2xl text-[#1e293b]">Shop Products</h2>
              <span className="text-xs text-[#94A3B8]">{products.length} item{products.length !== 1 ? 's' : ''} found</span>
            </div>

            {productsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-xl bg-[#e0e7ff]/30" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-[#e0e7ff]/40">
                <p className="text-sm text-[#94A3B8]">This shop hasn't listed any products yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {products.map((p) => (
                  <div key={p.id} className="group relative">
                    <ProductCard
                      product={p}
                      onImageClick={(images, index) => setLightbox({ images, index })}
                      aspectSquare
                      showCategory={false}
                      priceFractionDigits={2}
                      truncateName
                    />
                    {isOwner && (
                      <div className="mt-2 rounded-xl border border-[#e0e7ff]/60 bg-white p-3">
                        {/* Stock controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-[#94A3B8]" />
                            <span className="text-[11px] font-medium text-[#64748b]">Stock</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const cur = stockCache[p.id]?.stockQty ?? 0
                                const next = Math.max(0, cur - 1)
                                setStockCache(prev => ({ ...prev, [p.id]: { ...prev[p.id] ?? { lowStockThreshold: 5 }, stockQty: next } }))
                                syncStock(p.id, next, stockCache[p.id]?.lowStockThreshold ?? 5)
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#cbd5e1] text-xs text-[#64748b] hover:bg-[#f8fafc]"
                            >−</button>
                            <span className={`min-w-[2rem] text-center text-xs font-semibold ${
                              (stockCache[p.id]?.stockQty ?? 0) === 0 ? 'text-red-500' :
                              (stockCache[p.id]?.stockQty ?? 0) <= (stockCache[p.id]?.lowStockThreshold ?? 5) ? 'text-amber-500' : 'text-emerald-600'
                            }`}>
                              {stockCache[p.id]?.stockQty ?? '…'}
                            </span>
                            <button
                              onClick={() => {
                                const cur = stockCache[p.id]?.stockQty ?? 0
                                const next = cur + 1
                                setStockCache(prev => ({ ...prev, [p.id]: { ...prev[p.id] ?? { lowStockThreshold: 5 }, stockQty: next } }))
                                syncStock(p.id, next, stockCache[p.id]?.lowStockThreshold ?? 5)
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#cbd5e1] text-xs text-[#64748b] hover:bg-[#f8fafc]"
                            >+</button>
                          </div>
                        </div>
                        {/* Stock status bar */}
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#eef2ff]">
                          <div className={`h-full rounded-full transition-all ${
                            (stockCache[p.id]?.stockQty ?? 0) === 0 ? 'bg-red-400' :
                            (stockCache[p.id]?.stockQty ?? 0) <= (stockCache[p.id]?.lowStockThreshold ?? 5) ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                            style={{ width: `${Math.min(100, ((stockCache[p.id]?.stockQty ?? 0) / 20) * 100)}%` }}
                          />
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this product?')) deleteProduct.mutate(p.id)
                          }}
                          className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Policies & Reviews */}
          <div className="space-y-6">
            {/* Policies */}
            <div className="rounded-2xl border border-[#e0e7ff]/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-[#94A3B8]" />
                <h3 className="font-[Fraunces] text-lg text-[#1e293b]">Shop Policies</h3>
              </div>
              <p className="text-sm leading-relaxed text-[#475569] whitespace-pre-line">
                {shop.policies || 'No specific shop policies defined. Standard platform policies apply.'}
              </p>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl border border-[#e0e7ff]/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-[#94A3B8]" />
                <h3 className="font-[Fraunces] text-lg text-[#1e293b]">Reviews</h3>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No reviews for this shop yet.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {reviews.map((r) => {
                    const date = new Date(r.createdAt).toLocaleDateString('en-BD', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
                    return (
                      <div key={r.id} className="border-b border-[#e0e7ff]/40 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 overflow-hidden rounded-full bg-[#e0e7ff]/60 flex-shrink-0">
                            {r.reviewer?.avatarUrl ? (
                              <img src={r.reviewer.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs font-bold text-[#64748b]">
                                {r.reviewer?.displayName?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#1e293b]">{r.reviewer?.displayName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StarRating value={r.rating} />
                              <span className="text-[10px] text-[#94A3B8]">{date}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && <p className="mt-2 text-xs leading-relaxed text-[#475569]">{r.comment}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Add Product Panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e0e7ff]/60 bg-white px-6 py-4">
              <h2 className="font-[Fraunces] text-xl text-[#1e293b]">Add Product</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f8fafc]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Shop</label>
                <input readOnly value={shop?.name} className="w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#64748b]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Product Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter product name" className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94A3B8] outline-none focus:border-[#94A3B8]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe your product" className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94A3B8] outline-none focus:border-[#94A3B8] resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Price (BDT)</label>
                <input type="number" value={form.priceBdt} onChange={e => setForm(f => ({ ...f, priceBdt: e.target.value }))} placeholder="0.00" min="0" step="0.01" className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94A3B8] outline-none focus:border-[#94A3B8]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Category</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm text-[#1e293b] outline-none focus:border-[#94A3B8]">
                  <option value="">Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Photos</label>
                <MediaUploader folder="products" onUpload={(urls) => setImageUrls(prev => [...prev, ...urls])} maxFiles={10} allowVideo={false} />
                {imageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#e0e7ff]">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => createProduct.mutate()}
                disabled={!form.name || !form.priceBdt || !form.categoryId || createProduct.isPending}
                className="w-full rounded-xl bg-[#1e293b] py-3 text-sm font-semibold text-white transition-all hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createProduct.isPending ? 'Creating…' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
