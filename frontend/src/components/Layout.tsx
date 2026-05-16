import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import { useState } from 'react'

export function Layout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    enabled: !!user,
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.count ?? 0

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out')
      navigate('/')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-cream-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-teal-700 tracking-tight">
            Atom<span className="text-ink-950">Drops</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Dashboard
                </Link>
                <Link to="/analytics" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Analytics
                </Link>
                <Link to="/inbox" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Messages
                </Link>
                <Link to="/notifications" className="relative text-sm text-ink-600 hover:text-teal-600 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[0.6rem] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/returns" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Returns
                </Link>
                <Link to="/reports" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Report
                </Link>
                <Link to="/bidder-reputation" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Bidder Rep
                </Link>
                {role === 'ADMIN' && (
                  <>
                    <Link to="/admin/returns" className="text-sm text-ink-600 hover:text-teal-600 transition">
                      Returns
                    </Link>
                    <Link to="/admin/users" className="text-sm text-ink-600 hover:text-teal-600 transition">
                      Users
                    </Link>
                    <Link to="/admin/reports" className="text-sm text-ink-600 hover:text-teal-600 transition">
                      Reports
                    </Link>
                  </>
                )}
                <span className="text-sm text-ink-400">{user.displayName}</span>
                <span className="px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider rounded-full bg-cream-100 text-ink-600">
                  {role}
                </span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-ink-600 hover:text-teal-600 transition">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </nav>

          <button
            className="md:hidden p-2 text-ink-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-cream-100 bg-white px-4 py-4 space-y-3">
            {user ? (
              <>
                <Link to="/dashboard" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/analytics" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Analytics
                </Link>
                <Link to="/inbox" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Messages
                </Link>
                <Link to="/notifications" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                </Link>
                <Link to="/returns" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Returns
                </Link>
                <Link to="/reports" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Report User
                </Link>
                <Link to="/bidder-reputation" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Bidder Rep
                </Link>
                {role === 'ADMIN' && (
                  <>
                    <Link to="/admin/returns" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                      Returns
                    </Link>
                    <Link to="/admin/users" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                      Manage Users
                    </Link>
                    <Link to="/admin/reports" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                      User Reports
                    </Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block text-sm text-ink-600">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-sm text-ink-600" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="block text-sm text-teal-600 font-semibold" onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-ink-400">
          &copy; {new Date().getFullYear()} AtomDrops — Smart Multi-Vendor Marketplace
        </div>
      </footer>
    </div>
  )
}
