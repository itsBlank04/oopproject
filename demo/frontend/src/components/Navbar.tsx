import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import ImageLightbox from '../components/ImageLightbox'
import toast from 'react-hot-toast'


function PrefetchLink({ to, queryKey, queryFn, children, className }: { to: string; queryKey: string[]; queryFn: () => Promise<any>; children: ReactNode; className?: string }) {
  const queryClient = useQueryClient()
  return (
    <Link to={to} className={className} onMouseEnter={() => queryClient.prefetchQuery({ queryKey, queryFn, staleTime: 120_000 })}>
      {children}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout, hasRole } = useAuth()
  const { openModal } = useAuthModal()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lightboxAvatar, setLightboxAvatar] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications').then(r => r.data),
    enabled: !!user,
    staleTime: 60_000,
  })
  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((n: any) => !n.read).length

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    if (searchOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen])

  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchOpen) return
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-[#e4d6c8] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#221b16] text-sm font-semibold text-[#f9f5f0]">AD</span>
            <span className="font-[Fraunces] text-lg font-semibold text-[#221b16]">AtomDrops</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/used-listings" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Used Items</Link>
            <Link to="/repair/technicians" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Repairs</Link>
            <Link to="/auctions" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Auctions</Link>
          </div>
          <div className="ml-6 hidden md:block" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center" ref={searchContainerRef}>
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{ width: searchOpen ? '260px' : '0px', opacity: searchOpen ? 1 : 0 }}
            >
              <div className="flex w-[260px] flex-shrink-0 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a6a]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="Search..."
                    className="w-full rounded-full border border-[#d7c7b8] bg-[#f9f5f0] py-1.5 pl-9 pr-3 text-sm text-[#221b16] placeholder:text-[#8a7a6a] outline-none transition-colors focus:border-[#a28672] focus:bg-white"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="flex-shrink-0 rounded-full bg-[#221b16] px-4 py-1.5 text-xs font-semibold text-[#f9f5f0] transition-all hover:bg-[#3a3028] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>
            <button
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery('') }}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                searchOpen
                  ? 'bg-[#f9f5f0] text-[#221b16]'
                  : 'text-[#6c5b4f] hover:bg-[#f9f5f0] hover:text-[#221b16]'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          {user ? (
            <>
              <div className="hidden items-center gap-3 md:flex">
                {hasRole('VENDOR') && (
                  <>
                    <Link to="/vendor/dashboard" className="text-sm text-[#6c5b4f] hover:text-[#221b16]"
                      onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['vendor-dashboard'], queryFn: () => apiClient.get('/api/vendor/dashboard').then(r => r.data), staleTime: 120_000 })}>Dashboard</Link>
                    <Link to="/vendor/products" className="text-sm text-[#6c5b4f] hover:text-[#221b16]"
                      onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['vendor-products'], queryFn: () => apiClient.get('/api/vendor/products').then(r => Array.isArray(r.data) ? r.data : []), staleTime: 120_000 })}>Sell</Link>
                    <Link to="/vendor/auctions" className="text-sm text-[#6c5b4f] hover:text-[#221b16]"
                      onMouseEnter={() => queryClient.prefetchQuery({ queryKey: ['vendor-auctions'], queryFn: () => apiClient.get('/api/vendor/auctions').then(r => Array.isArray(r.data) ? r.data : []), staleTime: 120_000 })}>Auctions</Link>
                    <PrefetchLink to="/vendor/orders" queryKey={['vendor-orders-list']}
                      queryFn={() => apiClient.get('/api/vendor/orders/list').then(r => Array.isArray(r.data) ? r.data : [])}
                      className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Orders</PrefetchLink>
                  </>
                )}
                {hasRole('ADMIN') && (
                  <Link to="/admin" className="rounded-full bg-[#221b16] px-3 py-1.5 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028]">
                    Admin
                  </Link>
                )}
                {hasRole('CUSTOMER') && (
                  <>
                    <Link to="/cart" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Cart</Link>
                    <Link to="/account/orders" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Orders</Link>
                    <Link to="/wishlist" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">♡</Link>
                  </>
                )}
                <Link to="/notifications" className="relative text-sm text-[#6c5b4f] hover:text-[#221b16]">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="relative" ref={menuRef}>
                  <button onClick={() => { setMenuOpen(!menuOpen); }} className="flex items-center gap-2 rounded-full border border-[#d7c7b8] px-3 py-1.5 text-sm text-[#221b16] hover:bg-[#f9f5f0]">
                  {user.avatarUrl ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxAvatar(true) }}
                      className="h-6 w-6 overflow-hidden rounded-full">
                      <img src={user.avatarUrl} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
                    </button>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#221b16] text-xs font-bold text-[#f9f5f0]">{user.displayName?.[0]}</span>
                  )}
                  {user.displayName}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 w-48 rounded-xl border border-[#e4d6c8] bg-white p-2 shadow-lg">
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Profile</Link>
                    <Link to="/addresses" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Addresses</Link>
                    <Link to="/messages" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Messages</Link>
                    {!hasRole('VENDOR') && !hasRole('TECHNICIAN') && (
                      <Link to="/profile#role-upgrade" onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">
                        <span className="flex items-center gap-2">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#a28672]">
                            <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
                          </svg>
                          Upgrade Account
                        </span>
                        <span className="rounded-full bg-[#f0e8df] px-2 py-0.5 text-[10px] font-semibold text-[#6c5b4f]">New</span>
                      </Link>
                    )}
                    {hasRole('CUSTOMER') && (
                      <Link to="/repair/requests" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">My Repairs</Link>
                    )}
                    {hasRole('VENDOR') && (
                      <Link to="/vendor/auctions" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">My Auctions</Link>
                    )}
                    {hasRole('ADMIN') && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Admin Console</Link>
                    )}
                    <hr className="my-1 border-[#e4d6c8]" />
                    <button onClick={async () => { setMenuOpen(false); await logout(); toast.success('Logged out successfully'); navigate('/'); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => openModal('signin')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6c5b4f] transition-colors hover:bg-[#f9f5f0] hover:text-[#221b16]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            </button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#221b16]">☰</button>
        </div>
      </div>
    </nav>

      {lightboxAvatar && user?.avatarUrl && (
        <ImageLightbox
          images={[{ url: user.avatarUrl }]}
          initialIndex={0}
          onClose={() => setLightboxAvatar(false)}
        />
      )}
    </>
  )
}
