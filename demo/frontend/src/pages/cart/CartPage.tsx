import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

type CartItemType = {
  id: number
  itemType: string
  product: { id: number; name: string; priceBdt: number; shippingType: string; images: { imageUrl: string }[]; vendor?: { id: number; shopName?: string } }
  qty: number
}

type StockItem = {
  cartItemId: number
  productId: number
  productName: string
  requestedQty: number
  availableStock: number
  sufficient: boolean
}

type Cart = {
  id: number
  status: string
  items: CartItemType[]
  createdAt: string
  updatedAt: string
}

const STATUS_META: Record<string, { label: string; color: string; dot: string; desc: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', dot: 'bg-emerald-500', desc: 'Continue shopping' },
  PENDING_CHECKOUT: { label: 'Checkout in progress', color: 'text-[#6c5b4f]', dot: 'bg-[#6c5b4f]', desc: 'Completing your purchase' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', dot: 'bg-emerald-500', desc: 'Order placed successfully' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', dot: 'bg-red-500', desc: 'Checkout was cancelled' },
  ABANDONED: { label: 'Abandoned', color: 'text-amber-700', dot: 'bg-amber-400', desc: 'Cart expired due to inactivity' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500', dot: 'bg-gray-400', desc: 'Cart has expired' },
}

function StatusBanner({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.ACTIVE
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
      status === 'PENDING_CHECKOUT' ? 'bg-[#f9f5f0] ring-1 ring-[#e4d6c8]/60' :
      status === 'COMPLETED' ? 'bg-emerald-50 ring-1 ring-emerald-200/60' :
      status === 'CANCELLED' ? 'bg-red-50 ring-1 ring-red-200/60' :
      status === 'ABANDONED' ? 'bg-amber-50 ring-1 ring-amber-200/60' :
      status === 'EXPIRED' ? 'bg-gray-50 ring-1 ring-gray-200/60' :
      'bg-[#f9f5f0] ring-1 ring-[#e4d6c8]/60'
    }`}>
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
        <p className="text-xs text-[#8c7564]">{meta.desc}</p>
      </div>
    </div>
  )
}

function EmptyState({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-[#221b16]">Order placed!</p>
        <p className="mt-1 text-sm text-[#8c7564]">Your order has been placed successfully</p>
        <Link to="/account/orders" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] hover:bg-[#3a3028]">
          View orders
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    )
  }

  if (status === 'CANCELLED' || status === 'ABANDONED' || status === 'EXPIRED') {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0] mb-4">
          <svg className="h-8 w-8 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="font-semibold text-[#221b16]">Cart {status.toLowerCase()}</p>
        <p className="mt-1 text-sm text-[#8c7564]">Start a new shopping cart</p>
        <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] hover:bg-[#3a3028]">
          Browse products
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="anim-fade anim-fade-2 rounded-2xl border-2 border-dashed border-[#e4d6c8] p-12 sm:p-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
        <svg className="h-8 w-8 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-[#221b16]">Your cart is empty</p>
      <p className="mt-1 text-sm text-[#8c7564]">Looks like you haven't added anything yet</p>
      <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] transition hover:bg-[#3a3028]">
        Browse products
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </Link>
    </div>
  )
}

type ShippingOption = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'

const SHIPPING_RATES: Record<ShippingOption, { label: string; desc: string; fee: number }> = {
  INSIDE_DHAKA: { label: 'Inside Dhaka', desc: 'Delivery within Dhaka city', fee: 60 },
  OUTSIDE_DHAKA: { label: 'Outside Dhaka', desc: 'Delivery anywhere outside Dhaka', fee: 100 },
}

export default function CartPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/api/cart').then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 300_000,
    placeholderData: () => ({ id: 0, status: 'ACTIVE', items: [], createdAt: '', updatedAt: '' }),
  })

  const { data: stockCheck } = useQuery<StockItem[]>({
    queryKey: ['cart-stock'],
    queryFn: () => apiClient.get('/api/cart/stock-check').then(r => r.data),
    enabled: !!user && (cart?.items?.length ?? 0) > 0,
    refetchInterval: 30_000,
  })

  const stockByItem = new Map(stockCheck?.map(s => [s.cartItemId, s]))
  const hasStockIssues = stockCheck?.some(s => !s.sufficient) ?? false

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) =>
      apiClient.put(`/api/cart/items/${id}`, { qty }),
    onMutate: async ({ id, qty }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const prev = queryClient.getQueryData<Cart>(['cart'])
      if (prev) {
        queryClient.setQueryData<Cart>(['cart'], {
          ...prev,
          items: prev.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['cart'], ctx.prev)
      toast.error('Failed to update quantity')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const removeItem = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/cart/items/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const prev = queryClient.getQueryData<Cart>(['cart'])
      if (prev) {
        queryClient.setQueryData<Cart>(['cart'], {
          ...prev,
          items: prev.items.filter((i) => i.id !== id),
        })
      }
      return { prev }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['cart'], ctx.prev)
      console.error('Remove item error:', err)
      toast.error((err as any).response?.data?.error || err.message || 'Failed to remove item')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#221b16] mb-4">
            <svg className="h-8 w-8 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="font-semibold text-[#221b16]">Sign in to view your cart</p>
          <p className="text-sm text-[#8c7564] mt-1">You need to be signed in to shop</p>
          <Link to="/auth/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] hover:bg-[#3a3028]">
            Sign in
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>
    )
  }

  const status = cart?.status || 'ACTIVE'
  const items = cart?.items ?? []
  const itemCount = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + (i.product?.priceBdt ?? 0) * i.qty, 0)
  const hasPaidShipping = items.some(i => i.product?.shippingType === 'PAID')
  const shippingFee = hasPaidShipping && shippingOption ? SHIPPING_RATES[shippingOption].fee : 0
  const total = subtotal + shippingFee
  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }
        .anim-fade { animation: fadeSlideUp 0.4s ease-out both; }
        .anim-fade-1 { animation-delay: 0.05s; }
        .anim-fade-2 { animation-delay: 0.1s; }
        .anim-fade-3 { animation-delay: 0.15s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="anim-fade anim-fade-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221b16] shadow-sm">
                <svg className="h-5 w-5 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#221b16] tracking-tight">
                  Shopping Cart
                </h1>
                <p className="text-xs text-[#8c7564] mt-0.5">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status banner — only for non-active states */}
        {status !== 'ACTIVE' && (
          <div className="anim-fade anim-fade-1 mb-5">
            <StatusBanner status={status} />
          </div>
        )}

        {/* PENDING_CHECKOUT state */}
        {status === 'PENDING_CHECKOUT' && (
          <div className="anim-fade anim-fade-2 rounded-2xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f9f5f0] mb-4">
              <svg className="h-7 w-7 text-[#6c5b4f] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="font-semibold text-[#221b16]">Checkout in progress</p>
            <p className="text-sm text-[#8c7564] mt-1">Complete your checkout to place the order</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button onClick={() => navigate('/checkout')} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a3028] transition">
                Continue checkout
              </button>
            </div>
          </div>
        )}

        {/* Non-empty, non-PENDING_CHECKOUT state */}
        {status !== 'PENDING_CHECKOUT' && items.length > 0 && status === 'ACTIVE' && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Items */}
            <div className="space-y-3 anim-fade anim-fade-2">
              {items.map((item, idx) => {
                const unitPrice = item.product?.priceBdt ?? 0
                const lineTotal = unitPrice * item.qty
                return (
                  <div key={item.id}
                    className="group flex items-center gap-3 sm:gap-4 rounded-2xl bg-white p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 transition-all hover:shadow-md"
                    style={{ animationDelay: `${idx * 0.04}s` }}>
                    {/* Image */}
                    <button type="button" onClick={() => { const u = item.product?.images?.[0]?.imageUrl; if (u) setLightboxUrl(u) }}
                      className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-[#f9f5f0]">
                      {item.product?.images?.[0]?.imageUrl ? (
                        <img src={item.product.images[0].imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-6 w-6 text-[#8c7564]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.product?.id}`} className="text-sm font-semibold text-[#221b16] hover:underline truncate block">
                        {item.product?.name || 'Product'}
                      </Link>
                      <p className="text-xs text-[#8c7564] mt-0.5">৳{unitPrice.toLocaleString('en-BD', { minimumFractionDigits: 2 })} each</p>
                      {stockByItem.get(item.id) && !stockByItem.get(item.id)!.sufficient && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          Only {stockByItem.get(item.id)!.availableStock} in stock — reduce quantity
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty.mutate({ id: item.id, qty: Math.max(1, item.qty - 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4d6c8] text-sm font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition active:scale-90">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#221b16] tabular-nums">{item.qty}</span>
                      <button onClick={() => updateQty.mutate({ id: item.id, qty: item.qty + 1 })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4d6c8] text-sm font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition active:scale-90">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>
                    </div>

                    {/* Total price */}
                    <div className="text-right shrink-0 w-20 sm:w-24">
                      <p className="font-[Fraunces] text-sm font-semibold text-[#221b16]">৳{lineTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeItem.mutate(item.id)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-[#e4d6c8] hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Shipping option selector */}
            {hasPaidShipping && (
              <div className="anim-fade anim-fade-3">
                <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
                  <h2 className="font-semibold text-[#221b16] mb-3">Delivery Area</h2>
                  <p className="text-xs text-[#8c7564] mb-3">Some items have paid shipping — choose your delivery location</p>
                  <div className="space-y-2">
                    {(Object.entries(SHIPPING_RATES) as [ShippingOption, typeof SHIPPING_RATES[ShippingOption]][]).map(([key, rate]) => (
                      <button key={key} onClick={() => setShippingOption(key)}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                          shippingOption === key
                            ? 'border-[#221b16] bg-[#faf6f2]'
                            : 'border-[#e4d6c8]/60 hover:border-[#e4d6c8]'
                        }`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          shippingOption === key ? 'bg-[#221b16] text-[#faf6f2]' : 'bg-[#f9f5f0] text-[#6c5b4f]'
                        }`}>
                          {key === 'INSIDE_DHAKA' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#221b16]">{rate.label}</p>
                          <p className="text-xs text-[#8c7564]">{rate.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-[#221b16]">৳{rate.fee}</p>
                        </div>
                        {shippingOption === key && (
                          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="anim-fade anim-fade-3">
              <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
                <h2 className="font-semibold text-[#221b16] mb-4">Order Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6c5b4f]">
                    <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                    <span className="font-medium text-[#221b16]">৳{subtotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[#6c5b4f]">
                    <span>Shipping</span>
                    <span className="font-medium text-[#221b16]">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        `৳${shippingFee.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e4d6c8]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#221b16]">Total</span>
                    <span className="font-[Fraunces] text-xl font-bold text-[#221b16]">৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {hasStockIssues && (
                  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200/60">
                    <p className="text-xs font-semibold text-red-700">Some items are out of stock</p>
                    <p className="text-xs text-red-600 mt-0.5">Reduce quantities or remove out-of-stock items to proceed.</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (hasPaidShipping && !shippingOption) {
                      toast.error('Please select a delivery area')
                      return
                    }
                    navigate(hasPaidShipping ? `/checkout?shipping=${shippingOption}` : '/checkout')
                  }}
                  disabled={hasStockIssues}
                  className={`mt-5 w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98] ${
                    hasStockIssues
                      ? 'bg-[#e4d6c8] text-[#8c7564] cursor-not-allowed'
                      : 'bg-[#221b16] text-[#faf6f2] hover:bg-[#3a3028]'
                  }`}>
                  Proceed to Checkout
                </button>

                <Link to="/products"
                  className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl border border-[#e4d6c8] py-2.5 text-xs font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (status === 'ACTIVE' || status === 'COMPLETED' || status === 'CANCELLED' || status === 'ABANDONED' || status === 'EXPIRED') && (
          <div className="anim-fade anim-fade-2">
            <EmptyState status={status} />
          </div>
        )}
      </div>
      {lightboxUrl && (
        <ImageLightbox
          images={[{ url: lightboxUrl }]}
          initialIndex={0}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  )
}
