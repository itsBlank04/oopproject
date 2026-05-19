import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import apiClient from '../lib/apiClient'

export default function Navbar() {
  const { user, logout, hasRole } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    apiClient.get('/api/notifications')
      .then(res => {
        if (Array.isArray(res.data)) {
          setUnreadCount(res.data.filter((n: any) => !n.read).length)
        }
      })
      .catch(() => {})
  }, [user])

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

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e4d6c8] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#221b16] text-sm font-semibold text-[#f9f5f0]">AD</span>
            <span className="font-[Fraunces] text-lg font-semibold text-[#221b16]">AtomDrops</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/products" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Products</Link>
            <Link to="/used-listings" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Used Items</Link>
            <Link to="/auctions" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Auctions</Link>
            <Link to="/repair/technicians" className="text-sm text-[#6c5b4f] hover:text-[#221b16] transition">Repairs</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-3 md:flex">
                {hasRole('VENDOR') && (
                  <>
                    <Link to="/vendor/dashboard" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Dashboard</Link>
                    <Link to="/vendor/products" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Sell</Link>
                    <Link to="/vendor/orders" className="text-sm text-[#6c5b4f] hover:text-[#221b16]">Orders</Link>
                  </>
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
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-full border border-[#d7c7b8] px-3 py-1.5 text-sm text-[#221b16] hover:bg-[#f9f5f0]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#221b16] text-xs font-bold text-[#f9f5f0]">{user.displayName?.[0]}</span>
                  )}
                  {user.displayName}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 w-48 rounded-xl border border-[#e4d6c8] bg-white p-2 shadow-lg">
                    {hasRole('CUSTOMER') && (
                      <Link to="/profile" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Profile</Link>
                    )}
                    <Link to="/addresses" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Addresses</Link>
                    <Link to="/messages" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">Messages</Link>
                    {hasRole('CUSTOMER') && (
                      <>
                        <Link to="/repair/requests" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">My Repairs</Link>
                      </>
                    )}
                    {hasRole('VENDOR') && (
                      <Link to="/vendor/auctions" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#221b16] hover:bg-[#f9f5f0]">My Auctions</Link>
                    )}
                    <hr className="my-1 border-[#e4d6c8]" />
                    <button onClick={() => { setMenuOpen(false); logout() }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="rounded-full px-4 py-1.5 text-sm text-[#6c5b4f] hover:text-[#221b16]">Sign in</Link>
              <Link to="/auth/register" className="rounded-full bg-[#221b16] px-4 py-1.5 text-sm font-semibold text-[#f9f5f0]">Register</Link>
            </>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#221b16]">☰</button>
        </div>
      </div>
    </nav>
  )
}
