import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'

type Order = {
  id: number
  status: string
  totalBdt: number
  createdAt: string
  shippingAddress: { fullName: string; addressLine: string; city: string }
}

export default function AccountOrdersPage() {
  const { user } = useAuth()

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/api/orders').then((r) => r.data),
    enabled: !!user,
  })

  if (!user) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in to view orders</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Orders</h1>
      {isLoading && <div className="mt-8 h-32 animate-pulse rounded-2xl bg-[#e4d6c8]" />}
      {orders && orders.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-[#6c5b4f]">No orders yet</p>
          <Link to="/products" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Start shopping</Link>
        </div>
      )}
      {orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a28672]">Order #{order.id}</p>
                  <p className="mt-1 font-[Fraunces] text-2xl text-[#221b16]">৳{order.totalBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="rounded-full border border-[#d7c7b8] px-4 py-1 text-xs">{order.status}</span>
              </div>
              <p className="mt-3 text-sm text-[#6c5b4f]">
                Ship to: {order.shippingAddress?.fullName}, {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}
              </p>
              <p className="mt-1 text-xs text-[#a28672]">{new Date(order.createdAt).toLocaleDateString('en-BD')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
