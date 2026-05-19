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
  customer: { id: number; displayName: string; email: string }
  status: string
  totalBdt: number
  subtotalBdt: number
  shippingFeeBdt: number
  createdAt: string
  items: OrderItem[]
}

const STATUS_FLOW: Record<string, string[]> = {
  PLACED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export default function VendorOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchOrders = () => {
    setLoading(true)
    apiClient.get('/api/vendor/orders/list')
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (orderId: number, status: string) => {
    setUpdating(true)
    try {
      await apiClient.put(`/api/vendor/orders/${orderId}/status`, { status })
      toast.success(`Order #${orderId} updated to ${status}`)
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  if (!user) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in as a vendor</p></div>
  }

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      PLACED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-amber-100 text-amber-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return colors[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Order Management</h1>
        <p className="mt-2 text-sm text-[#8c7564]">Manage incoming orders, update status, and communicate with customers</p>

        <div className="mt-6 flex gap-2 flex-wrap">
          {['ALL', 'PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(tab => (
            <button key={tab} onClick={() => {/* filter could be added */}}
              className="rounded-full border border-[#d7c7b8] px-4 py-1.5 text-xs font-semibold text-[#221b16] hover:bg-white">
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
            No orders yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map(order => (
              <div key={order.id} className="rounded-2xl border border-[#e4d6c8] bg-white overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#221b16]">Order #{order.id}</h3>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor(order.status)}`}>{order.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#8c7564]">
                        {new Date(order.createdAt).toLocaleDateString()} · {order.customer?.displayName || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#221b16]">৳{order.totalBdt?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="mt-4 space-y-2">
                    {(order.items || []).map(item => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#f9f5f0] p-3">
                        <div className="h-10 w-10 rounded-lg bg-[#f0e8df] overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#a28672]">📷</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#221b16] truncate">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-[#8c7564]">x{item.qty} · ৳{item.unitPriceBdt?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {(STATUS_FLOW[order.status] || []).map(nextStatus => (
                      <button
                        key={nextStatus}
                        onClick={() => updateStatus(order.id, nextStatus)}
                        disabled={updating}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                          nextStatus === 'CANCELLED'
                            ? 'border border-red-300 text-red-600 hover:bg-red-50'
                            : 'bg-[#221b16] text-[#f9f5f0] hover:bg-[#3a2d24]'
                        }`}
                      >
                        {nextStatus === 'CANCELLED' ? 'Decline / Cancel' : `Mark as ${nextStatus}`}
                      </button>
                    ))}
                    <Link to={`/messages?userId=${order.customer?.id}`}
                      className="rounded-full border border-[#d7c7b8] px-4 py-1.5 text-xs font-semibold text-[#221b16] hover:bg-[#f9f5f0]">
                      💬 Chat
                    </Link>
                    <button onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="rounded-full border border-[#d7c7b8] px-4 py-1.5 text-xs font-semibold text-[#221b16] hover:bg-[#f9f5f0]">
                      👤 Customer
                    </button>
                  </div>

                  {/* Customer info */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-4 rounded-xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
                      <p className="text-sm font-semibold text-[#221b16]">Customer Details</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#221b16] flex items-center justify-center text-sm font-bold text-[#f9f5f0]">
                          {order.customer?.displayName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#221b16]">{order.customer?.displayName}</p>
                          <p className="text-xs text-[#8c7564]">{order.customer?.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
