import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import ProductCard from '../../components/ProductCard'
import MediaUploader from '../../components/MediaUploader'
import { toast } from 'react-hot-toast'
import { Star, MapPin, ShieldCheck, Heart, Share2, Info, BookOpen, Clock, Plus, Package, Trash2, Pencil, X, Store } from 'lucide-react'

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
  description?: string
  priceBdt: number
  status: string
  shippingType: string
  category: { id: number; name: string }
  shop?: { id: number; name: string }
  images: { imageUrl: string }[]
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

  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  // Add/Edit Product panel
  const [showForm, setShowForm] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', priceBdt: '', categoryId: '' })
  const [imageUrls, setImageUrls] = useState<string[]>([])

  // Edit Shop panel
  const [showEditShop, setShowEditShop] = useState(false)
  const [editShopForm, setEditShopForm] = useState({ name: '', description: '', location: '', policies: '', logoUrl: '', bannerUrl: '' })
  const [editShopImageUrls, setEditShopImageUrls] = useState<string[]>([])

  // Stock cache with debounce
  const [stockCache, setStockCache] = useState<Record<number, { stockQty: number; lowStockThreshold: number }>>({})
  const stockTimers = useRef<Record<number, number | undefined>>({})
  const stockCacheRef = useRef(stockCache)
  stockCacheRef.current = stockCache

  const { data: shop, isLoading: shopLoading, error: shopError, refetch: refetchShop } = useQuery<ShopPublicProfile>({
    queryKey: ['shop-by-slug', slug],
    queryFn: () => apiClient.get(`/api/shops/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
    retry: 1,
  })

  useEffect(() => {
    if (shopError) console.error('Shop query error:', shopError)
  }, [shopError])

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

  // Fetch inventory for all products
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

  // Sync stock with debounce
  const syncStock = useCallback((productId: number, stockQty: number, lowStockThreshold: number) => {
    apiClient.put(`/api/products/${productId}/inventory`, { stockQty, lowStockThreshold })
      .catch(() => {
        setStockCache(prev => {
          const old = stockCacheRef.current[productId]
          return old ? { ...prev, [productId]: old } : prev
        })
      })
  }, [])

  const setStock = (productId: number, stockQty: number, lowStockThreshold: number) => {
    setStockCache(prev => ({ ...prev, [productId]: { stockQty, lowStockThreshold } }))
    if (stockTimers.current[productId]) clearTimeout(stockTimers.current[productId])
    stockTimers.current[productId] = window.setTimeout(() => {
      delete stockTimers.current[productId]
      syncStock(productId, stockQty, lowStockThreshold)
    }, 400)
  }

  const stockFor = (p: Product) => stockCache[p.id] || { stockQty: 0, lowStockThreshold: 5 }

  const stockLevel = (p: Product) => {
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
    lowStock: products.filter(p => { const s = stockFor(p); return s.stockQty > 0 && s.stockQty <= s.lowStockThreshold }).length,
    outOfStock: products.filter(p => stockFor(p).stockQty === 0).length,
  }

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
      resetForm()
      toast.success('Product created')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to create'),
  })

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!editProductId) return
      await apiClient.put(`/api/products/${editProductId}`, {
        name: form.name,
        description: form.description,
        priceBdt: parseFloat(form.priceBdt),
        category: { id: parseInt(form.categoryId) }
      })
      for (const url of imageUrls) {
        await apiClient.post(`/api/products/${editProductId}/images`, { imageUrl: url }).catch(() => {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products', shopId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      resetForm()
      toast.success('Product updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to update'),
  })

  const updateShopMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.put(`/api/shops/${shopId}`, editShopForm)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-by-slug', slug] })
      queryClient.invalidateQueries({ queryKey: ['vendor-shops-list'] })
      setShowEditShop(false)
      toast.success('Shop updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to update shop'),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products', shopId] })
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ productId, status }: { productId: number; status: string }) => {
      await apiClient.put(`/api/vendor/products/${productId}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products', shopId] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to update status'),
  })

  const updateShipping = useMutation({
    mutationFn: async ({ productId, shippingType }: { productId: number; shippingType: string }) => {
      await apiClient.put(`/api/vendor/products/${productId}/shipping`, { shippingType })
    },
    onMutate: async ({ productId, shippingType }) => {
      await queryClient.cancelQueries({ queryKey: ['shop-products', shopId] })
      const prev = queryClient.getQueryData<any[]>(['shop-products', shopId])
      if (prev) {
        queryClient.setQueryData(['shop-products', shopId], prev.map(p =>
          p.id === productId ? { ...p, shippingType } : p
        ))
      }
      return { prev }
    },
    onError: (_err: any, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['shop-products', shopId], ctx.prev)
    },
  })

  const toggleShopStatus = useMutation({
    mutationFn: async () => {
      const newStatus = shop?.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      await apiClient.put(`/api/shops/${shopId}`, { status: newStatus })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-by-slug', slug] })
      queryClient.invalidateQueries({ queryKey: ['vendor-shops-list'] })
      toast.success('Shop status updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to update status'),
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

  const openEditShop = () => {
    if (!shop) return
    setEditShopForm({
      name: shop.name,
      description: shop.description || '',
      location: shop.location || '',
      policies: shop.policies || '',
      logoUrl: shop.logoUrl || '',
      bannerUrl: shop.bannerUrl || '',
    })
    setEditShopImageUrls([])
    setShowEditShop(true)
  }

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-[#faf6f2]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-64 animate-pulse rounded-2xl bg-[#e4d6c8]/40" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-[#e4d6c8]/40" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-[#e4d6c8] rounded-2xl max-w-md shadow-sm">
          <h2 className="font-[Fraunces] text-2xl text-[#221b16] mb-2">Shop Not Found</h2>
          <p className="text-[#8c7564] text-sm mb-1">The shop you're looking for does not exist or has been deactivated.</p>
          {slug && <p className="text-[#b09686] text-xs mb-6">Path: /{slug}</p>}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => refetchShop()} className="px-5 py-2.5 bg-[#8c7564] text-white rounded-lg text-sm font-semibold hover:bg-[#6c5b4f] transition-all">
              Retry
            </button>
            <Link to="/products" className="px-5 py-2.5 border border-[#e4d6c8] text-[#8c7564] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all">
              Browse Market
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf6f2] pb-16">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-r from-[#e4d6c8] via-[#f9f5f0] to-[#e4d6c8]">
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
        <div className="relative -mt-20 mb-8 rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-[#e4d6c8] border-4 border-white shadow-sm">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-[Fraunces] text-4xl text-[#6c5b4f]">
                    {shop.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-[Fraunces] text-3xl font-bold text-[#221b16]">
                    {shop.name}
                  </h1>
                  {isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShopStatus.mutate() }}
                      disabled={toggleShopStatus.isPending}
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-all duration-300 pointer-events-auto ${
                        shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
                        shop.status === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}>
                        <span className={`text-[7px] font-black uppercase leading-none ${
                          shop.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {shop.status === 'ACTIVE' ? 'ON' : 'OF'}
                        </span>
                      </span>
                    </button>
                  )}
                  {shop.verificationLevel !== 'STANDARD' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {shop.verificationLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#8c7564] mt-1 font-medium">Owned by {shop.vendorDisplayName}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8c7564]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#8c7564]" />
                    {shop.location || 'Dhaka, Bangladesh'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#8c7564]" />
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
                        <span className="font-semibold text-[#221b16]">({shop.avgRating.toFixed(1)})</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  <button
                    onClick={openEditShop}
                    className="flex items-center gap-2 rounded-xl border border-[#8c7564] px-5 py-2.5 text-sm font-semibold text-[#8c7564] transition-all hover:bg-[#8c7564]/5"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Shop
                  </button>
                  <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3a3028]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isFollowing
                      ? 'bg-[#8c7564] text-white hover:bg-[#6c5b4f]'
                      : 'border border-[#8c7564] text-[#8c7564] hover:bg-[#8c7564]/5'
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
          {shop.description && (
            <div className="mt-6 border-t border-[#e4d6c8]/40 pt-4">
              <h3 className="text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-1">About the Shop</h3>
              <p className="text-sm leading-relaxed text-[#6c5b4f]">{shop.description}</p>
            </div>
          )}
        </div>

        {/* Inventory Management (owner only) */}
        {isOwner && (
          <div className="mb-8 rounded-2xl border border-[#e4d6c8]/60 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-[Fraunces] text-2xl text-[#221b16]">Inventory</h2>
                <p className="mt-1 text-sm text-[#8c7564]">Manage your inventory, stock levels, and listings</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          </div>
        )}

        {/* Products + Reviews Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[Fraunces] text-2xl text-[#221b16]">Shop Products</h2>
              <span className="text-xs text-[#8c7564]">{products.length} item{products.length !== 1 ? 's' : ''} found</span>
            </div>

            {productsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-xl bg-[#e4d6c8]/30" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-[#e4d6c8]/40">
                <p className="text-sm text-[#8c7564]">This shop hasn't listed any products yet.</p>
              </div>
            ) : isOwner ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {products.map((p) => (
                  <div key={p.id} className="group relative cursor-pointer rounded-2xl bg-white shadow-sm ring-1 ring-[#e4d6c8]/60 transition-all hover:shadow-md hover:ring-[#e4d6c8]">
                    {/* Overlaid controls */}
                    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus.mutate({ productId: p.id, status: p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }) }}
                        className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-all duration-300 ${
                          p.status === 'ACTIVE'
                            ? stockFor(p).stockQty === 0 ? 'bg-red-400' : stockFor(p).stockQty <= stockFor(p).lowStockThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                            : 'bg-gray-400'
                        }`}
                      >
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ${
                          p.status === 'ACTIVE' ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`}>
                          <span className={`text-[6px] font-black uppercase leading-none ${
                            p.status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {p.status === 'ACTIVE' ? 'ON' : 'OF'}
                          </span>
                        </span>
                      </button>
                      <span className="rounded-full bg-slate-800 text-white px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {shop.name}
                      </span>
                    </div>

                    {/* Image */}
                    <button type="button" onClick={() => {
                      const imgs = (p.images || []).map(i => ({ url: i.imageUrl }))
                      if (imgs.length > 0) setLightbox({ images: imgs, index: 0 })
                    }} className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[#f9f5f0]">
                      {p.images?.[0]?.imageUrl ? (
                        <img src={p.images[0].imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-[Fraunces] text-2xl text-[#6c5b4f]">{p.name.charAt(0)}</div>
                      )}
                    </button>

                    {/* Card body */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-[#221b16]">{p.name}</h3>
                          <p className="mt-0.5 text-xs text-[#8c7564]">{p.category?.name || ''}</p>
                        </div>
                        <p className="shrink-0 font-bold text-[#221b16]">৳{p.priceBdt.toLocaleString('en-BD')}</p>
                      </div>

                      {/* Stock */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${stockLevel(p).color}`}>{stockLevel(p).label}</span>
                          <span className="text-[#8c7564]">Low: {stockFor(p).lowStockThreshold}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full transition-all duration-500 ${stockLevel(p).barColor}`}
                            style={{ width: `${stockLevel(p).percent}%` }} />
                        </div>
                      </div>

                      {/* Stock input */}
                      <div className="mt-4 flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); const cur = stockFor(p); setStock(p.id, Math.max(0, cur.stockQty - 1), cur.lowStockThreshold) }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e4d6c8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                        </button>
                        <input type="number" min={0} value={stockFor(p).stockQty}
                          onChange={(e) => { const val = parseInt(e.target.value) || 0; setStock(p.id, Math.max(0, val), stockFor(p).lowStockThreshold) }}
                          className="w-16 rounded-lg border border-[#e4d6c8] bg-[#f9f5f0] px-2 py-1.5 text-center text-xs font-semibold text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                        <button onClick={(e) => { e.stopPropagation(); const cur = stockFor(p); setStock(p.id, cur.stockQty + 1, cur.lowStockThreshold) }}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e4d6c8] text-[#6c5b4f] transition hover:bg-[#f9f5f0] active:scale-90">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                        <div className="ml-auto flex items-center gap-1">
                          <label className="text-[10px] text-[#8c7564]">Alert:</label>
                          <input
                              type="number"
                              min={0}
                              value={stockFor(p).lowStockThreshold}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0
                                setStock(p.id, stockFor(p).stockQty, Math.max(0, val))
                              }}
                              className="w-12 rounded-lg border border-[#e4d6c8] bg-[#f9f5f0] px-1.5 py-1 text-center text-[10px] text-[#221b16] outline-none focus:border-[#221b16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* Shipping toggle */}
                        <div className="mt-4 border-t border-[#f9f5f0] pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#6c5b4f]">Shipping</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateShipping.mutate({ productId: p.id, shippingType: p.shippingType === 'FREE' ? 'PAID' : 'FREE' }) }}
                              className={`relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full transition-all ${p.shippingType === 'FREE' ? 'bg-emerald-500' : 'bg-[#e4d6c8]'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${p.shippingType === 'FREE' ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-[10px] text-[#8c7564]">
                            {p.shippingType === 'FREE' ? 'Free shipping' : 'Paid shipping'}
                          </p>
                        </div>

                        {/* Edit + Delete */}
                        <div className="mt-4 flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); startEdit(p) }}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e4d6c8] py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0] active:scale-[0.97]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this product?')) deleteProduct.mutate(p.id) }}
                            className="flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 active:scale-[0.97]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onImageClick={(images, index) => setLightbox({ images, index })}
                    aspectSquare
                    showCategory={false}
                    priceFractionDigits={2}
                    truncateName
                    vendorId={vendorId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-[#8c7564]" />
                <h3 className="font-[Fraunces] text-lg text-[#221b16]">Shop Policies</h3>
              </div>
              <p className="text-sm leading-relaxed text-[#6c5b4f] whitespace-pre-line">
                {shop.policies || 'No specific shop policies defined. Standard platform policies apply.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-[#8c7564]" />
                <h3 className="font-[Fraunces] text-lg text-[#221b16]">Reviews</h3>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#8c7564]">No reviews for this shop yet.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {reviews.map((r) => {
                    const date = new Date(r.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
                    return (
                      <div key={r.id} className="border-b border-[#e4d6c8]/40 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 overflow-hidden rounded-full bg-[#e4d6c8]/60 flex-shrink-0">
                            {r.reviewer?.avatarUrl ? (
                              <img src={r.reviewer.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs font-bold text-[#6c5b4f]">
                                {r.reviewer?.displayName?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#221b16]">{r.reviewer?.displayName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <StarRating value={r.rating} />
                              <span className="text-[10px] text-[#8c7564]">{date}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && <p className="mt-2 text-xs leading-relaxed text-[#6c5b4f]">{r.comment}</p>}
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

      {/* Add/Edit Product Slide-over */}
      {(showForm || editProductId) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto" style={{ animation: 'slide-in-from-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="sticky top-0 z-10 border-b border-[#e4d6c8] bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">{editProductId ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={resetForm} className="rounded-lg p-1.5 text-[#6c5b4f] hover:bg-[#f9f5f0]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Shop</label>
                <input readOnly value={shop?.name} className="w-full rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] px-4 py-2.5 text-sm text-[#6c5b4f]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Product Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter product name" className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] placeholder:text-[#8c7564] outline-none focus:border-[#8c7564]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe your product" className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] placeholder:text-[#8c7564] outline-none focus:border-[#8c7564] resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Price (BDT)</label>
                <input type="number" value={form.priceBdt} onChange={e => setForm(f => ({ ...f, priceBdt: e.target.value }))} placeholder="0.00" min="0" step="0.01" className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] placeholder:text-[#8c7564] outline-none focus:border-[#8c7564]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Category</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#8c7564]">
                  <option value="">Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Photos</label>
                <MediaUploader folder="products" onUpload={(urls) => setImageUrls(prev => [...prev, ...urls])} maxFiles={10} allowVideo={false} />
                {imageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#e4d6c8]">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => editProductId ? updateProduct.mutate() : createProduct.mutate()}
                disabled={!form.name || !form.priceBdt || !form.categoryId || (editProductId ? updateProduct.isPending : createProduct.isPending)}
                className="w-full rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a3028] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editProductId
                  ? (updateProduct.isPending ? 'Saving…' : 'Save Changes')
                  : (createProduct.isPending ? 'Creating…' : 'Create Product')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shop Panel */}
      {showEditShop && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowEditShop(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto" style={{ animation: 'slide-in-from-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e4d6c8]/60 bg-white px-6 py-4">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">Edit Shop</h2>
              <button onClick={() => setShowEditShop(false)} className="rounded-lg p-1.5 text-[#6c5b4f] hover:bg-[#f9f5f0]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Shop Name</label>
                <input value={editShopForm.name} onChange={e => setEditShopForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#8c7564]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Description</label>
                <textarea value={editShopForm.description} onChange={e => setEditShopForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#8c7564] resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Location</label>
                <input value={editShopForm.location} onChange={e => setEditShopForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Area" className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#8c7564]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Policies</label>
                <textarea value={editShopForm.policies} onChange={e => setEditShopForm(f => ({ ...f, policies: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none focus:border-[#8c7564] resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Logo</label>
                <MediaUploader folder="shops" onUpload={(urls) => setEditShopForm(f => ({ ...f, logoUrl: urls[0] }))} maxFiles={1} allowVideo={false} />
                {editShopForm.logoUrl && (
                  <div className="relative mt-2 inline-block">
                    <img src={editShopForm.logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover border border-[#e4d6c8]" />
                    <button onClick={() => setEditShopForm(f => ({ ...f, logoUrl: '' }))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Banner</label>
                <MediaUploader folder="shops" onUpload={(urls) => setEditShopForm(f => ({ ...f, bannerUrl: urls[0] }))} maxFiles={1} allowVideo={false} />
                {editShopForm.bannerUrl && (
                  <div className="relative mt-2 inline-block w-full">
                    <img src={editShopForm.bannerUrl} alt="Banner" className="h-24 w-full rounded-xl object-cover border border-[#e4d6c8]" />
                    <button onClick={() => setEditShopForm(f => ({ ...f, bannerUrl: '' }))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
              <button
                onClick={() => updateShopMutation.mutate()}
                disabled={!editShopForm.name || updateShopMutation.isPending}
                className="w-full rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a3028] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateShopMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
