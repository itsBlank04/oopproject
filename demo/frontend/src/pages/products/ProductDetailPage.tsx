import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'

type Product = {
  id: number
  name: string
  description: string
  priceBdt: number
  status: string
  category: { id: number; name: string }
  vendor: { id: number; displayName: string }
  images: { id: number; imageUrl: string; sortOrder: number }[]
}

type VendorProfile = {
  id: number
  shopId: number
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
  followerCount: number
}

type Review = {
  id: number
  reviewer: { id: number; displayName: string; avatarUrl: string }
  product?: { id: number }
  rating: number
  comment: string
  createdAt: string
}

function StarRating({ value, onChange, interactive }: {
  value: number
  onChange?: (v: number) => void
  interactive?: boolean
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition ${
            star <= value ? 'text-amber-500' : 'text-[#d7c7b8]'
          }`}
        >
          {star <= value ? '\u2605' : '\u2606'}
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
  return (
    <div className="rounded-xl border border-[#e4d6c8] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 overflow-hidden rounded-full bg-[#e4d6c8]">
          {review.reviewer?.avatarUrl ? (
            <img src={review.reviewer.avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-[#6c5b4f]">
              {review.reviewer?.displayName?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#221b16]">{review.reviewer?.displayName}</p>
          <div className="flex items-center gap-2">
            <StarRating value={review.rating} />
            <span className="text-xs text-[#8c7564]">{date}</span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-2 text-sm leading-relaxed text-[#4f4035]">{review.comment}</p>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/api/products/${id}`).then((r) => r.data),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const { data: stock } = useQuery<{ stockQty: number; lowStockThreshold: number }>({
    queryKey: ['product-stock', id],
    queryFn: () => apiClient.get(`/api/products/${id}/stock`).then((r) => r.data),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const vendorId = product?.vendor?.id
  const { data: vendorProfile } = useQuery<VendorProfile>({
    queryKey: ['vendor-profile', vendorId],
    queryFn: () => apiClient.get(`/api/vendors/${vendorId}/profile`).then((r) => r.data),
    enabled: !!vendorId,
    placeholderData: (prev) => prev,
  })

  const { data: reviews = [], refetch: refetchReviews } = useQuery<Review[]>({
    queryKey: ['product-reviews', id],
    queryFn: () => apiClient.get(`/api/products/${id}/reviews`).then((r) => r.data),
    enabled: !!id,
    placeholderData: (prev) => prev ?? [],
  })

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<'PRODUCT' | 'VENDOR'>('PRODUCT')
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-[#e4d6c8]" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#e4d6c8]" />
            <div className="h-10 w-64 animate-pulse rounded bg-[#e4d6c8]" />
            <div className="h-8 w-40 animate-pulse rounded bg-[#e4d6c8]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-red-500">Product not found</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-[#221b16] underline">
          Back to products
        </Link>
      </div>
    )
  }

  const images = product.images || []
  const inStock = stock ? stock.stockQty > 0 : true
  const isOwner = !!user && product.vendor?.id === user.id
  const lowStock = stock ? stock.stockQty > 0 && stock.stockQty <= stock.lowStockThreshold : false

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Please sign in to review'); return }
    if (reviewRating === 0) { toast.error('Please select a rating'); return }
    setSubmitting(true)
    try {
      await apiClient.post('/api/reviews', {
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment,
      })
      toast.success('Review submitted')
      setReviewRating(0)
      setReviewComment('')
      refetchReviews()
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/products" className="text-sm text-[#6c5b4f] hover:underline">&larr; Back</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Image gallery */}
          <div>
            <div
              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#f0e8df]"
              tabIndex={0}
              onKeyDown={(e) => {
                if (images.length <= 1) return
                if (e.key === 'ArrowLeft') setSelectedImage(i => (i > 0 ? i - 1 : images.length - 1))
                if (e.key === 'ArrowRight') setSelectedImage(i => (i < images.length - 1 ? i + 1 : 0))
              }}
            >
              {images.length > 0 ? (
                <>
                  <button type="button" onClick={() => setLightboxIndex(selectedImage)}
                    aria-label="Open image fullscreen"
                    className="absolute inset-0 flex items-center justify-center">
                    <img src={images[selectedImage]?.imageUrl} alt={product.name} loading="lazy"
                      className="max-h-full max-w-full object-contain transition-all duration-300" />
                  </button>
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(i => (i > 0 ? i - 1 : images.length - 1)) }}
                        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(i => (i < images.length - 1 ? i + 1 : 0)) }}
                        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                      </button>
                      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/30 bg-black/20 px-2.5 py-1.5 backdrop-blur-md">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-label={`Go to image ${i + 1}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(i) }}
                            className={`h-1.5 rounded-full transition-all ${
                              selectedImage === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-[#a28672]">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === i ? 'border-[#221b16]' : 'border-[#e4d6c8] hover:border-[#b8a494]'
                    }`}>
                    <img src={img.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Product info */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#a28672]">
              {product.category?.name}
            </p>
            <h1 className="mt-2 font-[Fraunces] text-4xl text-[#221b16]">{product.name}</h1>
            <p className="mt-4 font-[Fraunces] text-3xl text-[#221b16]">
              ৳{product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>{product.status}</span>
              {images.length > 0 && (
                <span className="text-xs text-[#8c7564]">{images.length} photo{images.length > 1 ? 's' : ''}</span>
              )}
              {inStock ? (
                lowStock ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Only {stock?.stockQty} left
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    In Stock
                  </span>
                )
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-[#4f4035]">
              {product.description || 'No description available.'}
            </p>
            {/* Add to cart + wishlist */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={async () => {
                  try {
                    if (isOwner) {
                      toast.error('You cannot buy your own product')
                      return
                    }
                    await apiClient.post('/api/cart/items', { productId: product.id, qty: 1 })
                    queryClient.invalidateQueries({ queryKey: ['cart'] })
                    toast.success('Added to cart')
                  } catch (err: any) {
                    if (err.response?.status === 401 || err.response?.status === 403) {
                      toast.error('Please sign in first')
                    } else {
                      toast.error(err.response?.data?.error ?? 'Failed to add')
                    }
                  }
                }}
                disabled={!inStock || isOwner}
                className={`flex-1 rounded-xl py-3 font-semibold transition ${
                  inStock && !isOwner
                    ? 'bg-[#221b16] text-[#f9f5f0] hover:bg-[#3a3028]'
                    : 'cursor-not-allowed bg-[#d7c7b8] text-[#8c7564]'
                }`}
              >
                {isOwner
                  ? 'Your product'
                  : inStock
                    ? `Add to Cart — ৳${product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
                    : 'Out of Stock'}
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiClient.post(`/api/wishlist/${product.id}`)
                    toast.success('Added to wishlist')
                  } catch (err: any) {
                    toast.error(err.response?.data?.error ?? 'Failed')
                  }
                }}
                className="rounded-xl border border-[#d7c7b8] px-4 py-3 text-lg hover:bg-[#f0e8df] transition"
              >
                ♡
              </button>
            </div>
            {/* Vendor card — Meet the Maker */}
            {vendorProfile && (
              <div className="mt-6 rounded-2xl border border-[#e4d6c8] bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a28672]">Meet the Maker</p>
                <div className="flex items-center gap-4">
                  <Link to={`/shop/${vendorProfile.shopSlug}`} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-[#e4d6c8] ring-2 ring-[#f0e8df]">
                    {(vendorProfile.logoUrl || vendorProfile.avatarUrl) ? (
                      <img src={vendorProfile.logoUrl || vendorProfile.avatarUrl} alt="" loading="lazy"
                        className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-[Fraunces] text-xl text-[#6c5b4f]">
                        {vendorProfile.shopName?.charAt(0) || vendorProfile.displayName?.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/shop/${vendorProfile.shopSlug}`} className="flex items-center gap-2 font-semibold text-[#221b16] hover:underline">
                      {vendorProfile.shopName || vendorProfile.displayName}
                      {vendorProfile.verificationStatus === 'VERIFIED' && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#E07B3F]">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#8c7564]">
                      {vendorProfile.reviewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <StarRating value={Math.round(vendorProfile.avgRating)} />
                          <span>({vendorProfile.reviewCount})</span>
                        </span>
                      )}
                      <span>{vendorProfile.productCount} product{vendorProfile.productCount !== 1 ? 's' : ''}</span>
                      <span>{vendorProfile.followerCount} follower{vendorProfile.followerCount !== 1 ? 's' : ''}</span>
                    </div>
                    {vendorProfile.location && (
                      <p className="mt-0.5 text-xs text-[#a28672]">{vendorProfile.location}</p>
                    )}
                  </div>
                </div>
                {vendorProfile.bio && (
                  <p className="mt-3 border-t border-[#f0e8df] pt-3 text-xs leading-relaxed text-[#6c5b4f]">
                    {vendorProfile.bio}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/shop/${vendorProfile.shopSlug}`}
                    className="flex-1 rounded-xl bg-[#221b16] py-2.5 text-center text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition">
                    View Storefront
                  </Link>
                  <button onClick={() => { setReportType('VENDOR'); setShowReportModal(true) }}
                    className="rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-xs font-semibold text-[#6c5b4f] hover:bg-[#f9f5f0] transition">
                    Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Reviews section */}
        <div className="mt-12">
          <h2 className="font-[Fraunces] text-2xl text-[#221b16]">
            Reviews ({reviews.length})
          </h2>
          {/* Review form */}
          {user ? (
            isOwner ? (
              <div className="mt-4 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-4 text-center text-sm text-[#8c7564]">
                You cannot review your own product
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[#e4d6c8] bg-white p-4">
                <p className="text-sm font-semibold text-[#221b16]">Write a review</p>
                <div className="mt-2">
                  <StarRating value={reviewRating} onChange={setReviewRating} interactive />
                </div>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={3}
                  className="mt-3 w-full resize-none rounded-xl border border-[#d7c7b8] bg-[#f9f5f0] px-4 py-3 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
                <div className="mt-3 flex justify-end">
                  <button onClick={handleSubmitReview} disabled={submitting}
                    className="rounded-xl bg-[#221b16] px-6 py-2.5 text-sm font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mt-4 rounded-xl border border-[#e4d6c8] bg-white p-4 text-center text-sm text-[#8c7564]">
              <Link to="/auth/login" className="font-semibold text-[#221b16] underline">Sign in</Link> to leave a review
            </div>
          )}
          {/* Reviews list */}
          <div className="mt-6 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#8c7564]">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        </div>

        {/* Report product button */}
        {user && (
          <div className="mt-8 flex justify-end">
            <button onClick={() => { setReportType('PRODUCT'); setShowReportModal(true) }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition">
              Report this product
            </button>
          </div>
        )}
      </div>
      {/* Report modal */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map(i => ({ url: i.imageUrl }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[Fraunces] text-lg text-[#221b16]">
              Report {reportType === 'PRODUCT' ? 'Product' : 'Vendor'}
            </h3>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
              placeholder="Tell us why you're reporting this..."
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-[#d7c7b8] bg-[#f9f5f0] px-4 py-3 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowReportModal(false)}
                className="rounded-xl border border-[#d7c7b8] px-5 py-2.5 text-sm font-semibold text-[#6c5b4f] hover:bg-[#f0e8df] transition">
                Cancel
              </button>
              <button onClick={async () => {
                if (!reportReason.trim()) { toast.error('Please provide a reason'); return }
                setSubmittingReport(true)
                try {
                  await apiClient.post('/api/reports', {
                    reportedId: reportType === 'VENDOR' ? vendorId : null,
                    entityType: reportType,
                    entityId: reportType === 'PRODUCT' ? product.id : null,
                    reason: reportReason,
                  })
                  toast.success('Report submitted')
                  setShowReportModal(false)
                  setReportReason('')
                } catch { toast.error('Failed to submit report') }
                finally { setSubmittingReport(false) }
              }} disabled={submittingReport}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50">
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
