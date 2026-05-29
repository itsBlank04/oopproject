import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'

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
}

type MonthlySale = {
  month: number
  year: number
  label: string
  totalSale: number
  totalCommission: number
  netPayout: number
  orderCount: number
}

type TopProduct = {
  name: string
  totalRevenue: number
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
  monthlySales: MonthlySale[]
  topProducts: TopProduct[]
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  pendingOrders: number
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

export default function VendorDashboardPage() {
  const { user } = useAuth()

  const { data: stats } = useQuery<Stats | null>({
    queryKey: ['vendor-dashboard'],
    queryFn: () => apiClient.get('/api/vendor/dashboard').then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: analytics } = useQuery<Analytics | null>({
    queryKey: ['vendor-analytics'],
    queryFn: () => apiClient.get('/api/vendor/analytics').then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['vendor-orders'],
    queryFn: () => apiClient.get('/api/vendor/orders').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  })

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['vendor-products'],
    queryFn: () => apiClient.get('/api/vendor/products').then(r => Array.isArray(r.data) ? r.data : []),
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

  return (
    <div className="min-h-screen bg-[#faf6f2]">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a1512] text-[#faf6f2] shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
                </svg>
              </div>
              <div>
                <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#1a1512] tracking-tight">
                  {stats?.shopName || `${user?.displayName}'s Shop`}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-[#8c7564]">{user?.displayName}</span>
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
            <div className="flex gap-2">
              <Link to="/vendor/products"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a1512] px-4 py-2 text-xs font-semibold text-[#faf6f2] transition hover:bg-[#2d241e] active:scale-[0.97]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                New Product
              </Link>
              <Link to="/vendor/orders"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7c7b8] px-4 py-2 text-xs font-semibold text-[#1a1512] transition hover:bg-white active:scale-[0.97]">
                View Orders
              </Link>
            </div>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Revenue', value: `৳${Math.round(totalRevenue).toLocaleString('en-BD')}`, sub: 'Lifetime earnings', icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ), accent: 'text-emerald-600', bg: 'bg-emerald-50/60' },
            { label: 'Total Orders', value: totalOrders.toString(), sub: `${pendingOrders} pending`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            ), accent: 'text-blue-600', bg: 'bg-blue-50/60' },
            { label: 'Products', value: products.length.toString(), sub: `${activeProducts} active · ${draftProducts} draft`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            ), accent: 'text-violet-600', bg: 'bg-violet-50/60' },
            { label: 'Auctions', value: (stats?.totalAuctions ?? 0).toString(), sub: `${stats?.activeAuctions ?? 0} active`, icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            ), accent: 'text-amber-600', bg: 'bg-amber-50/60' },
          ].map((m, i) => (
            <div key={m.label} className={`anim-fade anim-fade-${i + 1} group relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 transition-all hover:shadow-md hover:-translate-y-0.5`}>
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.bg} ${m.accent}`}>
                  {m.icon}
                </div>
                <span className={`text-xs font-medium ${pendingOrders > 0 && m.label === 'Total Orders' ? 'text-amber-600' : 'text-[#8c7564]'}`}>
                  {m.label === 'Total Orders' && pendingOrders > 0 ? `${pendingOrders} pending` : ''}
                </span>
              </div>
              <p className="mt-3 font-[Fraunces] text-2xl sm:text-3xl font-semibold tracking-tight text-[#1a1512]">
                {m.value}
              </p>
              <p className="mt-0.5 text-xs text-[#8c7564]">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="mt-6 sm:mt-8 grid lg:grid-cols-3 gap-6">
          {/* Left column: Chart + Quick actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <div className="anim-scale anim-scale-1 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-[Fraunces] text-lg font-semibold text-[#1a1512]">Revenue</h2>
                  <p className="text-xs text-[#8c7564] mt-0.5">Monthly sales overview</p>
                </div>
                {analytics?.monthlySales && analytics.monthlySales.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#1a1512]" />
                      <span className="text-[#6c5b4f]">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#c4956a]" />
                      <span className="text-[#6c5b4f]">Payout</span>
                    </div>
                  </div>
                )}
              </div>
              {(analytics?.monthlySales?.length ?? 0) > 0 ? (
                <div className="relative h-44 sm:h-52">
                  <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2">
                    {analytics!.monthlySales.map((m, i) => {
                      const maxVal = Math.max(...analytics!.monthlySales.map(x => x.totalSale), 1)
                      const saleH = clamp((m.totalSale / maxVal) * 100, 2, 100)
                      const payH = clamp((m.netPayout / maxVal) * 100, 2, 100)
                      return (
                        <div key={m.label} className="flex-1 flex flex-col items-center h-full justify-end group/bar">
                          <div className="relative w-full flex flex-col items-center justify-end h-[calc(100%-24px)]">
                            <div
                              className="w-full max-w-[36px] rounded-t-[3px] bg-[#1a1512] transition-all duration-500 hover:opacity-80 cursor-pointer"
                              style={{ height: `${saleH}%`, animationDelay: `${i * 60}ms` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[#1a1512] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-lg">
                                ৳{m.totalSale.toLocaleString('en-BD')}
                              </div>
                            </div>
                            <div
                              className="w-full max-w-[36px] rounded-t-[3px] bg-[#c4956a] -mt-0.5 transition-all duration-500 hover:opacity-80 cursor-pointer"
                              style={{ height: `${payH}%`, animationDelay: `${i * 60 + 30}ms` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[#6c5b4f] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-lg">
                                ৳{m.netPayout.toLocaleString('en-BD')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#8c7564] font-medium mt-1.5">{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-44 text-xs text-[#8c7564]">
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
                  className="group rounded-xl bg-white p-4 ring-1 ring-[#e4d6c8]/40 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f0eb] text-[#6c5b4f] group-hover:bg-[#1a1512] group-hover:text-[#faf6f2] transition-colors">
                    {a.icon}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#1a1512]">{a.label}</p>
                  <p className="mt-0.5 text-[11px] text-[#8c7564] leading-snug">{a.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column: Top Products + Status */}
          <div className="space-y-6">
            {/* Top Products */}
            <div className="anim-scale anim-scale-3 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
              <h2 className="font-[Fraunces] text-lg font-semibold text-[#1a1512]">Top Products</h2>
              <p className="text-xs text-[#8c7564] mt-0.5 mb-5">Highest revenue generators</p>
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
                              'bg-[#f5f0eb] text-[#8c7564]'
                            }`}>{i + 1}</span>
                            <p className="text-sm font-medium text-[#1a1512] truncate">{p.name}</p>
                          </div>
                          <p className="text-xs font-semibold text-[#6c5b4f] shrink-0 ml-2">৳{Math.round(p.totalRevenue).toLocaleString('en-BD')}</p>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#f5f0eb] overflow-hidden">
                          <div
                            className="grow-w h-full rounded-full bg-gradient-to-r from-[#1a1512] to-[#5c4a3c] transition-all duration-700"
                            style={{ width: `${(p.totalRevenue / maxRev) * 100}%`, animationDelay: `${i * 100}ms` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#8c7564] text-center py-8">No sales yet</p>
              )}
            </div>

            {/* Product Status Summary */}
            <div className="anim-scale anim-scale-4 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40">
              <h2 className="font-[Fraunces] text-lg font-semibold text-[#1a1512]">Product Status</h2>
              <p className="text-xs text-[#8c7564] mt-0.5 mb-5">Overview of your catalog</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#1a1512] font-medium">Active</span>
                    <span className="text-emerald-600 font-semibold">{activeProducts}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f5f0eb] overflow-hidden">
                    <div className="grow-w h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${products.length > 0 ? (activeProducts / products.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-[#1a1512] font-medium">Draft</span>
                    <span className="text-gray-500 font-semibold">{draftProducts}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f5f0eb] overflow-hidden">
                    <div className="grow-w h-full rounded-full bg-gray-400 transition-all duration-700"
                      style={{ width: `${products.length > 0 ? (draftProducts / products.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="pt-2">
                  <Link to="/vendor/products"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] hover:text-[#1a1512] transition-colors">
                    Manage inventory
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="mt-6 sm:mt-8 anim-scale" style={{ animationDelay: '0.45s' }}>
          <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e4d6c8]/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#e4d6c8]/40">
              <div>
                <h2 className="font-[Fraunces] text-lg font-semibold text-[#1a1512]">Recent Transactions</h2>
                <p className="text-xs text-[#8c7564] mt-0.5">Latest {Math.min(orders.length, 10)} commission payouts</p>
              </div>
              {orders.length > 0 && (
                <Link to="/vendor/orders" className="text-xs font-semibold text-[#6c5b4f] hover:text-[#1a1512] transition-colors">
                  View all
                </Link>
              )}
            </div>
            {orders.length > 0 ? (
              <div className="divide-y divide-[#e4d6c8]/30 max-h-[340px] overflow-y-auto no-scrollbar">
                {orders.slice(0, 10).map((o, idx) => (
                  <div key={o.id} className="flex items-center justify-between px-5 sm:px-6 py-3.5 transition hover:bg-[#faf6f2]" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f0eb] text-[#8c7564]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1a1512] truncate">{o.productName}</p>
                        <p className="text-[11px] text-[#8c7564] mt-0.5">
                          Qty: {o.qty} · {new Date(o.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-semibold text-[#1a1512]">৳{o.saleAmountBdt.toLocaleString('en-BD')}</p>
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusColor[o.status] || statusColor.PENDING}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f0eb]">
                  <svg className="h-6 w-6 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-[#6c5b4f]">No transactions yet</p>
                <p className="mt-0.5 text-xs text-[#8c7564]">When customers purchase your products, payouts will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
