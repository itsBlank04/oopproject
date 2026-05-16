import { useQuery } from '@tanstack/react-query'
import { useAuth, type UserRole } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'

interface Badge {
  name: string
  icon: string
  color: string
}

const dashboards: Record<UserRole, { title: string; links: { label: string; href: string }[] }> = {
  ADMIN: {
    title: 'Admin Dashboard',
    links: [
      { label: 'Auction Approvals', href: '/admin/auctions' },
      { label: 'Fraud Alerts', href: '/admin/fraud' },
      { label: 'Manage Users', href: '/admin/users' },
      { label: 'User Reports', href: '/admin/reports' },
      { label: 'Return Requests', href: '/admin/returns' },
    ],
  },
  VENDOR: {
    title: 'Vendor Dashboard',
    links: [
      { label: 'My Products', href: '/products' },
      { label: 'New Product', href: '/products/new' },
      { label: 'Create Auction', href: '/auctions/new' },
      { label: 'Auctions', href: '/auctions' },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  TECHNICIAN: {
    title: 'Technician Dashboard',
    links: [
      { label: 'Repair Requests', href: '/repair' },
      { label: 'Service Listings', href: '/repair' },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  CUSTOMER: {
    title: 'Customer Dashboard',
    links: [
      { label: 'Browse Products', href: '/products' },
      { label: 'My Orders', href: '/orders' },
      { label: 'Used Items', href: '/used' },
      { label: 'Auctions', href: '/auctions' },
      { label: 'Repair Services', href: '/repair' },
      { label: 'Browse Technicians', href: '/repair' },
    ],
  },
}

export default function Dashboard() {
  const { user, role } = useAuth()

  const { data: trustData } = useQuery({
    queryKey: ['trust-score'],
    queryFn: () => api.get<{ score: number }>('/trust-scores/me'),
    enabled: !!user,
  })

  const { data: badges } = useQuery({
    queryKey: ['badges-me'],
    queryFn: () => api.get<Badge[]>('/badges/me'),
    enabled: !!user,
  })

  if (!user || !role) return null

  const db = dashboards[role]
  const score = trustData?.score ?? 50

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-display text-3xl text-ink-950">{db.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            score >= 70 ? 'bg-green-50 text-green-700' :
            score >= 40 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-600'
          }`}>
            Trust: {score}/100
          </span>
          {badges?.map((b) => {
            const colorClasses: Record<string, string> = {
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              amber: 'bg-amber-50 text-amber-700 border-amber-200',
              green: 'bg-green-50 text-green-700 border-green-200',
              red: 'bg-red-50 text-red-700 border-red-200',
            }
            const cls = colorClasses[b.color] || 'bg-gray-50 text-gray-700 border-gray-200'
            return (
              <span key={b.name} className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
                {b.icon} {b.name}
              </span>
            )
          })}
        </div>
        <p className="mt-1 text-ink-500">Welcome back, {user.displayName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {db.links.map((link) => (
          <Link
            key={link.label}
            to={link.href}
            className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <h3 className="font-medium text-ink-950 group-hover:text-teal-600">{link.label}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}
