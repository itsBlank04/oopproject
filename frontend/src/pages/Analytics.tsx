import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'

const CHART_COLORS = ['#0d9b8a', '#f48c12', '#c73a3a', '#6366f1', '#10b981']

function StatCard({ label, value, accent }: { label: string; value: number | string | boolean; accent?: boolean }) {
  if (value === undefined || value === null) return null
  return (
    <div className={`card p-6 ${accent ? 'border-l-4 border-teal-500' : ''}`}>
      <p className="text-sm text-ink-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink-950">
        {typeof value === 'number' ? value.toLocaleString() : String(value)}
      </p>
    </div>
  )
}

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-admin'],
    queryFn: () => api.get<Record<string, unknown>>('/analytics/admin'),
  })

  const { data: revenueTrend } = useQuery({
    queryKey: ['analytics-revenue-trend'],
    queryFn: () => api.get<{ month: string; revenue: number }[]>('/analytics/admin/revenue-trend'),
  })

  const { data: userGrowth } = useQuery({
    queryKey: ['analytics-user-growth'],
    queryFn: () => api.get<{ month: string; count: number }[]>('/analytics/admin/user-growth'),
  })

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const overviewPie = [
    { name: 'Products', value: (stats.totalProducts as number) || 0 },
    { name: 'Auctions', value: (stats.totalAuctions as number) || 0 },
    { name: 'Users', value: (stats.totalUsers as number) || 0 },
  ]

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers as number} accent />
        <StatCard label="Total Revenue (৳)" value={stats.totalRevenue as number} accent />
        <StatCard label="Total Products" value={stats.totalProducts as number} />
        <StatCard label="Total Auctions" value={stats.totalAuctions as number} />
        <StatCard label="Active Auctions" value={stats.activeAuctions as number} />
        <StatCard label="Open Fraud Flags" value={stats.openFraudFlags as number} />
        <StatCard label="Open Returns" value={stats.openReturns as number} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-950 mb-4">Revenue Trend</h3>
          {revenueTrend && revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9b8a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9b8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd3" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#877b67' }} />
                <YAxis fontSize={12} tick={{ fill: '#877b67' }} />
                <Tooltip formatter={(value: unknown) => [`৳${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0d9b8a" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-400 text-center py-12">No revenue data yet</p>
          )}
        </div>

        {/* User Growth */}
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-950 mb-4">User Registrations</h3>
          {userGrowth && userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd3" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#877b67' }} />
                <YAxis fontSize={12} tick={{ fill: '#877b67' }} />
                <Tooltip formatter={(value: unknown) => [Number(value), 'Users']} />
                <Bar dataKey="count" fill="#0d9b8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-400 text-center py-12">No user data yet</p>
          )}
        </div>

        {/* Platform Overview Pie */}
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-950 mb-4">Platform Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={overviewPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {overviewPie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

interface VendorStats {
  totalOrders: number
  activeAuctions: number
  totalProducts: number
  totalRevenue: number
  totalAuctions: number
}

interface AuctionAnalytics {
  totalLots: number
  totalBids: number
  uniqueBidders: number
  highestBidBdt: number
  reservePriceBdt: number | null
  reserveMet: boolean
}

function VendorDashboard() {
  const [auctionId, setAuctionId] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['analytics-vendor'],
    queryFn: () => api.get<VendorStats>('/analytics/vendor'),
  })

  const { data: auctionAnalytics, refetch: refetchAuction } = useQuery({
    queryKey: ['analytics-auction', auctionId],
    queryFn: () => api.get<AuctionAnalytics>(`/analytics/auction/${auctionId}`),
    enabled: false,
  })

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const vendorPie = [
    { name: 'Orders', value: (stats.totalOrders as number) || 0 },
    { name: 'Active Auctions', value: (stats.activeAuctions as number) || 0 },
    { name: 'Products', value: (stats.totalProducts as number) || 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts as number} accent />
        <StatCard label="Total Orders" value={stats.totalOrders as number} />
        <StatCard label="Revenue (৳)" value={stats.totalRevenue as number} accent />
        <StatCard label="Total Auctions" value={stats.totalAuctions as number} />
        <StatCard label="Active Auctions" value={stats.activeAuctions as number} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor overview */}
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-950 mb-4">Business Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vendorPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {vendorPie.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Auction analytics lookup */}
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink-950 mb-4">Auction Analytics</h3>
          <div className="flex gap-3 mb-4">
            <input
              className="input max-w-xs"
              type="number"
              placeholder="Enter auction ID"
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => auctionId && refetchAuction()} disabled={!auctionId}>
              Look up
            </button>
          </div>
          {auctionAnalytics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-500 uppercase tracking-wider">Lots</p>
                <p className="text-xl font-bold text-ink-950">{(auctionAnalytics.totalLots as number)}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-500 uppercase tracking-wider">Total Bids</p>
                <p className="text-xl font-bold text-ink-950">{(auctionAnalytics.totalBids as number)}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-500 uppercase tracking-wider">Unique Bidders</p>
                <p className="text-xl font-bold text-ink-950">{(auctionAnalytics.uniqueBidders as number)}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-500 uppercase tracking-wider">Highest Bid (৳)</p>
                <p className="text-xl font-bold text-teal-700">{Number(auctionAnalytics.highestBidBdt).toLocaleString()}</p>
              </div>
              {auctionAnalytics.reservePriceBdt && (
                <div className="p-3 rounded-lg bg-cream-50">
                  <p className="text-xs text-ink-500 uppercase tracking-wider">Reserve (৳)</p>
                  <p className="text-xl font-bold text-ink-950">{Number(auctionAnalytics.reservePriceBdt).toLocaleString()}</p>
                </div>
              )}
              {auctionAnalytics.reserveMet !== undefined && (
                <div className="p-3 rounded-lg bg-cream-50">
                  <p className="text-xs text-ink-500 uppercase tracking-wider">Reserve Met</p>
                  <p className={`text-xl font-bold ${auctionAnalytics.reserveMet ? 'text-green-600' : 'text-red-500'}`}>
                    {auctionAnalytics.reserveMet ? '✓ Yes' : '✗ No'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TechnicianDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-technician'],
    queryFn: () => api.get<Record<string, unknown>>('/analytics/technician'),
  })

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const completionRate = Number(stats.completionRate) || 0
  const completionData = [
    { name: 'Completed', value: (stats.completedBookings as number) || 0 },
    { name: 'Remaining', value: Math.max(0, ((stats.totalBookings as number) || 0) - ((stats.completedBookings as number) || 0)) },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Bookings" value={stats.totalBookings as number} accent />
        <StatCard label="Completed" value={stats.completedBookings as number} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} accent />
      </div>

      <div className="card p-6 max-w-md">
        <h3 className="font-display text-lg text-ink-950 mb-4">Completion Ring</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={completionData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
              <Cell fill="#0d9b8a" />
              <Cell fill="#e8dfd3" />
            </Pie>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1.5rem', fontWeight: 'bold' }} fill="#2d2a24">
              {String(completionRate)}%
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { role } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Analytics Dashboard</h1>

      {role === 'ADMIN' && <AdminDashboard />}
      {role === 'VENDOR' && <VendorDashboard />}
      {role === 'TECHNICIAN' && <TechnicianDashboard />}
      {role === 'CUSTOMER' && (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">Customer analytics coming soon</p>
        </div>
      )}
    </div>
  )
}
