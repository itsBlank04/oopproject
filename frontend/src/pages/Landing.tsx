import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const features = [
  {
    title: 'New Products',
    description: 'Browse and purchase from verified vendors. Fresh inventory updated daily.',
    href: '/products',
    icon: '✦',
  },
  {
    title: 'Used Items',
    description: 'Quality second-hand finds with verified condition and history reports.',
    href: '/used',
    icon: '↻',
  },
  {
    title: 'Repair Services',
    description: 'Connect with skilled technicians for repairs, quotes, and bookings.',
    href: '/repair',
    icon: '⚙',
  },
  {
    title: 'Live Auctions',
    description: 'Real-time bidding on exclusive lots. Watch, bid, and win.',
    href: '/auctions',
    icon: '⚡',
  },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cream-50 to-amber-50" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-ink-950 leading-[1.08] tracking-tight">
              A smarter
              <span className="text-teal-600"> marketplace</span>
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-lg">
              One platform to buy, sell, repair, and bid. Connect with vendors, technicians, and bidders in a trusted commerce ecosystem.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get started
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.href}
              className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-4 font-display text-lg text-ink-950 group-hover:text-teal-600 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed">{f.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-ink-950 text-cream-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">Built for trust</h2>
          <p className="mt-4 text-ink-300 max-w-md mx-auto">
            Every transaction is backed by trust scores, fraud detection, and transparent history.
          </p>
        </div>
      </section>
    </div>
  )
}
