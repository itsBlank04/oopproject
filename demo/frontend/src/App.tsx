import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProductListPage from './pages/products/ProductListPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/cart/CheckoutPage'
import AccountOrdersPage from './pages/account/AccountOrdersPage'
import ProfilePage from './pages/account/ProfilePage'
import WishlistPage from './pages/account/WishlistPage'
import AddressesPage from './pages/account/AddressesPage'
import NotificationsPage from './pages/account/NotificationsPage'
import MessagesPage from './pages/account/MessagesPage'
import VendorProductsPage from './pages/vendor/VendorProductsPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import VendorAuctionsPage from './pages/vendor/VendorAuctionsPage'
import UsedListingsPage from './pages/used/UsedListingsPage'
import UsedListingDetailPage from './pages/used/UsedListingDetailPage'
import CreateUsedListingPage from './pages/used/CreateUsedListingPage'
import AuctionsPage from './pages/auctions/AuctionsPage'
import AuctionDetailPage from './pages/auctions/AuctionDetailPage'
import TechniciansPage from './pages/repair/TechniciansPage'
import RepairRequestsPage from './pages/repair/RepairRequestsPage'

type Category = {
  id: number
  name: string
  slug: string
  sortOrder: number
  iconUrl: string | null
  parentId: number | null
}

const modules = [
  {
    name: 'Main Marketplace',
    description: 'New products, verified vendors, real-time stock, and secure order lifecycles.',
    metrics: ['12k vendors', '48h payouts', '98.7% trust'],
  },
  {
    name: 'Used Items Exchange',
    description: 'Negotiate offers, verify condition, and close with escrow-style safety.',
    metrics: ['Live offers', 'Condition grading', 'Seller reputation'],
  },
  {
    name: 'Repair Services',
    description: 'Technician matching, quote flow, and booking orchestration built into the core.',
    metrics: ['4 specializations', 'Schedule sync', 'Quality tiers'],
  },
  {
    name: 'Live Auctions',
    description: 'Bid pacing, anti-sniping logic, and admin approval gates for every session.',
    metrics: ['WebSocket bids', 'Smart increments', 'Fraud shields'],
  },
]

const rails = [
  { title: 'Session-based security', description: 'HttpSession auth with instant revocation and role-guarded endpoints per app.' },
  { title: 'Supabase-ready schema', description: '71 tables, 35 triggers, and idempotent migrations aligned to v5.0.' },
  { title: 'Admin isolation', description: 'Separate domain, bundle, and cookie scope to keep governance secure.' },
]

