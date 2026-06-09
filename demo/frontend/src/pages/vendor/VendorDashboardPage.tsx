import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronDown, Store, CreditCard, ChevronRight } from 'lucide-react'

type Shop = {
  id: number
  name: string
  slug: string
  status: string
  logoUrl: string
}

type Stats = {
  vendorId: number
  shopName: string
  verificationStatus: string
  totalAuctions: number
  activeAuctions: number
  pendingAuctions: number
  totalProducts: number
  totalOrders: number
  pendingCommissions: number
  totalEarned: number
  shops?: Shop[]
}

type SalesDataPoint = {
  label: string
  totalSale: number
  netPayout: number
  orderCount: number
}

type TopProduct = {
  name: string
  totalRevenue: number
}

type MostViewedProduct = {
  name: string
  viewCount: number
}

type Order = {
  id: number
  orderId: number
  productName: string
  qty: number
  saleAmountBdt: number
  netPayoutBdt: number
  status: string
  createdAt: string
}

type Product = {
  id: number
  name: string
  priceBdt: number
  status: string
  images?: { imageUrl: string }[]
}

type Analytics = {
  salesData: SalesDataPoint[]
  timeRange: string
  topProducts: TopProduct[]
  mostViewedProducts: MostViewedProduct[]
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  pendingOrders: number
  uniqueCustomers: number
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

export default function VendorDashboardPage() {
  const { user } = useAuth()
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  const { data: stats } = useQuery<Stats | null>({
    queryKey: ['vendor-dashboard', selectedShopId],
    queryFn: () => apiClient.get('/api/vendor/dashboard', { params: { shopId: selectedShopId } }).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: analytics } = useQuery<Analytics | null>({
    queryKey: ['vendor-analytics', selectedShopId, timeRange],
    queryFn: () => apiClient.get('/api/vendor/analytics', { params: { shopId: selectedShopId, timeRange } }).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['vendor-orders', selectedShopId],
    queryFn: () => apiClient.get('/api/vendor/orders', { params: { shopId: selectedShopId } }).then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['vendor-products', selectedShopId],
    queryFn: () => apiClient.get('/api/vendor/products', { params: { shopId: selectedShopId } }).then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length
  const draftProducts = products.filter(p => p.status === 'DRAFT').length
  const totalRevenue = analytics?.totalRevenue ?? stats?.totalEarned ?? 0
  const totalOrders = analytics?.totalOrders ?? stats?.totalOrders ?? 0
  const pendingOrders = analytics?.pendingOrders ?? stats?.pendingCommissions ?? 0

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200/60',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200/60',
  }

  const currentShop = stats?.shops?.find(s => s.id === selectedShopId)

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes growWidth {
          from { width: 0; }
        }
        .anim-fade { animation: fadeSlideUp 0.5s ease-out both; }
        .anim-fade-1 { animation-delay: 0.05s; }
        .anim-fade-2 { animation-delay: 0.1s; }
        .anim-fade-3 { animation-delay: 0.15s; }
        .anim-fade-4 { animation-delay: 0.2s; }
        .anim-scale { animation: scaleIn 0.4s ease-out both; }
        .anim-scale-1 { animation-delay: 0.25s; }
        .anim-scale-2 { animation-delay: 0.3s; }
        .anim-scale-3 { animation-delay: 0.35s; }
        .anim-scale-4 { animation-delay: 0.4s; }
        .grow-w { animation: growWidth 0.8s ease-out both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* ── Header ── */}
        <div className="anim-fade anim-fade-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#e0e7ff]/50">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e293b] text-[#f8fafc] shadow-sm">
                <Store className="h-6 w-6 text-amber-200" />
              </div>
              <div>
                <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#1e293b] tracking-tight">
                  {currentShop ? currentShop.name : stats?.shopName || `${user?.displayName}'s Shop`}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-[#94A3B8]">{selectedShopId ? 'Single Shop View' : 'All Shops (Aggregated)'}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    stats?.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : stats?.verificationStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      stats?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' :
                      stats?.verificationStatus === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    {stats?.verificationStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Switch & Navigation Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown Selector */}
              {stats?.shops && stats.shops.length > 0 && (
                <div className="flex items-center gap-2 bg-white border border-[#cbd5e1] px-3.5 py-2 rounded-xl shadow-sm relative">
                  <select
                    value={selectedShopId || ''}
                    onChange={(e) => setSelectedShopId(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs font-bold text-[#1e293b] bg-transparent focus:outline-none cursor-pointer pr-4 appearance-none"
                  >
                    <option value="">All Outlets (Aggregate)</option>
                    {stats.shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-[#94A3B8] pointer-events-none" />
                </div>
              )}

              <Link to="/vendor/shops"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-xs font-semibold text-[#1e293b] transition hover:bg-gray-50 active:scale-[0.97]">
                <Store className="h-3.5 w-3.5 text-[#94A3B8]" /> Shop Manager
              </Link>
              <Link to="/vendor/subscription"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-xs font-semibold text-[#1e293b] transition hover:bg-gray-50 active:scale-[0.97]">
                <CreditCard className="h-3.5 w-3.5 text-[#94A3B8]" /> Billing & Plans
              </Link>
            </div>
          </div>
        </div>

        {/* ── Metric Cards with Sparklines ── */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Revenue', value: `৳${Math.round(totalRevenue).toLocaleString('en-BD')}`, sub: 'Selected view earnings', icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ), accent: 'text-emerald-600', bg: 'bg-emerald-50/60', spark: 'M0,16 L4,12 L8,14 L12,8 L16,11 L20,5', sparkColor: '#059669' },
            { label: 'Total Orders', value: totalOrders.toString(), sub: `${pendingOrders} pending`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            ), accent: 'text-blue-600', bg: 'bg-blue-50/60', spark: 'M0,18 L4,10 L8,14 L12,6 L16,9 L20,3', sparkColor: '#2563eb' },
            { label: 'Products', value: products.length.toString(), sub: `${activeProducts} active · ${draftProducts} draft`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            ), accent: 'text-violet-600', bg: 'bg-violet-50/60', spark: 'M0,14 L4,16 L8,10 L12,12 L16,8 L20,4', sparkColor: '#7c3aed' },
            { label: 'Auctions', value: (stats?.totalAuctions ?? 0).toString(), sub: `${stats?.activeAuctions ?? 0} active`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            ), accent: 'text-amber-600', bg: 'bg-amber-50/60', spark: 'M0,12 L4,8 L8,16 L12,6 L16,10 L20,2', sparkColor: '#d97706' },
          ].map((m, i) => (
            <div key={m.label} className={`anim-fade anim-fade-${i + 1} group relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40 transition-all hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.bg} ${m.accent}`}>
                  {m.icon}
                </div>
                <span className={`text-xs font-medium ${pendingOrders > 0 && m.label === 'Total Orders' ? 'text-amber-600' : 'text-[#94A3B8]'}`}>
                  {m.label === 'Total Orders' && pendingOrders > 0 ? `${pendingOrders} pending` : ''}
                </span>
              </div>
              <p className="mt-3 font-[Fraunces] text-2xl sm:text-3xl font-semibold tracking-tight text-[#1e293b]">
                {m.value}
              </p>
              <p className="mt-0.5 text-xs text-[#94A3B8]">{m.sub}</p>
              <svg className="absolute bottom-1 right-1 h-10 w-20 opacity-30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d={m.spark} stroke={m.sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="mt-6 sm:mt-8 grid lg:grid-cols-3 gap-6">
          {/* Left column: Chart + Quick actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <div className="anim-scale anim-scale-1 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Revenue</h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{timeRange === 'daily' ? 'Daily' : timeRange === 'weekly' ? 'Weekly' : 'Monthly'} sales overview</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Time Range Tabs */}
                  <div className="flex rounded-lg border border-[#e0e7ff] overflow-hidden text-xs">
                    {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 font-semibold transition-colors ${
                          timeRange === range
                            ? 'bg-[#1e293b] text-white'
                            : 'bg-white text-[#94A3B8] hover:bg-gray-50'
                        }`}
                      >
                        {range === 'daily' ? 'Daily' : range === 'weekly' ? 'Weekly' : 'Monthly'}
                      </button>
                    ))}
                  </div>
                  {(analytics?.salesData?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-3 text-xs ml-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#1e293b]" />
                        <span className="text-[#64748b]">Revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#818cf8]" />
                        <span className="text-[#64748b]">Payout</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {(analytics?.salesData?.length ?? 0) > 0 ? (
                <div className="relative h-44 sm:h-52">
                  <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2">
                    {analytics!.salesData.map((m, i) => {
                      const maxVal = Math.max(...analytics!.salesData.map(x => x.totalSale), 1)
                      const saleH = clamp((m.totalSale / maxVal) * 100, 2, 100)
                      const payH = clamp((m.netPayout / maxVal) * 100, 2, 100)
                      return (
                        <div key={m.label} className="flex-1 flex flex-col items-center h-full justify-end group/bar">
                          <div className="relative w-full flex flex-col items-center justify-end h-[calc(100%-24px)]">
                            <div
                              className="w-full max-w-[36px] rounded-t-[3px] bg-[#1e293b] transition-all duration-500 hover:opacity-80 cursor-pointer"
                              style={{ height: `${saleH}%`, animationDelay: `${i * 60}ms` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[#1e293b] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-lg">
                                ৳{m.totalSale.toLocaleString('en-BD')}
                              </div>
                            </div>
                            <div
                              className="w-full max-w-[36px] rounded-t-[3px] bg-[#818cf8] -mt-0.5 transition-all duration-500 hover:opacity-80 cursor-pointer"
                              style={{ height: `${payH}%`, animationDelay: `${i * 60 + 30}ms` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[#64748b] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-lg">
                                ৳{m.netPayout.toLocaleString('en-BD')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#94A3B8] font-medium mt-1.5">{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-44 text-xs text-[#94A3B8]">
                  No sales data yet
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="anim-scale anim-scale-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/vendor/products', label: 'Inventory', desc: 'Manage your products & stock levels', icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                ) },
                { to: '/vendor/orders', label: 'Orders', desc: 'Track, fulfill & manage customer orders', icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                ) },
                { to: '/vendor/auctions', label: 'Auctions', desc: 'Create & monitor your auction listings', icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.212 1.22m0 0a6.052 6.052 0 01-4.116 0m0 0a6.023 6.023 0 01-2.212-1.22" /></svg>
                ) },
                { to: '/messages', label: 'Messages', desc: 'Chat with customers about orders', icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                ) },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className="group rounded-xl bg-white p-4 ring-1 ring-[#e0e7ff]/40 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8fafc] text-[#64748b] group-hover:bg-[#1e293b] group-hover:text-[#f8fafc] transition-colors">
                    {a.icon}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#1e293b]">{a.label}</p>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8] leading-snug">{a.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column: Top Products + Status */}
          <div className="space-y-6">
            {/* Top Products */}
            <div className="anim-scale anim-scale-3 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
              <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Top Products</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5 mb-5">Highest revenue generators</p>
              {(analytics?.topProducts?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {analytics!.topProducts.map((p, i) => {
                    const maxRev = Math.max(...analytics!.topProducts.map(x => x.totalRevenue), 1)
                    return (
                      <div key={p.name} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-gray-100 text-gray-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-[#f8fafc] text-[#94A3B8]'
                            }`}>{i + 1}</span>
                            <p className="text-sm font-medium text-[#1e293b] truncate">{p.name}</p>
                          </div>
                          <p className="text-xs font-semibold text-[#64748b] shrink-0 ml-2">৳{Math.round(p.totalRevenue).toLocaleString('en-BD')}</p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#f8fafc] overflow-hidden">
                          <div
                            className="grow-w h-full rounded-full bg-gradient-to-r from-[#1e293b] to-[#64748b] transition-all duration-700"
                            style={{ width: `${(p.totalRevenue / maxRev) * 100}%`, animationDelay: `${i * 100}ms` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] text-center py-8">No sales yet</p>
              )}
            </div>

            {/* Most Viewed Products */}
            {(analytics?.mostViewedProducts?.length ?? 0) > 0 && (
              <div className="anim-scale anim-scale-4 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
                <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Most Ordered</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5 mb-5">Products ordered most frequently</p>
                <div className="space-y-3">
                  {analytics!.mostViewedProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#f8fafc] text-[#94A3B8]'
                        }`}>{i + 1}</span>
                        <span className="text-xs font-medium text-[#1e293b] truncate">{p.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#64748b] shrink-0 ml-2">{p.viewCount} view{p.viewCount !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Split */}
            <div className="anim-scale anim-scale-4 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
              <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Customers</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5 mb-5">Customer overview</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1e293b]">Unique Customers</span>
                  <span className="text-lg font-[Fraunces] font-semibold text-[#1e293b]">{analytics?.uniqueCustomers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1e293b]">Total Orders</span>
                  <span className="text-lg font-[Fraunces] font-semibold text-[#1e293b]">{analytics?.totalOrders ?? 0}</span>
                </div>
                <div className="pt-2 border-t border-[#f8fafc]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Avg. Orders / Customer</span>
                    <span className="font-semibold text-[#1e293b]">
                      {(analytics?.uniqueCustomers ?? 0) > 0
                        ? ((analytics?.totalOrders ?? 0) / (analytics?.uniqueCustomers ?? 1)).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Performance */}
            {stats?.shops && stats.shops.length > 0 && (
              <div className="anim-scale anim-scale-4 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
                <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Shop Performance</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5 mb-4">Per-shop snapshot</p>
                <div className="space-y-3">
                  {stats.shops.map((s) => (
                    <Link key={s.id} to={`/vendor/dashboard?shop=${s.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[#e0e7ff]/60 p-3 transition hover:bg-[#f8fafc] hover:border-[#818cf8]">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#e0e7ff]">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-bold text-[#64748b]">{s.name[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1e293b] truncate">{s.name}</p>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${
                          s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{s.status}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#94A3B8] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Support Widget */}
            <div className="anim-scale anim-scale-4 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#4338ca] p-5 sm:p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <svg className="h-4 w-4 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#f8fafc]">Need Assistance?</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#cbd5e1] mb-4">Get help with your shop, products, or account settings.</p>
              <Link to="/messages"
                className="block w-full rounded-xl bg-white/10 py-2.5 text-center text-xs font-semibold text-[#f8fafc] hover:bg-white/20 transition">
                Contact Support
              </Link>
            </div>

            {/* Product Status Summary */}
            <div className="anim-scale anim-scale-4 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40">
              <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Product Status</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5 mb-5">Overview of your catalog</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#1e293b] font-medium">Active</span>
                    <span className="text-emerald-600 font-semibold">{activeProducts}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f8fafc] overflow-hidden">
                    <div className="grow-w h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${products.length > 0 ? (activeProducts / products.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#1e293b] font-medium">Draft</span>
                    <span className="text-gray-500 font-semibold">{draftProducts}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f8fafc] overflow-hidden">
                    <div className="grow-w h-full rounded-full bg-gray-400 transition-all duration-700"
                      style={{ width: `${products.length > 0 ? (draftProducts / products.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="pt-2">
                  <Link to="/vendor/products"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748b] hover:text-[#1e293b] transition-colors">
                    Manage inventory
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="mt-6 sm:mt-8 anim-scale" style={{ animationDelay: '0.45s' }}>
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e0e7ff]/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#e0e7ff]/40">
              <div>
                <h2 className="font-[Fraunces] text-lg font-semibold text-[#1e293b]">Recent Transactions</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">Latest {Math.min(orders.length, 10)} commission payouts</p>
              </div>
              {orders.length > 0 && (
                <Link to="/vendor/orders" className="text-xs font-semibold text-[#64748b] hover:text-[#1e293b] transition-colors">
                  View all
                </Link>
              )}
            </div>
            {orders.length > 0 ? (
              <div className="divide-y divide-[#e0e7ff]/30 max-h-[340px] overflow-y-auto no-scrollbar">
                {orders.slice(0, 10).map((o, idx) => (
                  <div key={o.id} className="flex items-center justify-between px-5 sm:px-6 py-3.5 transition hover:bg-[#f8fafc]" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc] text-[#94A3B8]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1e293b] truncate">{o.productName}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Qty: {o.qty} · {new Date(o.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-semibold text-[#1e293b]">৳{o.saleAmountBdt.toLocaleString('en-BD')}</p>
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusColor[o.status] || statusColor.PENDING}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc]">
                  <svg className="h-6 w-6 text-[#cbd5e1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-[#64748b]">No transactions yet</p>
                <p className="mt-0.5 text-xs text-[#94A3B8]">When customers purchase your products, payouts will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
