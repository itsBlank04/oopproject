import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { DollarSign, TrendingUp, Wallet, Calendar, Download } from 'lucide-react'

type Shop = { id: number; name: string; slug: string }
type SalesDataPoint = { label: string; totalSale: number; netPayout: number; orderCount: number }
type Order = { id: number; orderId: number; productName: string; qty: number; saleAmountBdt: number; netPayoutBdt: number; status: string; createdAt: string }
type Analytics = { salesData: SalesDataPoint[]; totalRevenue: number; totalOrders: number; totalProducts: number; pendingOrders: number; uniqueCustomers: number }

export default function VendorFinancialPage() {
  const { user, hasRole } = useAuth()
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['vendor-analytics-financial', selectedShopId, timeRange],
    queryFn: () => apiClient.get('/api/vendor/analytics', { params: { shopId: selectedShopId || undefined, timeRange } }).then(r => r.data),
    enabled: !!user && hasRole('VENDOR'),
  })

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['vendor-orders-financial', selectedShopId],
    queryFn: () => apiClient.get('/api/vendor/orders', { params: { shopId: selectedShopId || undefined } }).then(r => r.data),
    enabled: !!user && hasRole('VENDOR'),
  })

  const { data: shops = [] } = useQuery<Shop[]>({
    queryKey: ['vendor-shops'],
    queryFn: () => apiClient.get('/api/shops/vendor').then(r => r.data),
    enabled: !!user && hasRole('VENDOR'),
  })

  const totalRevenue = analytics?.totalRevenue ?? 0
  const totalOrders = analytics?.totalOrders ?? 0
  const pendingCount = analytics?.pendingOrders ?? 0
  const pendingPayout = orders.filter(o => o.status === 'PENDING').reduce((s, o) => s + o.netPayoutBdt, 0)
  const paidPayout = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + o.netPayoutBdt, 0)

  if (!user || !hasRole('VENDOR')) return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6f2]">
      <p className="text-sm text-[#8c7564]">Vendor access required.</p>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen bg-[#faf6f2] py-12 px-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-8">
        <div className="h-10 w-64 rounded-xl bg-[#e4d6c8]/30" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl bg-[#e4d6c8]/30" />)}
        </div>
        <div className="h-80 rounded-xl bg-[#e4d6c8]/30" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf6f2] py-12 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h1 className="font-[Fraunces] text-4xl font-bold text-[#221b16]">Financial Overview</h1>
            <p className="text-sm text-[#8c7564] mt-2">Track your revenue, payouts, and shop performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedShopId ?? ''} onChange={e => setSelectedShopId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-xl border border-[#e4d6c8] bg-white px-3.5 py-2 text-xs font-semibold text-[#6c5b4f] outline-none focus:border-[#221b16]">
              <option value="">All Shops</option>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] bg-white px-3.5 py-2 text-xs font-semibold text-[#6c5b4f] hover:bg-[#f9f5f0] transition">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-10">
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Total Revenue</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="font-[Fraunces] text-2xl font-bold text-[#221b16]">৳{totalRevenue.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-[#8c7564]">{totalOrders} orders</p>
          </div>
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Pending Payouts</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="font-[Fraunces] text-2xl font-bold text-[#221b16]">৳{pendingPayout.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-[#8c7564]">{pendingCount} awaiting payment</p>
          </div>
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Paid Out</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e4d6c8]/40 text-[#6c5b4f]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="font-[Fraunces] text-2xl font-bold text-[#221b16]">৳{paidPayout.toLocaleString()}</p>
            <p className="mt-1 text-[10px] text-[#8c7564]">Total paid commissions</p>
          </div>
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Products</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f9f5f0] text-[#6c5b4f]">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="font-[Fraunces] text-2xl font-bold text-[#221b16]">{analytics?.totalProducts ?? 0}</p>
            <p className="mt-1 text-[10px] text-[#8c7564]">{analytics?.uniqueCustomers ?? 0} unique customers</p>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-[#e4d6c8]/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e4d6c8]/30 px-6 py-4">
            <div>
              <h2 className="font-[Fraunces] text-lg font-bold text-[#221b16]">Revenue vs Payouts</h2>
              <p className="text-[10px] text-[#8c7564]">Sales and net payout over time</p>
            </div>
            <div className="flex rounded-lg border border-[#e4d6c8] p-0.5">
              {(['daily', 'weekly', 'monthly'] as const).map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded text-[10px] font-semibold transition ${timeRange === r ? 'bg-[#221b16] text-white' : 'text-[#8c7564] hover:text-[#221b16]'}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {analytics?.salesData && analytics.salesData.length > 0 ? (
              <div className="space-y-3">
                {analytics.salesData.slice(-12).map((d, i) => {
                  const maxVal = Math.max(...analytics.salesData.map(s => Math.max(s.totalSale, s.netPayout)), 1)
                  const salePct = (d.totalSale / maxVal) * 100
                  const payoutPct = (d.netPayout / maxVal) * 100
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-20 shrink-0 text-[#8c7564] font-medium">{d.label}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-[#e4d6c8]/30 overflow-hidden">
                            <div className="h-full rounded-full bg-[#221b16] transition-all" style={{ width: `${salePct}%` }} />
                          </div>
                          <span className="w-16 text-right text-[10px] font-semibold text-[#221b16]">৳{d.totalSale.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-[#e4d6c8]/30 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${payoutPct}%` }} />
                          </div>
                          <span className="w-16 text-right text-[10px] font-semibold text-emerald-600">৳{d.netPayout.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-[10px] text-[#8c7564]">No sales data yet.</div>
            )}
          </div>
        </div>

        {/* Earnings by Shop & Recent Transactions */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Earnings by Shop */}
          {selectedShopId === null && (
            <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm">
              <h2 className="font-[Fraunces] text-lg font-bold text-[#221b16] mb-5">Earnings by Shop</h2>
              {shops.length === 0 ? (
                <p className="text-[10px] text-[#8c7564]">No shops yet.</p>
              ) : (
                <div className="space-y-3">
                  {shops.map(s => {
                    const shopOrders = orders.filter(o => o.productName && o.status === 'PAID')
                    const shopTotal = shopOrders.reduce((sum, o) => sum + o.netPayoutBdt, 0)
                    const pct = totalRevenue > 0 ? (shopTotal / totalRevenue) * 100 : 0
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e4d6c8]/30 bg-[#faf6f2] px-4 py-3 hover:bg-[#f9f5f0] transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221b16] text-xs font-bold text-white">{s.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-semibold text-[#221b16]">{s.name}</p>
                            <p className="text-[10px] text-[#8c7564]">{pct.toFixed(0)}% of total</p>
                          </div>
                        </div>
                        <span className="font-[Fraunces] text-lg font-bold text-[#221b16]">৳{shopTotal.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm">
            <h2 className="font-[Fraunces] text-lg font-bold text-[#221b16] mb-5">Recent Transactions</h2>
            {orders.length === 0 ? (
              <p className="text-[10px] text-[#8c7564]">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 10).map(o => (
                  <div key={o.id} className="flex items-center justify-between border-b border-[#e4d6c8]/20 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#221b16] truncate">{o.productName}</p>
                      <p className="text-[10px] text-[#8c7564]">{new Date(o.createdAt).toLocaleDateString('en-BD')} · Qty: {o.qty}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-semibold text-[#221b16]">৳{o.netPayoutBdt.toLocaleString()}</p>
                      <span className={`text-[9px] font-bold uppercase ${o.status === 'PAID' ? 'text-emerald-600' : o.status === 'PENDING' ? 'text-amber-600' : 'text-[#8c7564]'}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
