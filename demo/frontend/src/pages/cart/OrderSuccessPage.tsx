import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

type OrderItem = {
  id: number
  product?: { id: number; name: string; images?: { imageUrl: string }[] }
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
  items: OrderItem[]
  shippingOption: string | null
  createdAt: string
}

const DELIVERY_ESTIMATES: Record<string, string> = {
  INSIDE_DHAKA: '1-3 business days',
  OUTSIDE_DHAKA: '3-7 business days',
}

export default function OrderSuccessPage() {
  const { id } = useParams()

  const { data: order } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/api/orders/${id}`).then(r => r.data),
    enabled: !!id,
  })

  if (!order) {
    return (
      <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#8c7564]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  const itemCount = order.items.reduce((s, i) => s + i.qty, 0)
  const deliveryEstimate = order.shippingOption
    ? DELIVERY_ESTIMATES[order.shippingOption] ?? '3-7 business days'
    : '3-7 business days'

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="animate-[fadeSlideUp_0.5s_ease-out] text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-[scaleIn_0.3s_ease-out]">
            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="mt-6 font-[Fraunces] text-2xl sm:text-3xl font-semibold text-[#1a1512] tracking-tight">
            Payment Successful!
          </h1>
          <p className="mt-2 text-sm text-[#6c5b4f]">
            Your order has been placed and is being processed.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a1512] px-5 py-2">
            <span className="text-xs font-medium text-[#b8a494]">Order</span>
            <span className="font-semibold text-[#faf6f2] tracking-wider">#{order.id}</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
          <div className="border-b border-[#e4d6c8]/40 px-5 py-4">
            <h2 className="font-semibold text-sm text-[#1a1512]">Items Ordered ({itemCount})</h2>
          </div>
          <div className="divide-y divide-[#e4d6c8]/40">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f0e8df]">
                  {item.product?.images?.[0]?.imageUrl ? (
                    <img src={item.product.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-4 w-4 text-[#a28672]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1512] truncate">{item.product?.name || 'Product'}</p>
                  <p className="text-xs text-[#8c7564]">×{item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#1a1512] shrink-0">৳{(item.unitPriceBdt * item.qty).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e4d6c8]/40 px-5 py-4 space-y-1.5">
            <div className="flex justify-between text-sm text-[#6c5b4f]">
              <span>Subtotal</span>
              <span>৳{order.subtotalBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
            </div>
            {order.discountBdt > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>-৳{order.discountBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[#6c5b4f]">
              <span>Shipping</span>
              <span>{order.shippingFeeBdt === 0 ? <span className="text-emerald-600">Free</span> : `৳${order.shippingFeeBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#1a1512] pt-2 border-t border-[#e4d6c8]/40">
              <span>Total Paid</span>
              <span className="font-[Fraunces] text-lg">৳{order.totalBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3.5 ring-1 ring-blue-200/60 animate-[fadeSlideUp_0.5s_ease-out_0.15s_both]">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-700">Delivery Estimate</p>
            <p className="text-xs text-blue-600 mt-0.5">Expected within <strong>{deliveryEstimate}</strong></p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 animate-[fadeSlideUp_0.5s_ease-out_0.25s_both]">
          <Link to={`/account/orders`}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7c7b8] px-5 py-3 text-sm font-semibold text-[#1a1512] hover:bg-[#f5f0eb] transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
            Track Order
          </Link>
          <Link to="/products"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1512] px-5 py-3 text-sm font-semibold text-[#faf6f2] hover:bg-[#2d241e] transition active:scale-[0.98]">
            Continue Shopping
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
