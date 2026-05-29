import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

type VendorProfile = {
  id: number
  displayName: string
  email: string
  avatarUrl: string
  shopName: string
  shopSlug: string
  logoUrl: string
  bio: string
  location: string
  verificationStatus: string
  productCount: number
  reviewCount: number
  avgRating: number
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
        <span key={star} className={`text-sm ${star <= value ? 'text-amber-500' : 'text-[#d7c7b8]'}`}>
          {star <= value ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  )
}

export default function VendorShopPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: vendor, isLoading: vendorLoading } = useQuery<VendorProfile>({
    queryKey: ['vendor-by-slug', slug],
    queryFn: () => apiClient.get(`/api/vendors/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
  })

  const vendorId = vendor?.id
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => apiClient.get(`/api/vendors/${vendorId}/products`).then((r) => r.data),
    enabled: !!vendorId,
  })

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: () => apiClient.get(`/api/users/${vendorId}/reviews`).then((r) => r.data),
    enabled: !!vendorId,
  })

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-[#f9f5f0]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="h-40 animate-pulse rounded-2xl bg-[#e4d6c8]" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-[#e4d6c8]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#f9f5f0]">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-red-500">Shop not found</p>
          <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-[#221b16] underline">
            Browse products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/products" className="text-sm text-[#6c5b4f] hover:underline">&larr; All Products</Link>
        {/* Vendor header */}
        <div className="mt-6 rounded-2xl border border-[#e4d6c8] bg-white p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8]">
              {(vendor.logoUrl || vendor.avatarUrl) ? (
                <img src={vendor.logoUrl || vendor.avatarUrl} alt="" loading="lazy"
                  className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-[Fraunces] text-2xl text-[#6c5b4f]">
                  {vendor.shopName?.charAt(0) || vendor.displayName?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-[Fraunces] text-2xl text-[#221b16]">
                {vendor.shopName || vendor.displayName}
              </h1>
              {vendor.bio && (
                <p className="mt-1 text-sm leading-relaxed text-[#6c5b4f]">{vendor.bio}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#8c7564]">
                <span>{vendor.productCount} product{vendor.productCount !== 1 ? 's' : ''}</span>
                {vendor.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <StarRating value={Math.round(vendor.avgRating)} />
                    <span>({vendor.reviewCount})</span>
                  </span>
                )}
                {vendor.location && <span>{vendor.location}</span>}
                {vendor.verificationStatus === 'VERIFIED' && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Products grid */}
        <div className="mt-8">
          <h2 className="font-[Fraunces] text-xl text-[#221b16]">
            Products ({products.length})
          </h2>
          {productsLoading ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-[#e4d6c8]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="mt-4 text-sm text-[#8c7564]">No products yet.</p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="group rounded-xl border border-[#e4d6c8] bg-white overflow-hidden transition hover:shadow-md">
                  <div className="aspect-square overflow-hidden bg-[#f0e8df]">
                    {p.images?.[0] ? (
                      <img src={p.images[0].imageUrl} alt={p.name} loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#a28672]">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-[#221b16] truncate">{p.name}</p>
                    <p className="mt-1 font-[Fraunces] text-lg text-[#221b16]">
                      ৳{p.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="font-[Fraunces] text-xl text-[#221b16]">
              Reviews ({reviews.length})
            </h2>
            <div className="mt-4 space-y-3">
              {reviews.map((r) => {
                const date = new Date(r.createdAt).toLocaleDateString('en-BD', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })
                return (
                  <div key={r.id} className="rounded-xl border border-[#e4d6c8] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-[#e4d6c8]">
                        {r.reviewer?.avatarUrl ? (
                          <img src={r.reviewer.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-[#6c5b4f]">
                            {r.reviewer?.displayName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#221b16]">{r.reviewer?.displayName}</p>
                        <div className="flex items-center gap-2">
                          <StarRating value={r.rating} />
                          <span className="text-xs text-[#8c7564]">{date}</span>
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-[#4f4035]">{r.comment}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
