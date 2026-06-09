import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const vendorLinks = [
  { to: "/vendor/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/vendor/shops", label: "Shops", icon: "M3 21h18M3 7v14a1 1 0 001 1h16a1 1 0 001-1V7M3 7l9-5 9 5M9 21V11h6v10" },
  { to: "/vendor/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { to: "/vendor/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { to: "/vendor/auctions", label: "Auctions", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/vendor/subscription", label: "Billing", icon: "M17 9V7a2 2 0 00-2-2H9a2 2 0 00-2 2v2m4 4h6m-6 4h6m4-8v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2z" },
  { to: "/vendor/financials", label: "Financials", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { to: "/vendor/reviews", label: "Reviews", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
]

const technicianLinks = [
  { to: "/repair/dashboard", label: "Dashboard", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { to: "/repair/requests", label: "Requests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { to: "/repair/jobs", label: "Jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
]

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { activeRole, setActiveRole } = useAuth()
  const location = useLocation()

  const links = activeRole === 'vendor' ? vendorLinks : activeRole === 'technician' ? technicianLinks : []

  if (activeRole === null) return null

  const modeLabel = activeRole === 'vendor' ? 'Merchant Mode' : 'Repair Mode'
  const modeColor = 'bg-[#221b16]'
  const modeColorLight = 'bg-[#221b16]/10 text-[#221b16] hover:bg-[#221b16]/20'

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-[#221b16] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)]"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onToggle} />}

      <aside className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-[#e4d6c8]/60 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} lg:top-[60px] lg:h-[calc(100vh-60px)]`}>
        <div className="flex h-20 items-center gap-3 border-b border-[#e4d6c8]/40 px-5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${modeColor}`}>
            <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
              {activeRole === 'vendor' ? (
                <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              )}
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8c7564]">{modeLabel}</p>
            <p className="truncate text-sm font-medium text-[#221b16]">{activeRole === 'vendor' ? 'Vendor Panel' : 'Technician Panel'}</p>
          </div>
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8c7564] transition-colors hover:bg-[#f9f5f0] hover:text-[#221b16]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4 mx-3 flex items-center gap-2.5 rounded-xl bg-[#f9f5f0] px-3 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#221b16]">{activeRole === 'vendor' ? 'Merchant' : 'Craftsman'}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-emerald-600">Active</p>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8c7564]/60">Navigation</p>
            {links.map(link => {
              const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/')
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => { if (open) onToggle() }}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${modeColor} text-white shadow-sm`
                      : 'text-[#6c5b4f] hover:bg-[#f9f5f0] hover:text-[#221b16]'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? '' : 'text-[#8c7564] group-hover:text-[#221b16]'}`}>
                    <path d={link.icon} />
                  </svg>
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-[#e4d6c8]/40 p-3">
          <div className="flex items-center justify-between rounded-xl bg-[#f9f5f0] px-3 py-2.5">
            <span className="text-[11px] font-medium text-[#6c5b4f]">Mode Active</span>
            <button
              onClick={() => { setActiveRole(null); if (open) onToggle() }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${modeColorLight}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3 w-3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Deactivate
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
