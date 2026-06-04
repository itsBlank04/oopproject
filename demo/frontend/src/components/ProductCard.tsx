import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { cartEvents } from '../lib/cartEvents'
import toast from 'react-hot-toast'

type ProductImage = { imageUrl?: string }
type Review = { id: number; rating: number }

const shippingLabels: Record<string, string> = {
  FREE: 'Free Shipping',
  INSIDE_DHAKA: '৳60',
  OUTSIDE_DHAKA: '৳100',
}

type ProductCardProps = {
  product: {
    id: number
    name: string
    priceBdt: number
    images?: ProductImage[]
    category?: { id: number; name: string }
    status?: string
    shippingType?: string
  }
  onImageClick: (images: { url: string }[], index: number) => void
  aspectSquare?: boolean
  showCategory?: boolean
  priceFractionDigits?: number
  truncateName?: boolean
}

function StarRow({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={`text-[11px] ${s <= Math.round(avg) ? 'text-amber-500' : 'text-[#D7C7B8]'}`}>★</span>
        ))}
      </div>
      <span className="text-[11px] text-[#8C7564]">({count})</span>
    </div>
  )
}

export default function ProductCard({
  product,
  onImageClick,
  aspectSquare = false,
  showCategory = true,
  priceFractionDigits = 0,
  truncateName = false,
}: ProductCardProps) {
  const [index, setIndex] = useState(0)
  const [imgHovered, setImgHovered] = useState(false)
  const [cardHovered, setCardHovered] = useState(false)
  const { user } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const images = product.images?.filter(i => i.imageUrl) ?? []
  const hasMultiple = images.length > 1

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['product-reviews', product.id],
    queryFn: () => apiClient.get(`/api/products/${product.id}/reviews`).then(r => r.data ?? []),
    enabled: !!product.id,
    staleTime: 300_000,
    placeholderData: p => p ?? [],
  })
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const { data: wishlist = [] } = useQuery<{ id: number; product: { id: number } }[]>({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.get('/api/wishlist').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!user,
    staleTime: 120_000,
    placeholderData: p => p ?? [],
  })
  const isInWishlist = !!user && wishlist.some(w => w.product.id === product.id)

  const toggleWishlist = useMutation({
    mutationFn: () =>
      isInWishlist
        ? apiClient.delete(`/api/wishlist/${product.id}`)
        : apiClient.post(`/api/wishlist/${product.id}`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })
      const prev = queryClient.getQueryData<any[]>(['wishlist']) ?? []
      queryClient.setQueryData(['wishlist'],
        isInWishlist
          ? prev.filter(w => w.product.id !== product.id)
          : [...prev, { id: -Date.now(), product: { id: product.id } }]
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['wishlist'], ctx.prev)
      toast.error('Failed')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
    onSuccess: () => toast.success(isInWishlist ? 'Removed' : 'Saved'),
  })

  const addToCart = useMutation({
    mutationFn: () => apiClient.post('/api/cart/items', { productId: product.id, qty: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      cartEvents.emit({ type: 'bump' })
      toast.success('Added to cart')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed'),
  })

  const buyNow = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/cart/items', { productId: product.id, qty: 1 })
      await apiClient.post('/api/cart/checkout')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      navigate('/checkout')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed'),
  })

  const requireAuth = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { openModal('signin'); return }
    fn()
  }

  const authAddToCart = requireAuth(() => addToCart.mutate())
  const authBuyNow = requireAuth(() => buyNow.mutate())
  const authToggleWishlist = requireAuth(() => toggleWishlist.mutate())
  const shippingLabel = product.shippingType ? shippingLabels[product.shippingType] : null
  const isActive = product.status === 'ACTIVE'

  const next = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIndex(i => (i + 1) % images.length)
  }
  const prev = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIndex(i => (i - 1 + images.length) % images.length)
  }
  const goTo = (i: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setIndex(i)
  }
  const handleMouseLeave = () => {
    setCardHovered(false); setImgHovered(false); setIndex(0)
  }

  const hoverStyle = cardHovered
    ? { transform: 'translateY(-5px)', boxShadow: '0 20px 56px rgba(26,21,18,0.13), 0 6px 20px rgba(26,21,18,0.08)', borderColor: '#C8BDB5', transition: 'transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s cubic-bezier(.4,0,.2,1), border-color .3s' }
    : {}

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden cursor-pointer"
      style={{ transition: 'transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s cubic-bezier(.4,0,.2,1), border-color .3s', ...hoverStyle }}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image area */}
      <div
        className={`relative overflow-hidden w-full bg-[#F8F5F0] ${aspectSquare ? 'aspect-square' : 'h-52'}`}
        onMouseEnter={() => setImgHovered(true)}
        onMouseLeave={() => setImgHovered(false)}
      >
        {/* Top-left: Wishlist heart */}
        <button
          type="button"
          onClick={authToggleWishlist}
          disabled={toggleWishlist.isPending}
          className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/75 backdrop-blur-sm border border-white/50 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white disabled:opacity-50"
        >
          <svg className={`w-4 h-4 transition-colors duration-200 ${isInWishlist ? 'text-[#E07B3F]' : 'text-[#1A1512]'}`} fill={isInWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Top-right: Shipping badge */}
        {shippingLabel && (
          <span className="absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(26,21,18,0.75)' }}>
            <span className="text-white">{shippingLabel}</span>
          </span>
        )}

        <button
          type="button"
          onClick={() => onImageClick(images.map(i => ({ url: i.imageUrl! })), index)}
          className="relative h-full w-full block"
        >
          {images.length > 0 ? (
            images.map((img, i) => (
              <img
                key={i}
                src={img.imageUrl}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain mix-blend-multiply"
                style={{
                  opacity: i === index ? 1 : 0,
                  transform: i === index ? (cardHovered ? 'scale(1.06)' : 'scale(1)') : 'scale(0.95)',
                  transition: 'opacity .45s ease, transform .5s cubic-bezier(.4,0,.2,1)',
                }}
              />
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="w-10 h-10 text-[#C8BDB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
            </div>
          )}
        </button>

        {/* Image counter */}
        {hasMultiple && imgHovered && (
          <span className="absolute top-12 right-3 px-2 py-0.5 text-[10px] font-bold text-white rounded-full"
            style={{ background: 'rgba(26,21,18,0.5)', backdropFilter: 'blur(8px)' }}>
            {index + 1}/{images.length}
          </span>
        )}

        {/* Nav arrows */}
        {hasMultiple && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm border border-[#E8DDD4] text-[#1A1512] hover:bg-white hover:scale-110 transition-all"
              style={{ opacity: imgHovered ? 1 : 0, transform: `translateY(-50%) translateX(${imgHovered ? '0' : '-6px'})`, transition: 'opacity .2s, transform .2s' }}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm border border-[#E8DDD4] text-[#1A1512] hover:bg-white hover:scale-110 transition-all"
              style={{ opacity: imgHovered ? 1 : 0, transform: `translateY(-50%) translateX(${imgHovered ? '0' : '6px'})`, transition: 'opacity .2s, transform .2s' }}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={goTo(i)}
                className="rounded-full bg-white transition-all duration-300"
                style={{ width: i === index ? '16px' : '6px', height: '6px', opacity: i === index ? 1 : 0.5 }}/>
            ))}
          </div>
        )}

        {/* Action bar overlay (card hover) — Buy Now + Add to Cart */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 pb-3 pt-6"
          style={{
            opacity: cardHovered ? 1 : 0,
            transform: cardHovered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity .25s, transform .25s',
            background: 'linear-gradient(to top, rgba(26,21,18,0.3) 0%, transparent 100%)',
            pointerEvents: cardHovered ? 'auto' : 'none',
          }}
        >
          <button
            type="button"
            onClick={authAddToCart}
            disabled={addToCart.isPending || !isActive}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1A1512] shadow-md transition-all duration-200 hover:bg-[#E07B3F] hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            Add to Cart
          </button>
          <button
            type="button"
            onClick={authBuyNow}
            disabled={buyNow.isPending || !isActive}
            className="flex items-center gap-1.5 rounded-full bg-[#1A1512] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#E07B3F] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
            Buy Now
          </button>
        </div>
      </div>

      {/* Card body */}
      <Link to={`/products/${product.id}`} className="flex flex-col flex-1 p-4">
        {showCategory && product.category && (
          <span className="mb-1 text-[10px] uppercase tracking-[0.15em] text-[#8C7564] font-semibold">
            {product.category.name}
          </span>
        )}
        <h3 className={`text-sm font-semibold leading-snug text-[#1A1512] mb-1 ${truncateName ? 'truncate' : 'line-clamp-2'} group-hover:text-[#E07B3F] transition-colors duration-200`}>
          {product.name}
        </h3>
        <StarRow avg={avgRating} count={reviews.length} />
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="font-bold text-[#1A1512] text-base">
            ৳{product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: priceFractionDigits })}
          </span>
        </div>
      </Link>
    </div>
  )
}
