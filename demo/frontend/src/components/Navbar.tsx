import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useAuthModal } from "../contexts/AuthModalContext"
import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import apiClient from "../lib/apiClient"
import ImageLightbox from "../components/ImageLightbox"
import { cartEvents } from "../lib/cartEvents"
import toast from "react-hot-toast"


export default function Navbar() {
  const { user, logout, hasRole, activeRole, setActiveRole, subscribedRoles } = useAuth()
  const { openModal } = useAuthModal()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lightboxAvatar, setLightboxAvatar] = useState(false)
  const [cartBump, setCartBump] = useState(false)
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
    const unsub = cartEvents.subscribe(() => {
      setCartBump(true)
      setTimeout(() => setCartBump(false), 400)
    })
    return unsub
  }, [])

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
    <nav className="sticky top-0 z-50 border-b border-[#e4d6c8]/60 bg-white/95 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset] backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="AtomDrops" className="h-auto w-auto max-h-10 max-w-24 object-contain" />
          </Link>
          <div className="hidden items-center gap-0.5 md:flex">
            {[
              { to: '/used-listings', label: 'Used Items' },
              { to: '/repair', label: 'Repairs' },
              { to: '/auctions', label: 'Auctions' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#6c5b4f] transition-all duration-200 hover:text-[#221b16]"
              >
                {link.label}
               <span className="absolute bottom-0 left-3 right-3 h-px origin-left scale-x-0 bg-[#221b16] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
          <div className="flex items-center" ref={searchContainerRef}>
            <div className="overflow-hidden transition-all duration-300 ease-out"
              style={{ width: searchOpen ? '260px' : '0px', opacity: searchOpen ? 1 : 0 }}>
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
              className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#6c5b4f] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70 hover:text-[#221b16] ${searchOpen ? 'border-[#d7c7b8] bg-white/70 text-[#221b16] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.1)]' : ''}`}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>
          {user ? (
            <>
              <div className="hidden items-center gap-3 md:flex">
                {hasRole('ADMIN') && (
                  <Link to="/admin" className="rounded-full bg-[#221b16] px-3 py-1.5 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028]">
                    Admin
                  </Link>
                )}
                <button onClick={() => navigate('/cart')} className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#6c5b4f] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70 hover:text-[#221b16] ${cartBump ? 'scale-125 border-[#E07B3F]/40 bg-[#E07B3F]/10 text-[#E07B3F] shadow-[0_2px_12px_-2px_rgba(224,123,63,0.2)]' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </button>
                <Link to="/account/orders" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Orders</Link>
                <Link to="/wishlist" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#6c5b4f] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70 hover:text-[#221b16]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </Link>
                <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#6c5b4f] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70 hover:text-[#221b16]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(239,68,68,0.4)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="relative" ref={menuRef}>
                <button onClick={() => { setMenuOpen(!menuOpen); }} className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-1.5 text-sm text-[#221b16] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70">
                {user.avatarUrl ? (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxAvatar(true) }}
                    className="h-6 w-6 overflow-hidden rounded-lg">
                    <img src={user.avatarUrl} alt="" loading="lazy" className="h-full w-full rounded-lg object-cover" />
                  </button>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#221b16]/80 text-xs font-bold text-[#f9f5f0]">{user.displayName?.[0]}</span>
                )}
                <span className="text-[13px] font-medium">{user.displayName}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 rounded-xl border border-[#e4d6c8] bg-white p-2 shadow-lg">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Profile</Link>
                <Link to="/addresses" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Addresses</Link>
                <Link to="/messages" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Messages</Link>
                {subscribedRoles.length > 0 && (
                  <div className="border-t border-[#e4d6c8]/40 mt-1 pt-1 px-1">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a28672]">Switch Mode</p>
                    {subscribedRoles.includes('vendor') && (
                      <button
                        onClick={() => setActiveRole(activeRole === 'vendor' ? null : 'vendor')}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]"
                      >
                        <div className="flex items-center gap-2">
                          <span>📦</span>
                          <span>Merchant</span>
                        </div>
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${activeRole === 'vendor' ? 'bg-emerald-500' : 'bg-[#d7c7b8]'}`}>
                          <span className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm transition-transform duration-300 ${activeRole === 'vendor' ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                        </span>
                      </button>
                    )}
                    {subscribedRoles.includes('technician') && (
                      <button
                        onClick={() => setActiveRole(activeRole === 'technician' ? null : 'technician')}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]"
                      >
                        <div className="flex items-center gap-2">
                          <span>🔧</span>
                          <span>Repair</span>
                        </div>
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${activeRole === 'technician' ? 'bg-emerald-500' : 'bg-[#d7c7b8]'}`}>
                          <span className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm transition-transform duration-300 ${activeRole === 'technician' ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                        </span>
                      </button>
                    )}
                  </div>
                )}
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
                <Link to="/repair/requests" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">My Repairs</Link>
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#6c5b4f] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all duration-300 hover:border-[#d7c7b8] hover:bg-white/70 hover:text-[#221b16]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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
