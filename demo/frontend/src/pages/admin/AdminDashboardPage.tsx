import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useConfirmAction } from '../../hooks/useConfirmAction'

type AdminTab = 'overview' | 'users' | 'market' | 'orders' | 'auctions' | 'cases' | 'settings' | 'notices' | 'upgrades' | 'audit' | 'plans' | 'deals' | 'verification'
type User = { id: number; email: string; displayName: string; phone?: string; status: string; roles: string[]; redFlagCount?: number; redFlagNotes?: string; createdAt?: string }
type Auction = { id: number; title: string; type: string; status: string; vendor?: { displayName: string }; lots?: unknown[]; endTime?: string }
type Report = { id: number; entityType: string; entityId: number; reason: string; status: string; reporter?: { displayName: string }; reported?: { displayName: string } }
type ReturnRequest = { id: number; reason: string; status: string; customer?: { displayName: string }; order?: { id: number } }
type PlatformSetting = { key: string; value: string; description?: string; dataType?: string }
type SystemNotification = { id: number; title: string; body: string; type: string; active: boolean; startsAt: string }
type VendorProfile = { id: number; shopName: string; verificationStatus: string; user?: { displayName: string } }
type AuditLog = { id: number; action: string; entityType: string; entityId?: number; actor?: { displayName: string }; createdAt: string }
type Product = { id: number; name: string; status: string; priceBdt?: number; vendor?: { displayName: string } }
type UsedListing = { id: number; title: string; status: string; priceBdt?: number; seller?: { displayName: string } }
type ServiceListing = { id: number; title: string; status: string; priceMinBdt?: number; priceMaxBdt?: number }
type RoleUpgrade = { id: number; user: { id: number; displayName: string; email: string; roles: string[] }; role: string; amountBdt: number; status: string; activatedAt?: string; createdAt: string }
type Order = { id: number; status: string; totalBdt?: number; customer?: { displayName: string }; items?: unknown[] }
type SubscriptionPlan = { id: number; name: string; displayName: string; maxShops: number; priceMonthlyBdt: number; priceYearlyBdt: number; discountPercent: number; features?: string }
type SubscriptionDeal = { id: number; title: string; description?: string; dealType: string; value: number; plan?: { id: number; displayName: string }; startsAt: string; endsAt: string; isActive: boolean }
type AdminShop = { id: number; name: string; slug: string; status: string; verificationLevel: string; vendor?: { displayName: string }; location?: string }

const tabs: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'users', label: 'Users', icon: '◉' },
  { id: 'market', label: 'Marketplace', icon: '◆' },
  { id: 'orders', label: 'Orders', icon: '◎' },
  { id: 'auctions', label: 'Auctions', icon: '◇' },
  { id: 'cases', label: 'Cases', icon: '▲' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'notices', label: 'Notices', icon: '▣' },
  { id: 'upgrades', label: 'Upgrades', icon: '⬆' },
  { id: 'audit', label: 'Audit', icon: '▤' },
  { id: 'plans', label: 'Plans', icon: '📋' },
  { id: 'deals', label: 'Deals', icon: '🏷' },
  { id: 'verification', label: 'Verification', icon: '✓' },
]

const PRIMARY_ADMIN_EMAIL = 'admin@login.com'
const marketplaceRoles = ['CUSTOMER', 'VENDOR', 'TECHNICIAN']
const ORDER_STATUSES = ['PLACED', 'APPROVED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function money(value: unknown) {
  const amount = Number(value ?? 0)
  return `BDT ${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString() : '—'
}

function cls(status?: string) {
  const n = status?.toUpperCase()
  if (['ACTIVE', 'APPROVED', 'VERIFIED', 'PAID', 'RESOLVED', 'SHIPPED', 'DELIVERED', 'TRUE'].includes(n || ''))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (['BANNED', 'REJECTED', 'DISMISSED', 'FAILED', 'CANCELLED', 'SUSPENDED', 'HIDDEN'].includes(n || ''))
    return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

function Pill({ value }: { value?: string }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase leading-normal tracking-wider ${cls(value)}`}>{value || '—'}</span>
}

