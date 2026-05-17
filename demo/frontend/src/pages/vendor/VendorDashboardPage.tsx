import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

export default function VendorDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/vendor/dashboard').catch(() => ({ data: null })),
      apiClient.get('/api/vendor/orders').catch(() => ({ data: [] }))
    ]).then(([d, o]) => {
      setStats(d.data)
      setOrders(Array.isArray(o.data) ? o.data : o.data?.content || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] text-[#8c7564]">Loading...</div>

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Vendor Dashboard</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Revenue', value: `৳${stats?.totalRevenue?.toLocaleString() || '0'}`, icon: '💰' },
            { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦' },
            { label: 'Active Products', value: stats?.activeProducts || 0, icon: '🏷️' },
            { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: '⏳' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
              <p className="text-2xl">{s.icon}</p>
              <p className="mt-3 font-[Fraunces] text-2xl text-[#221b16]">{s.value}</p>
              <p className="mt-1 text-xs text-[#8c7564]">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          <Link to="/vendor/products" className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
            Manage Products
          </Link>
          <Link to="/vendor/auctions" className="rounded-xl border border-[#d7c7b8] px-5 py-2.5 text-sm font-semibold text-[#221b16]">
            My Auctions
          </Link>
        </div>
        <h2 className="mt-10 font-[Fraunces] text-2xl text-[#221b16]">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-[#8c7564]">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.slice(0, 10).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-[#e4d6c8] bg-white p-4">
                <div>
                  <p className="font-semibold text-[#221b16]">Order #{o.id}</p>
                  <p className="text-xs text-[#8c7564]">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#221b16]">৳{o.totalBdt?.toLocaleString()}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
