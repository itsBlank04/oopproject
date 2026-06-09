import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../lib/apiClient'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type OrderItem = {
  id: number
  itemType: string
  product?: { id: number; name: string; images?: { imageUrl: string }[] }
  usedListing?: { id: number }
  qty: number
  unitPriceBdt: number
}

type Order = {
  id: number
  status: string
  totalBdt: number
  subtotalBdt: number
  shippingFeeBdt: number
  discountBdt: number
  taxBdt: number
  createdAt: string
  items: OrderItem[]
  shippingAddress?: { fullName: string; addressLine: string; city: string; phone?: string }
}

type PaymentInfo = {
  payment: { id: number; amountBdt: number; method: string; status: string; paidAt: string } | null
  invoice: { id: number; invoiceNumber: string; amountBdt: number; status: string; paidAt: string; generatedAt: string } | null
}

const STATUS_META: Record<string, { label: string; color: string; badge: string; dot: string }> = {
  PLACED: { label: 'Pending', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-400' },
  APPROVED: { label: 'Approved', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  PACKED: { label: 'Packed', color: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', dot: 'bg-indigo-500' },
  SHIPPED: { label: 'Shipped', color: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border-purple-200/60', dot: 'bg-purple-500' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  PAID: { label: 'Paid', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', badge: 'bg-red-50 text-red-600 border-red-200/60', dot: 'bg-red-500' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', badge: 'bg-red-50 text-red-600 border-red-200/60', dot: 'bg-red-500' },
}

type PaymentMethod = 'BKASH' | 'NAGAD' | 'CARD' | 'COD'

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { key: 'BKASH', label: 'bKash', icon: '📱', desc: 'Pay with bKash mobile banking' },
  { key: 'NAGAD', label: 'Nagad', icon: '💳', desc: 'Pay with Nagad mobile banking' },
  { key: 'CARD', label: 'Card', icon: '💳', desc: 'Credit / Debit card payment' },
  { key: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
]

function OrderTimeline({ status }: { status: string }) {
  const steps = ['PLACED', 'APPROVED', 'PACKED', 'SHIPPED', 'DELIVERED']
  const currentIdx = steps.indexOf(status)
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
          <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <span className="text-xs font-semibold text-red-600">{status === 'REJECTED' ? 'Rejected by vendor' : 'Cancelled'}</span>
      </div>
    )
  }
  if (currentIdx < 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
        </div>
        <span className="text-xs text-gray-500">{status}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-0.5">
      {steps.slice(0, -1).map((s, i) => {
        const done = currentIdx >= i
        const isLast = i === steps.length - 2
        return (
          <div key={s} className="flex items-center">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              {done ? (
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>
            {!isLast && <div className={`h-0.5 w-5 sm:w-8 ${currentIdx > i ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

function PaymentModal({ orderId, amount, onClose }: { orderId: number; amount: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePay = async () => {
    if (!selectedMethod) return
    setIsProcessing(true)
    try {
      await apiClient.post(`/api/payments/order/${orderId}`, { method: selectedMethod })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(selectedMethod === 'COD'
        ? 'Order confirmed with Cash on Delivery!'
        : `Payment via ${selectedMethod} successful! Invoice generated.`
      )
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e4d6c8]/40 px-6 py-4">
          <h2 className="font-semibold text-[#221b16]">Select Payment Method</h2>
          <button onClick={onClose} className="text-[#8c7564] hover:text-[#221b16] transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-2 px-6 py-4">
          <p className="text-center text-sm text-[#6c5b4f] mb-3">
            Order total: <strong className="text-[#221b16]">৳{amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong>
          </p>
          {PAYMENT_METHODS.map(m => (
            <button key={m.key} onClick={() => setSelectedMethod(m.key)}
              className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                selectedMethod === m.key
                  ? 'border-[#221b16] bg-[#faf6f2]'
                  : 'border-[#e4d6c8]/60 hover:border-[#e4d6c8]'
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#221b16]">{m.label}</p>
                <p className="text-xs text-[#8c7564]">{m.desc}</p>
              </div>
              {selectedMethod === m.key && (
                <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-[#e4d6c8]/40 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#e4d6c8] px-4 py-2.5 text-sm font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition-colors">
            Cancel
          </button>
          <button onClick={handlePay} disabled={!selectedMethod || isProcessing}
            className="flex-1 rounded-xl bg-[#221b16] px-4 py-2.5 text-sm font-semibold text-[#faf6f2] transition hover:bg-[#3a3028] disabled:opacity-40">
            {isProcessing ? (
              <span className="inline-flex items-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</span>
            ) : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelButton({ orderId, createdAt }: { orderId: number; createdAt: string }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const hoursSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60))
  const canCancel = hoursSinceCreation < 24

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await apiClient.put(`/api/orders/${orderId}/cancel`)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled')
      setConfirming(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-red-600 font-medium">Cancel order?</span>
        <button onClick={handleCancel} disabled={cancelling}
          className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
          {cancelling ? '...' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="rounded-lg border border-[#e4d6c8] px-2.5 py-1.5 text-xs font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition">
          No
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => canCancel ? setConfirming(true) : toast.error('Cancellation window has expired (24 hours)')}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
        canCancel
          ? 'border-red-200/60 text-red-600 hover:bg-red-50'
          : 'border-[#e4d6c8] text-[#e4d6c8] cursor-not-allowed'
      }`}>
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {canCancel ? 'Cancel' : 'Expired'}
    </button>
  )
}

export default function AccountOrdersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<Record<number, PaymentInfo>>({})
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: orders, isLoading, isError, error } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.get('/api/orders')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!user,
    placeholderData: (prev) => prev,
  })

  const fetchPaymentInfo = async (orderId: number) => {
    try {
      const res = await apiClient.get(`/api/payments/order/${orderId}`)
      setPaymentInfo(prev => ({ ...prev, [orderId]: res.data }))
    } catch {}
  }

  const handleExpand = (id: number) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    fetchPaymentInfo(id)
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf6f2]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#221b16] mb-4">
            <svg className="h-7 w-7 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          </div>
          <p className="text-sm text-[#6c5b4f] mb-4">Sign in to view your orders</p>
          <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] transition hover:bg-[#3a3028]">
            Sign in
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <p className="text-sm font-semibold text-[#221b16]">Failed to load orders</p>
          <p className="text-xs text-[#8c7564] mt-1">{(error as any)?.message || 'Something went wrong'}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] transition hover:bg-[#3a3028]">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .anim-fade { animation: fadeSlideUp 0.4s ease-out both; }
        .anim-fade-1 { animation-delay: 0.05s; }
        .anim-fade-2 { animation-delay: 0.1s; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {payingOrderId && (
        <PaymentModal
          orderId={payingOrderId}
          amount={orders?.find(o => o.id === payingOrderId)?.totalBdt ?? 0}
          onClose={() => setPayingOrderId(null)}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="anim-fade anim-fade-1">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221b16] shadow-sm">
              <svg className="h-5 w-5 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#221b16] tracking-tight">My Orders</h1>
              <p className="text-xs text-[#8c7564] mt-0.5">Track, pay, and manage your purchases</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4 anim-fade">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#f9f5f0]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-[#f9f5f0]" />
                    <div className="h-3 w-1/4 rounded bg-[#f9f5f0]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && orders && orders.length === 0 && (
          <div className="anim-fade anim-fade-2 rounded-2xl border-2 border-dashed border-[#e4d6c8] p-12 sm:p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
              <svg className="h-8 w-8 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="mt-4 font-semibold text-[#221b16]">No orders yet</p>
            <p className="mt-1 text-sm text-[#8c7564]">When you place an order, it will appear here</p>
            <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] transition hover:bg-[#3a3028]">
              Start shopping
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!isLoading && orders && orders.length > 0 && (
          <div className="space-y-4 anim-fade anim-fade-2">
            {orders.map((order, idx) => {
              const meta = STATUS_META[order.status] || STATUS_META.PLACED
              const isExpanded = expandedId === order.id
              const pinfo = paymentInfo[order.id]
              const totalItems = order.items?.reduce((s, i) => s + i.qty, 0) || 0
              return (
                <div key={order.id} className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 transition-all hover:shadow-md" style={{ animationDelay: `${idx * 0.04}s` }}>
                  {/* Collapsed header */}
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer select-none"
                    onClick={() => handleExpand(order.id)}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f9f5f0]">
                      <svg className="h-5 w-5 text-[#6c5b4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#221b16]">Order #{order.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}>{meta.label}</span>
                      </div>
                      <p className="text-xs text-[#8c7564] mt-0.5">
                        {totalItems} item{totalItems !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <OrderTimeline status={order.status} />
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-[Fraunces] text-lg font-semibold text-[#221b16]">৳{order.totalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <svg className={`h-5 w-5 shrink-0 text-[#e4d6c8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[#e4d6c8]/40 px-4 sm:px-5 pb-5">
                      {/* Items */}
                      <div className="mt-4 space-y-2">
                        {(order.items || []).map(item => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#faf6f2] p-3">
                            <button type="button" onClick={() => { const u = item.product?.images?.[0]?.imageUrl; if (u) setLightboxUrl(u) }}
                              className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f9f5f0]">
                              {item.product?.images?.[0]?.imageUrl ? (
                                <img src={item.product.images[0].imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-[#8c7564]">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                </div>
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#221b16] truncate">{item.product?.name || 'Product'}</p>
                              <p className="text-xs text-[#8c7564]">Qty: {item.qty} · ৳{item.unitPriceBdt?.toLocaleString()} each</p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-[#221b16]">৳{(item.unitPriceBdt * item.qty).toLocaleString('en-BD')}</p>
                          </div>
                        ))}
                      </div>

                      {/* Order summary */}
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                          {order.shippingAddress && (
                            <p className="text-xs text-[#6c5b4f]">
                              <span className="font-medium text-[#221b16]">Ship to:</span> {order.shippingAddress.fullName}, {order.shippingAddress.addressLine}, {order.shippingAddress.city}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="flex justify-between gap-6 text-xs text-[#6c5b4f]">
                            <span>Subtotal</span><span>৳{order.subtotalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {order.discountBdt > 0 && (
                            <div className="flex justify-between gap-6 text-xs text-emerald-600">
                              <span>Discount</span><span>-৳{order.discountBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-6 text-xs text-[#6c5b4f]">
                            <span>Shipping</span><span>৳{order.shippingFeeBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between gap-6 font-semibold text-sm text-[#221b16] border-t border-[#e4d6c8]/40 pt-1">
                            <span>Total</span><span className="font-[Fraunces]">৳{order.totalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link to={`/messages?orderId=${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] px-3 py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#faf6f2]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                          Chat
                        </Link>
                        {order.status === 'PLACED' && (
                          <CancelButton orderId={order.id} createdAt={order.createdAt} />
                        )}
                        {order.status === 'APPROVED' && pinfo?.payment?.method === 'COD' && (
                          <button onClick={() => setPayingOrderId(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.97]">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m0 0v-.375c0-.621-.504-1.125-1.125-1.125H3.75M3.75 6h16.5M3.75 6h16.5" /></svg>
                            Pay Now
                          </button>
                        )}
                        {order.status === 'APPROVED' && (
                          <CancelButton orderId={order.id} createdAt={order.createdAt} />
                        )}
                        {pinfo?.invoice && (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2">
                            <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                            <span className="text-[10px] font-semibold text-emerald-700">
                              {pinfo.payment?.method || 'COD'} · {pinfo.invoice.status === 'PAID' ? 'Paid' : 'Unpaid'} · {pinfo.invoice.invoiceNumber}
                            </span>
                          </div>
                        )}
                        {pinfo?.invoice && (
                          <>
                            <a href={`${API_URL}/api/payments/invoice/${order.id}/download?download=false`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] px-3 py-2 text-xs font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition-colors">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              View
                            </a>
                            <a href={`${API_URL}/api/payments/invoice/${order.id}/download`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] px-3 py-2 text-xs font-medium text-[#6c5b4f] hover:bg-[#f9f5f0] transition-colors">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                              Download
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
