import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import type { Order } from '@/types'

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<{ content: Order[] }>('/orders?size=20'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">My Orders</h1>

      {!data?.content.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No orders yet</p>
          <Link to="/products" className="btn btn-secondary mt-4">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.content.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-ink-400">Order #{order.id}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  order.status === 'PAID' ? 'bg-teal-50 text-teal-700' :
                  order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-ink-950">৳{Number(order.totalBdt).toLocaleString()}</p>
              <p className="text-sm text-ink-400 mt-1">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
