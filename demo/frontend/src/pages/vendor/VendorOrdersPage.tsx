import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import { useConfirmAction } from '../../hooks/useConfirmAction'

type OrderItem = {
  id: number
  itemType: string
  product?: { id: number; name: string; images?: { imageUrl: string }[] }
  qty: number
  unitPriceBdt: number
}

type Order = {
  id: number
  customer: { id: number; displayName: string; email: string; avatarUrl?: string }
  status: string
  totalBdt: number
  subtotalBdt: number
  shippingFeeBdt: number
  discountBdt: number
  taxBdt: number
  createdAt: string
  items: OrderItem[]
}

const STATUS_FLOW: Record<string, { next: { status: string; label: string; variant: 'primary' | 'danger' | 'ghost' }[]; label: string; color: string; dot: string }> = {
  PLACED: {
    next: [
      { status: 'APPROVED', label: 'Approve', variant: 'primary' },
      { status: 'CANCELLED', label: 'Reject', variant: 'danger' },
    ],
    label: 'Pending', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400',
  },
  APPROVED: {
    next: [
      { status: 'PACKED', label: 'Mark Packed', variant: 'primary' },
      { status: 'CANCELLED', label: 'Cancel', variant: 'danger' },
    ],
    label: 'Approved', color: 'bg-[#f9f5f0] text-[#6c5b4f]', dot: 'bg-[#6c5b4f]',
  },
  PACKED: {
    next: [
      { status: 'SHIPPED', label: 'Mark Shipped', variant: 'primary' },
      { status: 'CANCELLED', label: 'Cancel', variant: 'danger' },
    ],
    label: 'Packed', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500',
  },
  SHIPPED: {
    next: [
      { status: 'DELIVERED', label: 'Mark Delivered', variant: 'primary' },
    ],
    label: 'Shipped', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500',
  },
  DELIVERED: {
    next: [],
    label: 'Delivered', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500',
  },
  CANCELLED: {
    next: [],
    label: 'Cancelled', color: 'bg-red-50 text-red-600', dot: 'bg-red-500',
  },
  REJECTED: {
    next: [],
    label: 'Rejected', color: 'bg-red-50 text-red-600', dot: 'bg-red-500',
  },
}

const ALL_STATUSES = ['ALL', 'PLACED', 'APPROVED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED']

export default function VendorOrdersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { askConfirm, Dialogs } = useConfirmAction()
  const [filter, setFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['vendor-orders-list'],
    queryFn: () => apiClient.get('/api/vendor/orders/list').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiClient.put(`/api/vendor/orders/${orderId}/status`, { status }),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['vendor-orders-list'] })
      const prev = queryClient.getQueryData<any[]>(['vendor-orders-list'])
      if (prev) {
        queryClient.setQueryData(['vendor-orders-list'], prev.map(o =>
          o.id === orderId ? { ...o, status } : o
        ))
      }
      return { prev }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['vendor-orders-list'] }),
  })

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)
  const orderCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === 'ALL' ? orders.length : orders.filter(o => o.status === s).length
    return acc
  }, {} as Record<string, number>)

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf6f2]">
        <div className="text-center">
          <p className="text-sm text-[#6c5b4f]">Sign in as a vendor</p>
          <Link to="/auth/login" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] transition">Sign in</Link>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="anim-fade anim-fade-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221b16] shadow-sm">
              <svg className="h-5 w-5 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#221b16] tracking-tight">Orders</h1>
              <p className="text-xs text-[#8c7564] mt-0.5">Manage incoming orders, approve or reject, and track fulfillment</p>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {ALL_STATUSES.map(s => {
              const active = filter === s
              const count = orderCounts[s] || 0
              const isDestructive = s === 'CANCELLED' || s === 'REJECTED'
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? isDestructive ? 'bg-red-600 text-white shadow-sm' : 'bg-[#221b16] text-[#faf6f2] shadow-sm'
                      : 'border border-[#e4d6c8] text-[#6c5b4f] hover:bg-white hover:border-[#e4d6c8]'
                  }`}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  {count > 0 && (
                    <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#f9f5f0] text-[#6c5b4f]'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders */}
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#f9f5f0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-[#f9f5f0]" />
                      <div className="h-3 w-1/4 rounded bg-[#f9f5f0]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="anim-fade rounded-2xl border-2 border-dashed border-[#e4d6c8] p-12 sm:p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
                <svg className="h-8 w-8 text-[#e4d6c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-[#221b16]">No {filter === 'ALL' ? '' : filter.toLowerCase()} orders</p>
              <p className="mt-1 text-sm text-[#8c7564]">Orders will appear here when customers make purchases</p>
            </div>
          ) : (
            <div className="space-y-4 anim-fade">
              {filtered.map((order, idx) => {
                const flow = STATUS_FLOW[order.status] || STATUS_FLOW.PLACED
                const isExpanded = expandedId === order.id
                const totalItems = order.items?.reduce((s, i) => s + i.qty, 0) || 0
                return (
                  <div key={order.id} className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 transition-all hover:shadow-md" style={{ animationDelay: `${idx * 0.03}s` }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <button type="button" onClick={() => order.customer?.avatarUrl ? setLightboxUrl(order.customer.avatarUrl) : null}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f9f5f0]">
                        {order.customer?.avatarUrl ? (
                          <img src={order.customer.avatarUrl} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#6c5b4f]">{order.customer?.displayName?.[0] || '?'}</span>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#221b16]">#{order.id}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${flow.color}`}>{flow.label}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#8c7564]">
                          {order.customer?.displayName} · {totalItems} item{totalItems !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-[Fraunces] text-lg font-semibold text-[#221b16]">৳{order.totalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <svg className={`h-5 w-5 shrink-0 text-[#e4d6c8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t border-[#e4d6c8]/40 px-4 sm:px-5 pb-5">
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

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {flow.next.map(action => (
                            <button key={action.status}
                              onClick={() => {
                                const isCancel = action.status === 'CANCELLED'
                                askConfirm({
                                  title: isCancel ? 'Cancel order' : 'Update order status',
                                  description: isCancel
                                    ? `Cancel Order #${order.id}? Customer will be notified. Reversal requires admin override.`
                                    : `Set Order #${order.id} status to ${action.status}?`,
                                  tone: isCancel ? 'danger' : 'default',
                                  label: `Order #${order.id} updated`,
                                  request: () => updateStatusMutation.mutateAsync({ orderId: order.id, status: action.status }),
                                })
                              }}
                              disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
                                action.variant === 'primary'
                                  ? 'bg-[#221b16] text-[#faf6f2] hover:bg-[#3a3028]'
                                  : action.variant === 'danger'
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border border-[#e4d6c8] text-[#221b16] hover:bg-[#faf6f2]'
                              }`}>
                              {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id ? (
                                <span className="flex items-center gap-1.5">
                                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                  Updating...
                                </span>
                              ) : (
                                <>
                                  {action.variant === 'danger' ? (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  ) : action.label === 'Approve' ? (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                  ) : (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                  )}
                                  {action.label}
                                </>
                              )}
                            </button>
                          ))}
                          <div className="ml-auto flex gap-2">
                            <Link to={`/messages?orderId=${order.id}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] px-3.5 py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#faf6f2]">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                              Chat
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {lightboxUrl && (
        <ImageLightbox
          images={[{ url: lightboxUrl }]}
          initialIndex={0}
          onClose={() => setLightboxUrl(null)}
        />
      )}
      {Dialogs}
    </div>
  )
}
