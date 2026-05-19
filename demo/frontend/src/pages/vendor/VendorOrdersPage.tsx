import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

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
  createdAt: string
  items: OrderItem[]
}

const STATUS_FLOW: Record<string, { next: string[]; label: string; color: string; dot: string }> = {
  PLACED: { next: ['PROCESSING', 'CANCELLED'], label: 'Placed', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  PROCESSING: { next: ['SHIPPED', 'CANCELLED'], label: 'Processing', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  SHIPPED: { next: ['DELIVERED'], label: 'Shipped', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  DELIVERED: { next: [], label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  CANCELLED: { next: [], label: 'Cancelled', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

const ALL_STATUSES = ['ALL', 'PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function VendorOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchOrders = () => {
    setLoading(true)
    apiClient.get('/api/vendor/orders/list')
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (orderId: number, status: string) => {
    setUpdating(orderId)
    try {
      await apiClient.put(`/api/vendor/orders/${orderId}/status`, { status })
      toast.success(`Order #${orderId} → ${status}`)
      fetchOrders()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

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

  const Timeline = ({ status }: { status: string }) => {
    const steps = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const currentIdx = steps.indexOf(status)
    const isCancelled = status === 'CANCELLED'
    return (
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = currentIdx >= i
          const isLast = i === steps.length - 1
          return (
            <div key={s} className="flex items-center">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
                isCancelled ? 'bg-gray-200' :
                done ? 'bg-emerald-500' : 'bg-gray-200'
              }`}>
                {done && !isCancelled ? (
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                ) : (
                  <div className={`h-1.5 w-1.5 rounded-full ${isCancelled ? 'bg-red-400' : 'bg-white'}`} />
                )}
              </div>
              {!isLast && (
                <div className={`h-0.5 w-6 sm:w-10 transition-all duration-500 ${
                  isCancelled ? 'bg-gray-200' :
                  currentIdx > i ? 'bg-emerald-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p></div>
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
      <div className="border-b border-[#e4d6c8] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="font-[Fraunces] text-3xl tracking-tight text-[#221b16]">Orders</h1>
          <p className="mt-1 text-sm text-[#8c7564]">Manage incoming orders, update status, and communicate with customers</p>

          {/* Status counts */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {ALL_STATUSES.map(s => {
              const active = filter === s
              const isDestructive = s === 'CANCELLED'
              const count = orderCounts[s] || 0
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`relative shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? isDestructive ? 'bg-red-600 text-white shadow-sm' : 'bg-[#221b16] text-[#f9f5f0] shadow-sm'
                      : 'border border-[#d7c7b8] text-[#6c5b4f] hover:bg-white hover:border-[#b8a494]'
                  }`}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  {count > 0 && (
                    <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#f0e8df] text-[#6c5b4f]'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#e4d6c8] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f5f0]">
              <svg className="h-8 w-8 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </div>
            <p className="mt-4 font-semibold text-[#221b16]">No {filter === 'ALL' ? '' : filter.toLowerCase()} orders</p>
            <p className="mt-1 text-sm text-[#8c7564]">Orders will appear here when customers make purchases</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => {
              const flow = STATUS_FLOW[order.status] || STATUS_FLOW.PLACED
              const isExpanded = expandedId === order.id
              return (
                <div key={order.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-[#e4d6c8]/60 transition-all hover:shadow-md">
                  {/* Header row */}
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0e8df]">
                      {order.customer?.avatarUrl ? (
                        <img src={order.customer.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#6c5b4f]">{order.customer?.displayName?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#221b16]">#{order.id}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${flow.color}`}>
                          {flow.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#8c7564]">
                        {order.customer?.displayName} · {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <Timeline status={order.status} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#221b16]">৳{order.totalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <svg className={`h-5 w-5 shrink-0 text-[#b8a494] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[#f0e8df] px-5 pb-5">
                      {/* Items */}
                      <div className="mt-4 space-y-2">
                        {(order.items || []).map(item => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#f9f5f0] p-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f0e8df]">
                              {item.product?.images?.[0] ? (
                                <img src={item.product.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-[#a28672]">📷</div>
                              )}
                            </div>
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
                        {flow.next.map(nextStatus => (
                          <button
                            key={nextStatus}
                            onClick={() => updateStatus(order.id, nextStatus)}
                            disabled={updating === order.id}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 active:scale-[0.97] ${
                              nextStatus === 'CANCELLED'
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'bg-[#221b16] text-[#f9f5f0] hover:bg-[#3a2d24]'
                            }`}
                          >
                            {updating === order.id ? (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Updating...
                              </span>
                            ) : nextStatus === 'CANCELLED' ? 'Decline / Cancel' : `Mark ${nextStatus}`}
                          </button>
                        ))}
                        <div className="ml-auto flex gap-2">
                          <Link to={`/messages?userId=${order.customer?.id}`}
                            className="rounded-xl border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0]">
                            💬 Chat
                          </Link>
                          <a href={`/api/vendor/customers/${order.customer?.id}`}
                            className="rounded-xl border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#221b16] transition hover:bg-[#f9f5f0]">
                            👤 Profile
                          </a>
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
  )
}