export default function AdminDashboardPage() {
  const { user, loading, hasRole } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [search, setSearch] = useState('')
  const [roleDrafts, setRoleDrafts] = useState<Record<number, string[]>>({})
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({})
  const [redFlagReasons, setRedFlagReasons] = useState<Record<number, string>>({})
  const [orderOverrides, setOrderOverrides] = useState<Record<number, string>>({})
  const [notice, setNotice] = useState({ title: '', body: '', type: 'INFO', targetRoles: 'CUSTOMER,VENDOR,TECHNICIAN', startsAt: new Date().toISOString().slice(0, 16) })
  const [planForm, setPlanForm] = useState<Partial<SubscriptionPlan>>({ name: '', displayName: '', maxShops: 1, priceMonthlyBdt: 0, priceYearlyBdt: 0, discountPercent: 0, features: '' })
  const [dealForm, setDealForm] = useState<Partial<SubscriptionDeal>>({ title: '', description: '', dealType: 'DISCOUNT', value: 0, plan: undefined, startsAt: new Date().toISOString().slice(0, 16), endsAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16) })
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [editingDealId, setEditingDealId] = useState<number | null>(null)

  const enabled = !!user && hasRole('ADMIN')

  const dashboard = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => apiClient.get('/api/admin/analytics/dashboard').then(r => r.data), enabled })
  const users = useQuery<User[]>({ queryKey: ['admin-users'], queryFn: () => apiClient.get('/api/admin/users').then(r => r.data), enabled })
  const auctions = useQuery<Auction[]>({ queryKey: ['admin-auctions'], queryFn: () => apiClient.get('/api/admin/auctions').then(r => r.data), enabled })
  const products = useQuery<Product[]>({ queryKey: ['admin-products'], queryFn: () => apiClient.get('/api/admin/products').then(r => r.data), enabled })
  const usedListings = useQuery<UsedListing[]>({ queryKey: ['admin-used-listings'], queryFn: () => apiClient.get('/api/admin/used-listings').then(r => r.data), enabled })
  const serviceListings = useQuery<ServiceListing[]>({ queryKey: ['admin-service-listings'], queryFn: () => apiClient.get('/api/admin/service-listings').then(r => r.data), enabled })
  const orders = useQuery<Order[]>({ queryKey: ['admin-orders'], queryFn: () => apiClient.get('/api/admin/orders').then(r => r.data), enabled })
  const reports = useQuery<Report[]>({ queryKey: ['admin-reports'], queryFn: () => apiClient.get('/api/admin/reports').then(r => r.data), enabled })
  const returns = useQuery<ReturnRequest[]>({ queryKey: ['admin-returns'], queryFn: () => apiClient.get('/api/admin/returns').then(r => r.data), enabled })
  const settings = useQuery<PlatformSetting[]>({ queryKey: ['admin-settings'], queryFn: () => apiClient.get('/api/admin/platform-settings').then(r => r.data), enabled })
  const notices = useQuery<SystemNotification[]>({ queryKey: ['admin-system-notifications'], queryFn: () => apiClient.get('/api/admin/system-notifications').then(r => r.data), enabled })
  const vendors = useQuery<VendorProfile[]>({ queryKey: ['admin-vendors'], queryFn: () => apiClient.get('/api/admin/vendors').then(r => r.data), enabled })
  const auditLogs = useQuery<AuditLog[]>({ queryKey: ['admin-audit-logs'], queryFn: () => apiClient.get('/api/admin/audit-logs').then(r => r.data), enabled })
  const upgrades = useQuery<RoleUpgrade[]>({ queryKey: ['admin-upgrades'], queryFn: () => apiClient.get('/api/admin/upgrades').then(r => r.data), enabled })
  const plans = useQuery<SubscriptionPlan[]>({ queryKey: ['admin-plans'], queryFn: () => apiClient.get('/api/admin/subscription/plans').then(r => r.data), enabled })
  const deals = useQuery<SubscriptionDeal[]>({ queryKey: ['admin-deals'], queryFn: () => apiClient.get('/api/admin/subscription/deals').then(r => r.data), enabled })
  const adminShops = useQuery<AdminShop[]>({ queryKey: ['admin-shops'], queryFn: () => apiClient.get('/api/admin/shops').then(r => r.data), enabled })

  const refresh = () => qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith('admin-') })

  const { askConfirm, Dialogs } = useConfirmAction()

  function act(opts: {
    label: string
    title: string
    description: string
    tone?: 'default' | 'danger'
    request: () => Promise<unknown>
  }) {
    askConfirm({
      ...opts,
      request: async () => {
        await opts.request()
        await refresh()
      },
    })
  }

  function toggleRole(userId: number, role: string, current: string[]) {
    const draft = roleDrafts[userId] ?? current
    setRoleDrafts(prev => ({ ...prev, [userId]: draft.includes(role) ? draft.filter(r => r !== role) : [...draft, role] }))
  }

  function resetPlanForm(p?: SubscriptionPlan) {
    setPlanForm(p ? { ...p } : { name: '', displayName: '', maxShops: 1, priceMonthlyBdt: 0, priceYearlyBdt: 0, discountPercent: 0, features: '' })
    setEditingPlanId(p?.id ?? null)
  }

  function resetDealForm(d?: SubscriptionDeal) {
    setDealForm(d ? { ...d, plan: d.plan ? { id: d.plan.id, displayName: d.plan.displayName } : undefined, startsAt: new Date(d.startsAt).toISOString().slice(0, 16), endsAt: new Date(d.endsAt).toISOString().slice(0, 16) } : { title: '', description: '', dealType: 'DISCOUNT', value: 0, plan: undefined, startsAt: new Date().toISOString().slice(0, 16), endsAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16) })
    setEditingDealId(d?.id ?? null)
  }

  const verificationLevels = ['STANDARD', 'VERIFIED', 'PREMIUM', 'TRUSTED']

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f6f1ea]"><div className="font-[Fraunces] text-lg text-[#5c4e42]">Loading admin…</div></div>

  if (!user || !hasRole('ADMIN')) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f1ea] p-8">
      <div className="max-w-lg rounded-2xl border border-[#dccfc2] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f1ea] text-2xl">⚜</div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a07850]">Restricted</p>
        <h1 className="mt-2 font-[Fraunces] text-3xl text-[#221b16]">Admin Access Required</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6d5d50]">Sign in with the primary admin account to access the governance panel.</p>
      </div>
    </div>
  )

  const userRows = (users.data || []).filter(item => {
    const n = search.toLowerCase()
    return !n || item.displayName?.toLowerCase().includes(n) || item.email?.toLowerCase().includes(n)
  })
  const openReports = (reports.data || []).filter(item => item.status === 'OPEN')
  const openReturns = (returns.data || []).filter(item => item.status === 'OPEN')
  const pendingAuctions = (auctions.data || []).filter(item => item.status === 'CREATED')
  const metricRows = [
    ['Users', dashboard.data?.totalUsers ?? users.data?.length ?? 0],
    ['Orders', dashboard.data?.totalOrders ?? orders.data?.length ?? 0],
    ['Products', dashboard.data?.totalProducts ?? products.data?.length ?? 0],
    ['Auctions', dashboard.data?.totalAuctions ?? auctions.data?.length ?? 0],
    ['Open Cases', openReports.length + openReturns.length],
    ['Audit Events', auditLogs.data?.length ?? 0],
  ]
  const visibleUserRows = userRows.slice(0, 30)

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-[#221b16]">
      {/* HEADER */}
      <header className="border-b border-[#dccfc2] bg-[#221b16] text-[#fcf6ef]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4a85a]">AtomDrops Governance</p>
            <h1 className="mt-2 font-[Fraunces] text-4xl">Admin Control Room</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#bfb0a0]">Users, marketplace, orders, auctions, cases, settings, and audit — all in one command centre.</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-[#5c4e42] bg-[#2e261f] px-5 py-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4a85a] text-xs font-bold text-[#221b16]">A</div>
            <div>
              <p className="text-[#bfb0a0] text-xs">Signed in as</p>
              <p className="font-semibold text-[#fcf6ef]">{user.displayName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* SIDEBAR */}
          <aside className="h-fit rounded-xl border border-[#dccfc2] bg-white p-1.5 shadow-sm">
            {tabs.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-all ${tab === item.id ? 'bg-[#221b16] text-[#fcf6ef] shadow-sm' : 'text-[#5c4e42] hover:bg-[#f6f1ea]'}`}>
                <span className="w-5 text-center text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </aside>

          {/* CONTENT */}
          <main className="space-y-6">
            {tab === 'overview' && <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metricRows.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#dccfc2] bg-white p-5 shadow-sm transition hover:shadow-md">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a07850]">{label}</p>
                    <p className="mt-1 font-[Fraunces] text-3xl">{value}</p>
                  </div>
                ))}
              </section>
              <div className="grid gap-4 xl:grid-cols-3">
                <Panel title="Pending Auctions" count={pendingAuctions.length}>
                  {pendingAuctions.slice(0, 5).map(item => <Row key={item.id} title={item.title} meta={`${item.type} · ${item.vendor?.displayName || 'Vendor'}`} status={item.status} />)}
                </Panel>
                <Panel title="Open Reports" count={openReports.length}>
                  {openReports.slice(0, 5).map(item => <Row key={item.id} title={item.reason} meta={`${item.entityType} #${item.entityId}`} status={item.status} />)}
                </Panel>
                <Panel title="Audit Trail" count={auditLogs.data?.length || 0}>
                  {(auditLogs.data || []).slice(-5).reverse().map(item => <Row key={item.id} title={item.action} meta={`${item.entityType}${item.entityId ? ` #${item.entityId}` : ''}`} status={dateLabel(item.createdAt)} />)}
                </Panel>
              </div>
            </>}

            {tab === 'users' && <section className="overflow-hidden rounded-xl border border-[#dccfc2] bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#e3d6c9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-[Fraunces] text-xl">User Governance</h2>
                <div className="flex items-center gap-3">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" className="w-56 rounded-lg border border-[#dccfc2] px-3.5 py-2 text-sm outline-none transition focus:border-[#221b16]" />
                  <span className="text-xs font-medium text-[#7a6858]">{visibleUserRows.length} of {userRows.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-[#f6f1ea] text-[11px] font-bold uppercase tracking-[0.15em] text-[#7a6858]">
                    <tr><th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">Flags</th><th className="px-5 py-3.5">Roles</th><th className="px-5 py-3.5">Actions</th></tr>
                  </thead>
                  <tbody>
                    {visibleUserRows.map(row => {
                      const primary = row.email.toLowerCase() === PRIMARY_ADMIN_EMAIL
                      const roles = primary ? ['ADMIN'] : roleDrafts[row.id] ?? row.roles ?? []
                      return (
                        <tr key={row.id} className="border-t border-[#e8dcd0] transition hover:bg-[#faf7f3]">
                          <td className="px-5 py-4"><p className="font-semibold">{row.displayName}</p><p className="text-xs text-[#7a6858]">{row.email}</p></td>
                          <td className="px-5 py-4"><Pill value={row.status} /></td>
                          <td className="px-5 py-4">
                            {primary ? <span className="text-xs text-[#7a6858]">—</span> : (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${(row.redFlagCount || 0) > 2 ? 'bg-rose-100 text-rose-700' : (row.redFlagCount || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {row.redFlagCount || 0}
                                </span>
                                <input value={redFlagReasons[row.id] ?? ''} onChange={e => setRedFlagReasons(prev => ({ ...prev, [row.id]: e.target.value }))}
                                  placeholder="Reason…" className="w-32 rounded border border-[#dccfc2] px-2 py-1 text-xs outline-none focus:border-[#221b16]" />
                                <button onClick={() => {
                                  const reason = redFlagReasons[row.id]?.trim() || 'Suspicious activity'
                                  act({ label: 'Red flag added', title: 'Add red flag', description: `Add a red flag to ${row.displayName} (${row.email})? Reason: ${reason}`, tone: 'danger', request: () => apiClient.post(`/api/admin/users/${row.id}/red-flag`, { reason }) })
                                }} className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200">Flag</button>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {primary ? <span className="rounded-full border border-[#221b16] bg-[#221b16] px-2.5 py-0.5 text-xs font-bold text-[#fcf6ef]">ADMIN</span> :
                                marketplaceRoles.map(role => (
                                  <button key={role} onClick={() => toggleRole(row.id, role, row.roles || [])}
                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold transition ${roles.includes(role) ? 'border-[#221b16] bg-[#221b16] text-[#fcf6ef]' : 'border-[#dccfc2] text-[#5c4e42] hover:bg-[#f6f1ea]'}`}>{role}</button>
                                ))
                              }
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {primary ? <span className="rounded-lg border border-[#dccfc2] px-3 py-1.5 text-xs font-semibold text-[#7a6858]">Primary</span> : <>
                                <Btn onClick={() => act({ label: 'Roles saved', title: 'Update roles', description: `Change roles for ${row.displayName} to ${roles.join(', ') || 'none'}?`, request: () => apiClient.put(`/api/admin/users/${row.id}/roles`, { roles }) })}>Roles</Btn>
                                {row.status === 'SUSPENDED' || row.status === 'BANNED'
                                  ? <Btn onClick={() => act({ label: 'User unbanned', title: 'Unban user', description: `Restore access for ${row.displayName}?`, request: () => apiClient.put(`/api/admin/users/${row.id}/unban`) })}>Unban</Btn>
                                  : <><Btn onClick={() => act({ label: 'User suspended', title: 'Suspend user', description: `Suspend ${row.displayName}? They cannot sign in until unsuspended.`, tone: 'danger', request: () => apiClient.put(`/api/admin/users/${row.id}/suspend`, {}) })}>Suspend</Btn>
                                    <DangerBtn onClick={() => act({ label: 'User banned', title: 'Ban user', description: `Ban ${row.displayName}? They will be locked out. Reversible with Unban.`, tone: 'danger', request: () => apiClient.put(`/api/admin/users/${row.id}/ban`) })}>Ban</DangerBtn></>}
                                <DangerBtn onClick={() => act({ label: 'User deleted', title: 'Delete user', description: `Delete ${row.displayName}? This cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/users/${row.id}`) })}>Delete</DangerBtn>
                              </>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {userRows.length > 30 && <p className="border-t border-[#e3d6c9] px-5 py-3 text-xs text-[#7a6858]">Narrow the search to see users beyond the first 30.</p>}
            </section>}

            {tab === 'market' && <div className="grid gap-4 xl:grid-cols-3">
              <Panel title="New Products" count={products.data?.length || 0}>
                {(products.data || []).slice(0, 20).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-t border-[#e3d6c9] px-5 py-3.5">
                    <Row title={item.name} meta={`${item.vendor?.displayName || 'Vendor'} · ${money(item.priceBdt)}`} status={item.status} />
                    <div className="flex gap-1">
                      {item.status !== 'HIDDEN' && <DangerBtn onClick={() => act({ label: 'Product hidden', title: 'Hide product', description: `Hide "${item.name}" from the marketplace? Reversible.`, tone: 'danger', request: () => apiClient.put(`/api/admin/products/${item.id}/hide`) })}>Hide</DangerBtn>}
                      <DangerBtn onClick={() => act({ label: 'Product deleted', title: 'Delete product', description: `Permanently delete "${item.name}"? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/products/${item.id}`) })}>Delete</DangerBtn>
                    </div>
                  </div>
                ))}
              </Panel>
              <Panel title="Used Listings" count={usedListings.data?.length || 0}>
                {(usedListings.data || []).slice(0, 20).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-t border-[#e3d6c9] px-5 py-3.5">
                    <Row title={item.title} meta={`${item.seller?.displayName || 'Seller'} · ${money(item.priceBdt)}`} status={item.status} />
                    <div className="flex gap-1">
                      {item.status !== 'HIDDEN' && <DangerBtn onClick={() => act({ label: 'Listing hidden', title: 'Hide listing', description: `Hide "${item.title}" from the marketplace? Reversible.`, tone: 'danger', request: () => apiClient.put(`/api/admin/used-listings/${item.id}/hide`) })}>Hide</DangerBtn>}
                      <DangerBtn onClick={() => act({ label: 'Listing deleted', title: 'Delete listing', description: `Permanently delete "${item.title}"? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/used-listings/${item.id}`) })}>Delete</DangerBtn>
                    </div>
                  </div>
                ))}
              </Panel>
              <Panel title="Repair Services" count={serviceListings.data?.length || 0}>
                {(serviceListings.data || []).slice(0, 20).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-t border-[#e3d6c9] px-5 py-3.5">
                    <Row title={item.title} meta={`${money(item.priceMinBdt)} – ${money(item.priceMaxBdt)}`} status={item.status} />
                    <DangerBtn onClick={() => act({ label: 'Service deleted', title: 'Delete service', description: `Permanently delete "${item.title}"? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/service-listings/${item.id}`) })}>Delete</DangerBtn>
                  </div>
                ))}
              </Panel>
            </div>}

            {tab === 'orders' && <Panel title="Order Oversight" count={orders.data?.length || 0}>
              {(orders.data || []).slice(0, 50).map(item => (
                <div key={item.id} className="flex flex-col gap-2 border-t border-[#e3d6c9] px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
                  <Row title={`Order #${item.id}`} meta={`${item.customer?.displayName || 'Customer'} · ${money(item.totalBdt)} · ${item.items?.length || 0} item(s)`} status={item.status} />
                  <div className="flex items-center gap-2">
                    <select value={orderOverrides[item.id] ?? item.status} onChange={e => setOrderOverrides(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="rounded-lg border border-[#dccfc2] px-2.5 py-1.5 text-xs outline-none focus:border-[#221b16]">
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Btn onClick={() => act({ label: 'Order status overridden', title: 'Override order status', description: `Set Order #${item.id} (${item.customer?.displayName || 'Customer'}) status to ${orderOverrides[item.id] ?? item.status}?`, request: () => apiClient.put(`/api/admin/orders/${item.id}/status`, { status: orderOverrides[item.id] ?? item.status }) })}>Override</Btn>
                    <DangerBtn onClick={() => act({ label: 'Order deleted', title: 'Cancel order', description: `Cancel Order #${item.id}? This cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/orders/${item.id}`) })}>Cancel</DangerBtn>
                  </div>
                </div>
              ))}
            </Panel>}

            {tab === 'auctions' && <Panel title="Auction Moderation" count={auctions.data?.length || 0}>
              {(auctions.data || []).map(item => {
                const modifiable = !['CREATED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(item.status)
                return (
                <div key={item.id} className="flex flex-col gap-3 border-t border-[#e3d6c9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[#7a6858]">{item.type} · {item.vendor?.displayName || 'Vendor'} · {item.lots?.length || 0} lot(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill value={item.status} />
                    {item.status === 'CREATED' && <>
                      <DangerBtn onClick={() => act({ label: 'Auction rejected', title: 'Reject auction', description: `Reject "${item.title}"? Vendor will be notified.`, tone: 'danger', request: () => apiClient.put(`/api/admin/auctions/${item.id}/reject`, { notes: 'Rejected by admin' }) })}>Reject</DangerBtn>
                    </>}
                    {modifiable && <>
                      {item.status !== 'FROZEN' && <Btn onClick={() => act({ label: 'Auction frozen', title: 'Freeze auction', description: `Freeze "${item.title}"? Bidding will be paused.`, request: () => apiClient.put(`/api/admin/auctions/${item.id}/freeze`) })}>Freeze</Btn>}
                      {item.status !== 'SUSPENDED' && <Btn onClick={() => act({ label: 'Auction suspended', title: 'Suspend auction', description: `Suspend "${item.title}"? It will be hidden from the floor.`, tone: 'danger', request: () => apiClient.put(`/api/admin/auctions/${item.id}/suspend`) })}>Suspend</Btn>}
                      <DangerBtn onClick={() => act({ label: 'Auction cancelled', title: 'Cancel auction', description: `Cancel "${item.title}"? Active bidders will be notified.`, tone: 'danger', request: () => apiClient.put(`/api/admin/auctions/${item.id}/cancel`) })}>Cancel</DangerBtn>
                    </>}
                    <DangerBtn onClick={() => act({ label: 'Auction deleted', title: 'Delete auction', description: `Permanently delete "${item.title}" and all its lots? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/auctions/${item.id}`) })}>Delete</DangerBtn>
                  </div>
                </div>
              )})}
            </Panel>}

            {tab === 'cases' && <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Reports" count={reports.data?.length || 0}>
                {(reports.data || []).map(item => (
                  <CaseRow key={item.id} title={item.reason} meta={`${item.entityType} #${item.entityId}`} status={item.status}
                    resolve={() => act({ label: 'Report resolved', title: 'Resolve report', description: `Mark this report (${item.entityType} #${item.entityId}) as resolved?`, request: () => apiClient.put(`/api/admin/reports/${item.id}/resolve`, { adminNote: 'Resolved by admin' }) })}
                    dismiss={() => act({ label: 'Report dismissed', title: 'Dismiss report', description: `Dismiss this report (${item.entityType} #${item.entityId}) without action?`, request: () => apiClient.put(`/api/admin/reports/${item.id}/dismiss`) })}
                    onDelete={() => act({ label: 'Report deleted', title: 'Delete report', description: `Delete this report? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/reports/${item.id}`) })} />
                ))}
              </Panel>
              <Panel title="Returns" count={returns.data?.length || 0}>
                {(returns.data || []).map(item => (
                  <CaseRow key={item.id} title={`Return #${item.id}`} meta={`${item.customer?.displayName || 'Customer'} · Order #${item.order?.id || 'n/a'} · ${item.reason || ''}`} status={item.status}
                    resolve={() => act({ label: 'Return approved', title: 'Approve return', description: `Approve Return #${item.id} for ${item.customer?.displayName || 'Customer'}?`, request: () => apiClient.put(`/api/admin/returns/${item.id}/approve`) })}
                    dismiss={() => act({ label: 'Return rejected', title: 'Reject return', description: `Reject Return #${item.id}? Customer will be notified.`, tone: 'danger', request: () => apiClient.put(`/api/admin/returns/${item.id}/reject`) })}
                    onDelete={() => act({ label: 'Return deleted', title: 'Delete return', description: `Delete Return #${item.id}? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/returns/${item.id}`) })} />
                ))}
              </Panel>
            </div>}

            {tab === 'settings' && <Panel title="Platform Settings" count={settings.data?.length || 0}>
                {(settings.data || []).map(item => (
                  <div key={item.key} className="grid gap-3 border-t border-[#e3d6c9] px-5 py-4 lg:grid-cols-[1fr_200px_auto] lg:items-center">
                    <div><p className="font-semibold">{item.key}</p><p className="text-xs text-[#7a6858]">{item.description || item.dataType}</p></div>
                    <input value={settingDrafts[item.key] ?? item.value} onChange={e => setSettingDrafts(p => ({ ...p, [item.key]: e.target.value }))} className="rounded-lg border border-[#dccfc2] px-3 py-2 text-sm outline-none transition focus:border-[#221b16]" />
                    <Btn onClick={() => act({ label: 'Setting updated', title: 'Save setting', description: `Update "${item.key}" to "${settingDrafts[item.key] ?? item.value}"?`, request: () => apiClient.put(`/api/admin/platform-settings/${encodeURIComponent(item.key)}`, { value: settingDrafts[item.key] ?? item.value }) })}>Save</Btn>
                  </div>
                ))}
              </Panel>}

            {tab === 'notices' && <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
              <div className="rounded-xl border border-[#dccfc2] bg-white p-5 shadow-sm">
                <h2 className="font-[Fraunces] text-xl">Create Notice</h2>
                <div className="mt-4 space-y-3">
                  <input value={notice.title} onChange={e => setNotice(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />
                  <textarea value={notice.body} onChange={e => setNotice(p => ({ ...p, body: e.target.value }))} placeholder="Body" rows={4} className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />
                  <input value={notice.targetRoles} onChange={e => setNotice(p => ({ ...p, targetRoles: e.target.value }))} placeholder="Target roles (comma-separated)" className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />
                  <input type="datetime-local" value={notice.startsAt} onChange={e => setNotice(p => ({ ...p, startsAt: e.target.value }))} className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />
                  <Btn onClick={() => act({ label: 'Notice created', title: 'Publish notice', description: notice.title ? `Publish "${notice.title}" to ${notice.targetRoles || 'all roles'}?` : 'Publish this notice?', request: () => apiClient.post('/api/admin/system-notifications', { ...notice, startsAt: new Date(notice.startsAt).toISOString() }) })}>Publish Notice</Btn>
                </div>
              </div>
              <Panel title="System Notices" count={notices.data?.length || 0}>
                {(notices.data || []).map(item => (
                  <div key={item.id} className="flex flex-col gap-3 border-t border-[#e3d6c9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <Row title={item.title} meta={`${item.type} · ${dateLabel(item.startsAt)}`} status={item.active ? 'ACTIVE' : 'INACTIVE'} />
                    <div className="flex gap-1.5">
                      <Btn onClick={() => act({ label: 'Notice toggled', title: item.active ? 'Disable notice' : 'Enable notice', description: `${item.active ? 'Disable' : 'Enable'} "${item.title}"? ${item.active ? 'Users will stop seeing it.' : 'Users will start seeing it.'}`, request: () => apiClient.put(`/api/admin/system-notifications/${item.id}`, { isActive: !item.active }) })}>{item.active ? 'Disable' : 'Enable'}</Btn>
                      <DangerBtn onClick={() => act({ label: 'Notice deleted', title: 'Delete notice', description: `Delete notice "${item.title}"? Cannot be undone.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/system-notifications/${item.id}`) })}>Delete</DangerBtn>
                    </div>
                  </div>
                ))}
              </Panel>
            </div>}

            {tab === 'upgrades' && <Panel title="Role Upgrades" count={upgrades.data?.length || 0}>
              {(upgrades.data || []).map(item => (
                <div key={item.id} className="flex flex-col gap-3 border-t border-[#e3d6c9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.user?.displayName || 'Unknown'}</p>
                    <p className="truncate text-xs text-[#7a6858]">{item.user?.email || '—'} · {item.role} · {dateLabel(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill value={item.status} />
                    {item.status === 'ACTIVE' && (
                      <DangerBtn onClick={() => act({ label: 'Upgrade cancelled', title: 'Revoke upgrade', description: `Revoke ${item.role} upgrade for ${item.user?.displayName || 'this user'}?`, tone: 'danger', request: () => apiClient.post(`/api/admin/upgrades/${item.id}/cancel`) })}>Revoke</DangerBtn>
                    )}
                    {item.status === 'PENDING_PAYMENT' && (
                      <DangerBtn onClick={() => act({ label: 'Upgrade cancelled', title: 'Cancel upgrade', description: `Cancel ${item.role} upgrade request for ${item.user?.displayName || 'this user'}?`, tone: 'danger', request: () => apiClient.post(`/api/admin/upgrades/${item.id}/cancel`) })}>Cancel</DangerBtn>
                    )}
                  </div>
                </div>
              ))}
            </Panel>}

            {tab === 'audit' && <Panel title="Audit Logs" count={auditLogs.data?.length || 0}>
              {(auditLogs.data || []).slice().reverse().map(item => <Row key={item.id} title={item.action} meta={`${item.actor?.displayName || 'System'} · ${item.entityType}${item.entityId ? ` #${item.entityId}` : ''}`} status={dateLabel(item.createdAt)} />)}
            </Panel>}

            {tab === 'plans' && <Panel title="Subscription Plans" count={plans.data?.length || 0}>
              {/* Plan form */}
              <div className="border-b border-[#e3d6c9] p-5 space-y-3">
                <h3 className="font-semibold text-sm">{editingPlanId ? 'Edit Plan' : 'New Plan'}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <PlanField label="Name" value={planForm.name || ''} onChange={v => setPlanForm(p => ({ ...p, name: v }))} />
                  <PlanField label="Display Name" value={planForm.displayName || ''} onChange={v => setPlanForm(p => ({ ...p, displayName: v }))} />
                  <PlanField label="Max Shops" value={String(planForm.maxShops ?? 1)} onChange={v => setPlanForm(p => ({ ...p, maxShops: Number(v) }))} />
                  <PlanField label="Monthly (BDT)" value={String(planForm.priceMonthlyBdt ?? 0)} onChange={v => setPlanForm(p => ({ ...p, priceMonthlyBdt: Number(v) }))} />
                  <PlanField label="Yearly (BDT)" value={String(planForm.priceYearlyBdt ?? 0)} onChange={v => setPlanForm(p => ({ ...p, priceYearlyBdt: Number(v) }))} />
                  <PlanField label="Discount %" value={String(planForm.discountPercent ?? 0)} onChange={v => setPlanForm(p => ({ ...p, discountPercent: Number(v) }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7a6858] mb-1">Features (one per line)</label>
                  <textarea value={planForm.features || ''} onChange={e => setPlanForm(p => ({ ...p, features: e.target.value }))} rows={3} className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2 text-sm outline-none transition focus:border-[#221b16]" />
                </div>
                <div className="flex gap-2">
                  <Btn onClick={() => {
                    if (!planForm.name || !planForm.displayName) { alert('Name and display name are required'); return }
                    const payload = { ...planForm, features: planForm.features || '' }
                    act({
                      label: editingPlanId ? 'Plan updated' : 'Plan created',
                      title: editingPlanId ? 'Update plan' : 'Create plan',
                      description: `${editingPlanId ? 'Update' : 'Create'} subscription plan "${planForm.displayName}"?`,
                      request: () => editingPlanId
                        ? apiClient.put(`/api/admin/subscription/plans/${editingPlanId}`, payload)
                        : apiClient.post('/api/admin/subscription/plans', payload),
                    })
                    resetPlanForm()
                  }}>{editingPlanId ? 'Update' : 'Create'}</Btn>
                  {editingPlanId && <DangerBtn onClick={() => resetPlanForm()}>Cancel</DangerBtn>}
                </div>
              </div>
              {/* Plan list */}
              {(plans.data || []).map(p => (
                <div key={p.id} className="flex items-center justify-between border-t border-[#e3d6c9] px-5 py-4">
                  <div>
                    <p className="font-semibold">{p.displayName}</p>
                    <p className="text-xs text-[#7a6858]">{p.name} · {p.maxShops} shops · {money(p.priceMonthlyBdt)}/mo · {money(p.priceYearlyBdt)}/yr</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Btn onClick={() => resetPlanForm(p)}>Edit</Btn>
                    <DangerBtn onClick={() => act({ label: 'Plan deleted', title: 'Delete plan', description: `Delete "${p.displayName}"? Existing subscribers will keep access until expiry.`, tone: 'danger', request: () => apiClient.delete(`/api/admin/subscription/plans/${p.id}`) })}>Delete</DangerBtn>
                  </div>
                </div>
              ))}
            </Panel>}

            {tab === 'deals' && <Panel title="Subscription Deals" count={deals.data?.length || 0}>
              {/* Deal form */}
              <div className="border-b border-[#e3d6c9] p-5 space-y-3">
                <h3 className="font-semibold text-sm">{editingDealId ? 'Edit Deal' : 'New Deal'}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PlanField label="Title" value={dealForm.title || ''} onChange={v => setDealForm(p => ({ ...p, title: v }))} />
                  <PlanField label="Type" value={dealForm.dealType || 'DISCOUNT'} onChange={v => setDealForm(p => ({ ...p, dealType: v }))}
                    render={() => <select value={dealForm.dealType || 'DISCOUNT'} onChange={e => setDealForm(p => ({ ...p, dealType: e.target.value }))}
                      className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]"
                    ><option value="FREE_TRIAL">Free Trial</option><option value="DISCOUNT">Discount</option><option value="FREE_MONTHS">Free Months</option></select>} />
                  <PlanField label="Value" value={String(dealForm.value ?? 0)} onChange={v => setDealForm(p => ({ ...p, value: Number(v) }))} />
                  <PlanField label="Linked Plan" value={String(dealForm.plan?.id ?? '')} onChange={v => setDealForm(p => ({ ...p, plan: v ? { id: Number(v), displayName: '' } : undefined }))}
                    render={() => <select value={String(dealForm.plan?.id ?? '')} onChange={e => setDealForm(p => ({ ...p, plan: e.target.value ? { id: Number(e.target.value), displayName: '' } : undefined }))}
                      className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]"
                    ><option value="">All Plans</option>{(plans.data || []).map(pl => <option key={pl.id} value={pl.id}>{pl.displayName}</option>)}</select>} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7a6858] mb-1">Description</label>
                  <textarea value={dealForm.description || ''} onChange={e => setDealForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2 text-sm outline-none transition focus:border-[#221b16]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PlanField label="Starts At" value={dealForm.startsAt || ''} onChange={v => setDealForm(p => ({ ...p, startsAt: v }))}
                    render={() => <input type="datetime-local" value={dealForm.startsAt?.slice(0, 16) || ''} onChange={e => setDealForm(p => ({ ...p, startsAt: e.target.value }))}
                      className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />} />
                  <PlanField label="Ends At" value={dealForm.endsAt || ''} onChange={v => setDealForm(p => ({ ...p, endsAt: v }))}
                    render={() => <input type="datetime-local" value={dealForm.endsAt?.slice(0, 16) || ''} onChange={e => setDealForm(p => ({ ...p, endsAt: e.target.value }))}
                      className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />} />
                </div>
                <div className="flex gap-2">
                  <Btn onClick={() => {
                    if (!dealForm.title) { alert('Title is required'); return }
                    act({
                      label: editingDealId ? 'Deal updated' : 'Deal created',
                      title: editingDealId ? 'Update deal' : 'Create deal',
                      description: `${editingDealId ? 'Update' : 'Create'} deal "${dealForm.title}"?`,
                      request: () => {
                        const payload: any = { ...dealForm }
                        if (payload.plan && payload.plan.id) payload.planId = payload.plan.id
                        delete payload.plan
                        payload.startsAt = new Date(payload.startsAt).toISOString()
                        payload.endsAt = new Date(payload.endsAt).toISOString()
                        return editingDealId
                          ? apiClient.put(`/api/admin/subscription/deals/${editingDealId}`, payload)
                          : apiClient.post('/api/admin/subscription/deals', payload)
                      },
                    })
                    resetDealForm()
                  }}>{editingDealId ? 'Update' : 'Create'}</Btn>
                  {editingDealId && <DangerBtn onClick={() => resetDealForm()}>Cancel</DangerBtn>}
                </div>
              </div>
              {/* Deal list */}
              {(deals.data || []).map(d => (
                <div key={d.id} className="flex items-center justify-between border-t border-[#e3d6c9] px-5 py-4">
                  <div>
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-xs text-[#7a6858]">{d.dealType} · {money(d.value)} · {d.plan ? d.plan.displayName : 'All plans'} · {d.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${d.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{d.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    <Btn onClick={() => resetDealForm(d)}>Edit</Btn>
                    <DangerBtn onClick={() => act({ label: 'Deal deleted', title: 'Delete deal', description: `Delete deal "${d.title}"?`, tone: 'danger', request: () => apiClient.delete(`/api/admin/subscription/deals/${d.id}`) })}>Delete</DangerBtn>
                  </div>
                </div>
              ))}
            </Panel>}

            {tab === 'verification' && <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Vendor Verification" count={vendors.data?.length || 0}>
                {(vendors.data || []).map(item => (
                  <div key={item.id} className="flex items-center justify-between border-t border-[#e3d6c9] px-5 py-4">
                    <div className="min-w-0"><p className="truncate font-semibold">{item.shopName}</p><p className="text-xs text-[#7a6858]">{item.user?.displayName || 'Vendor'}</p></div>
                    <div className="flex items-center gap-2">
                      <Pill value={item.verificationStatus} />
                      {item.verificationStatus !== 'VERIFIED' && <Btn onClick={() => act({ label: 'Vendor verified', title: 'Verify vendor', description: `Mark "${item.shopName}" (${item.user?.displayName || 'Vendor'}) as verified?`, request: () => apiClient.put(`/api/admin/vendors/${item.id}/verify`) })}>Verify</Btn>}
                    </div>
                  </div>
                ))}
              </Panel>
              <Panel title="Shop Verification Levels" count={adminShops.data?.length || 0}>
                {(adminShops.data || []).map(shop => (
                  <div key={shop.id} className="flex items-center justify-between border-t border-[#e3d6c9] px-5 py-4">
                    <div className="min-w-0"><p className="truncate font-semibold">{shop.name}</p><p className="text-xs text-[#7a6858]">{shop.vendor?.displayName || 'Vendor'} · {shop.slug}</p></div>
                    <div className="flex items-center gap-2">
                      <select value={shop.verificationLevel} onChange={e => {
                        const newLevel = e.target.value
                        act({ label: 'Verification updated', title: 'Update verification', description: `Set "${shop.name}" verification to ${newLevel}?`, request: () => apiClient.put(`/api/admin/shops/${shop.id}/verification`, { verificationLevel: newLevel }) })
                      }} className="rounded-lg border border-[#dccfc2] px-2.5 py-1.5 text-xs outline-none focus:border-[#221b16]">
                        {verificationLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <Pill value={shop.verificationLevel} />
                    </div>
                  </div>
                ))}
              </Panel>
            </div>}
          </main>
        </div>
      </div>
      {Dialogs}
    </div>
  )

}

function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-[#e3d6c9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <h2 className="font-[Fraunces] text-xl">{title}</h2>
    {aside}
  </div>
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-[#dccfc2] bg-white shadow-sm">
    <SectionHeader title={title} aside={<span className="rounded-full bg-[#f6f1ea] px-3 py-1 text-xs font-bold text-[#5c4e42]">{count}</span>} />
    <div>{children || <p className="px-5 py-8 text-sm text-[#7a6858]">No records.</p>}</div>
  </section>
}

function Row({ title, meta, status }: { title: string; meta: string; status?: string }) {
  return <div className="min-w-0 px-5 py-3.5">
    <p className="truncate font-semibold">{title}</p>
    <p className="mt-0.5 truncate text-xs text-[#7a6858]">{meta}</p>
    {status && <div className="mt-1.5"><Pill value={status} /></div>}
  </div>
}

function CaseRow({ title, meta, status, resolve, dismiss, onDelete }: { title: string; meta: string; status: string; resolve?: () => void; dismiss?: () => void; onDelete?: () => void }) {
  return <div className="flex flex-col gap-3 border-t border-[#e3d6c9] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
    <Row title={title} meta={meta} status={status} />
    <div className="flex gap-1.5">
      {status === 'OPEN' && resolve && <Btn onClick={resolve}>Resolve</Btn>}
      {status === 'OPEN' && dismiss && <DangerBtn onClick={dismiss}>Dismiss</DangerBtn>}
      {onDelete && <DangerBtn onClick={onDelete}>Delete</DangerBtn>}
    </div>
  </div>
}

function PlanField({ label, value, onChange, render }: { label: string; value: string; onChange: (v: string) => void; render?: () => ReactNode }) {
  return <div>
    <label className="block text-xs font-semibold text-[#7a6858] mb-1">{label}</label>
    {render ? render() : <input value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-[#dccfc2] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#221b16]" />}
  </div>
}

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-lg bg-[#221b16] px-3.5 py-1.5 text-xs font-bold text-[#fcf6ef] transition hover:bg-[#3a3028] active:scale-[0.97]">{children}</button>
}

function DangerBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-[0.97]">{children}</button>
}