const milestones = [
  { label: 'Phase 01', title: 'Identity + Access', detail: 'Roles, profiles, agreements, and audit coverage.' },
  { label: 'Phase 02', title: 'Commerce Core', detail: 'Products, inventory, orders, payments, and shipping flows.' },
  { label: 'Phase 03', title: 'Marketplace Expansion', detail: 'Used listings, repairs, auctions, and trust scoring.' },
]

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) { setCategories(data); return }
        setCategoryError('No category data returned.')
      })
      .catch(() => { setCategoryError('Unable to reach the API.') })
  }, [])

  return (
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16]">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-28 h-96 w-96 rounded-full bg-[#f7c56b] opacity-35 blur-[110px]" />
          <div className="absolute right-[-140px] top-24 h-96 w-96 rounded-full bg-[#6ba6f7] opacity-30 blur-[120px]" />
          <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-[#7fd1b2] opacity-25 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-10">
          <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#8c7564]">Smart multi-vendor commerce</p>
              <h1 className="mt-6 font-[Fraunces] text-5xl font-semibold leading-tight text-[#221b16] sm:text-6xl">
                One marketplace. Four engines. Built for real-time trust.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[#4f4035]">
                AtomDrops unifies new products, used items, repairs, and auctions into a
                single operating system. Every interaction feeds a living trust score so
                buyers, vendors, and technicians move faster with certainty.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Launch roadmap</button>
                <button className="rounded-full border border-[#cbb7a5] px-6 py-3 text-sm font-semibold text-[#221b16]">View architecture</button>
              </div>
              <div className="mt-10 grid gap-4 text-sm text-[#5d4c40] sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e4d6c8] bg-white/70 px-4 py-4 shadow-[0_16px_40px_rgba(34,27,22,0.08)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a28672]">Latency</p>
                  <p className="mt-2 font-[Fraunces] text-2xl text-[#221b16]">120ms</p>
                  <p className="mt-2">Real-time bidding + chat.</p>
                </div>
                <div className="rounded-2xl border border-[#e4d6c8] bg-white/70 px-4 py-4 shadow-[0_16px_40px_rgba(34,27,22,0.08)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a28672]">Coverage</p>
                  <p className="mt-2 font-[Fraunces] text-2xl text-[#221b16]">71</p>
                  <p className="mt-2">Tables in schema v5.0.</p>
                </div>
                <div className="rounded-2xl border border-[#e4d6c8] bg-white/70 px-4 py-4 shadow-[0_16px_40px_rgba(34,27,22,0.08)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a28672]">Roles</p>
                  <p className="mt-2 font-[Fraunces] text-2xl text-[#221b16]">4</p>
                  <p className="mt-2">Customer, vendor, tech, admin.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#dbc7b6] bg-[#221b16] p-6 text-[#f9f5f0] shadow-[0_30px_60px_rgba(34,27,22,0.3)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#f7c56b]">System status</p>
                <h2 className="mt-4 font-[Fraunces] text-3xl">Trust engine calibrated</h2>
                <p className="mt-3 text-sm text-[#e7d9cc]">Fraud detection, session revocation, and audit coverage are running in a single compliance lane.</p>
                <div className="mt-6 grid gap-4 text-xs text-[#c9b8a8] sm:grid-cols-2">
                  <div><p>Risk flags resolved</p><p className="mt-2 text-lg font-semibold text-[#f9f5f0]">94.3%</p></div>
                  <div><p>Avg. response time</p><p className="mt-2 text-lg font-semibold text-[#f9f5f0]">42 mins</p></div>
                  <div><p>Active bids</p><p className="mt-2 text-lg font-semibold text-[#f9f5f0]">1,320</p></div>
                  <div><p>Live repair queues</p><p className="mt-2 text-lg font-semibold text-[#f9f5f0]">214</p></div>
                </div>
              </div>
              <div className="rounded-3xl border border-[#dbc7b6] bg-white/80 p-6 shadow-[0_24px_50px_rgba(34,27,22,0.1)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#b18a6e]">Deployment lanes</p>
                <div className="mt-5 space-y-4 text-sm text-[#4f4035]">
                  {rails.map((r) => (
                    <div key={r.title} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#221b16]" />
                      <div><p className="font-semibold text-[#221b16]">{r.title}</p><p className="text-[#6f5b4f]">{r.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="-mt-12 grid gap-6 rounded-[32px] border border-[#e4d6c8] bg-white/80 p-8 shadow-[0_30px_60px_rgba(34,27,22,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#a28672]">Platform modules</p>
              <h2 className="mt-3 font-[Fraunces] text-3xl text-[#221b16]">Every marketplace, orchestrated.</h2>
            </div>
            <button className="rounded-full border border-[#cbb7a5] px-5 py-2 text-sm font-semibold text-[#221b16]">Export system map</button>
          </div>
          <div className="rounded-3xl border border-[#efe1d2] bg-white px-6 py-4 text-sm text-[#5d4c40]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#b18a6e]">Live data from API</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {categories.length > 0
                ? categories.map((c) => (
                    <span key={c.id} className="rounded-full border border-[#d6c4b2] bg-[#f9f5f0] px-4 py-1 text-xs">{c.name}</span>
                  ))
                : <span className="text-xs text-[#8c7564]">{categoryError || 'Loading categories...'}</span>}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {modules.map((m) => (
              <div key={m.name} className="rounded-3xl border border-[#efe1d2] bg-[#f9f5f0] p-6 shadow-[0_20px_40px_rgba(34,27,22,0.08)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#b18a6e]">{m.name}</p>
                <p className="mt-4 font-[Fraunces] text-2xl text-[#221b16]">{m.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#5d4c40]">
                  {m.metrics.map((metric) => (
                    <span key={metric} className="rounded-full border border-[#d6c4b2] bg-white px-4 py-1">{metric}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-[#e5d6c7] bg-[#221b16] p-10 text-[#f9f5f0] shadow-[0_30px_60px_rgba(34,27,22,0.3)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#f7c56b]">Data spine</p>
            <h2 className="mt-4 font-[Fraunces] text-3xl">Schema-first commerce with audit-grade history.</h2>
            <p className="mt-4 text-sm text-[#e7d9cc]">Soft deletes are scoped to users, products, and used listings. Every other record is hard-deleted to keep the operational graph lean and fast.</p>
            <div className="mt-8 grid gap-4 text-sm text-[#e0d2c6]">
              <div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f7c56b]" /><p>JSONB snapshots preserve shipping data at checkout.</p></div>
              <div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f7c56b]" /><p>Analytics snapshots precompute KPIs nightly at UTC midnight.</p></div>
              <div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#f7c56b]" /><p>Audit logs store before/after payloads for admin actions.</p></div>
            </div>
          </div>
          <div className="rounded-[32px] border border-[#e5d6c7] bg-white/80 p-10 shadow-[0_24px_50px_rgba(34,27,22,0.15)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a28672]">Delivery plan</p>
            <h2 className="mt-4 font-[Fraunces] text-3xl text-[#221b16]">Milestones for the build.</h2>
            <div className="mt-8 space-y-6">
              {milestones.map((m) => (
                <div key={m.label} className="rounded-2xl border border-[#e8d8c8] bg-[#f9f5f0] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#b18a6e]">{m.label}</p>
                  <p className="mt-2 font-[Fraunces] text-xl text-[#221b16]">{m.title}</p>
                  <p className="mt-2 text-sm text-[#5d4c40]">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e4d6c8] bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-[#5d4c40]">
          <p>AtomDrops OS · Session-secured · Supabase-ready</p>
          <div className="flex flex-wrap gap-4"><span>Marketplace</span><span>Admin</span><span>Trust Lab</span></div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Auth */}
        <Route path="/auth/login" element={<><Navbar /><LoginPage /></>} />
        <Route path="/auth/register" element={<><Navbar /><RegisterPage /></>} />

        {/* Products */}
        <Route path="/products" element={<><Navbar /><ProductListPage /></>} />
        <Route path="/products/:id" element={<><Navbar /><ProductDetailPage /></>} />

        {/* Shopping */}
        <Route path="/cart" element={<><Navbar /><CartPage /></>} />
        <Route path="/checkout" element={<><Navbar /><CheckoutPage /></>} />

        {/* Used Items */}
        <Route path="/used-listings" element={<><Navbar /><UsedListingsPage /></>} />
        <Route path="/used-listings/new" element={<><Navbar /><CreateUsedListingPage /></>} />
        <Route path="/used-listings/:id" element={<><Navbar /><UsedListingDetailPage /></>} />

        {/* Auctions */}
        <Route path="/auctions" element={<><Navbar /><AuctionsPage /></>} />
        <Route path="/auctions/:id" element={<><Navbar /><AuctionDetailPage /></>} />

        {/* Repair */}
        <Route path="/repair/technicians" element={<><Navbar /><TechniciansPage /></>} />
        <Route path="/repair/requests" element={<><Navbar /><RepairRequestsPage /></>} />

        {/* Account */}
        <Route path="/account/orders" element={<><Navbar /><AccountOrdersPage /></>} />
        <Route path="/profile" element={<><Navbar /><ProfilePage /></>} />
        <Route path="/wishlist" element={<><Navbar /><WishlistPage /></>} />
        <Route path="/addresses" element={<><Navbar /><AddressesPage /></>} />
        <Route path="/notifications" element={<><Navbar /><NotificationsPage /></>} />
        <Route path="/messages" element={<><Navbar /><MessagesPage /></>} />

        {/* Vendor */}
        <Route path="/vendor/dashboard" element={<><Navbar /><VendorDashboardPage /></>} />
        <Route path="/vendor/products" element={<><Navbar /><VendorProductsPage /></>} />
        <Route path="/vendor/auctions" element={<><Navbar /><VendorAuctionsPage /></>} />

        {/* Home (catch-all) */}
        <Route path="*" element={<><Navbar /><HomePage /></>} />
      </Routes>
    </>
  )
}
