import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import ProductCard from '../../components/ProductCard'
import { Star, MapPin, ShieldCheck, Heart, Share2, Info, BookOpen } from 'lucide-react'

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
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  
  // Follower state for real-time toggle responsiveness
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

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
      <div className="min-h-screen bg-[#fcfbfa]">
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
      <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-[#e4d6c8] rounded-2xl max-w-md shadow-sm">
          <h2 className="font-[Fraunces] text-2xl text-[#221b16] mb-2">Shop Not Found</h2>
          <p className="text-[#8c7564] text-sm mb-6">The shop you're looking for does not exist or has been deactivated.</p>
          <Link to="/products" className="inline-block px-5 py-2.5 bg-[#8c7564] text-white rounded-lg text-sm font-semibold hover:bg-[#6c5b4f] transition-all">
            Browse Market
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] pb-16">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-r from-[#e4d6c8] via-[#f1e9e0] to-[#e4d6c8]">
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
            
            {/* Left: Logo and Titles */}
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
                  {shop.verificationLevel !== 'STANDARD' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {shop.verificationLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#8c7564] mt-1 font-medium">Owned by {shop.vendorDisplayName}</p>
                
                {/* Meta stats */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8c7564]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#a89280]" />
                    {shop.location || 'Dhaka, Bangladesh'}
                  </span>
                  <span>&bull;</span>
                  <span>{products.length} Products</span>
                  <span>&bull;</span>
                  <span>{followersCount} Followers</span>
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

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              {!isOwner && (
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
                  alert('Shop link copied to clipboard!')
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
            <div className="mt-6 border-t border-[#e4d6c8]/40 pt-4">
              <h3 className="text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-1">About the Shop</h3>
              <p className="text-sm leading-relaxed text-[#4f4035]">{shop.description}</p>
            </div>
          )}
        </div>

        {/* Layout Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main: Products list */}
          <div className="lg:col-span-2">
            <h2 className="font-[Fraunces] text-2xl text-[#221b16] mb-6">
              Shop Products
            </h2>

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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Policies & Reviews */}
          <div className="space-y-6">
            {/* Policies */}
            <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-[#8c7564]" />
                <h3 className="font-[Fraunces] text-lg text-[#221b16]">Shop Policies</h3>
              </div>
              <p className="text-sm leading-relaxed text-[#4f4035] whitespace-pre-line">
                {shop.policies || 'No specific shop policies defined. Standard platform policies apply.'}
              </p>
            </div>

            {/* Reviews */}
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
                    const date = new Date(r.createdAt).toLocaleDateString('en-BD', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })
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
                        {r.comment && <p className="mt-2 text-xs leading-relaxed text-[#4f4035]">{r.comment}</p>}
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
    </div>
  )
}
