import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { toast } from 'react-hot-toast'
import { 
  Store, Plus, Settings, Users, ArrowRight, MapPin, 
  Trash2, UserPlus, LayoutDashboard, ShieldCheck
} from 'lucide-react'

type Category = {
  id: number
  name: string
  slug: string
}

type Shop = {
  id: number
  name: string
  slug: string
  logoUrl: string
  bannerUrl: string
  description: string
  location: string
  policies: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  verificationLevel: string
  createdAt: string
}

type ShopStaff = {
  id: number
  user: {
    id: number
    displayName: string
    email: string
  }
  role: 'OWNER' | 'MANAGER' | 'INVENTORY' | 'SUPPORT'
}

type SubscriptionSummary = {
  maxShops: number
  currentShopCount: number
}

export default function VendorShopManagerPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  
  // Modals / Selection states
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [managingStaffShop, setManagingStaffShop] = useState<Shop | null>(null)
  
  // Create Shop Form State
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLoc, setNewLoc] = useState('')
  const [newPolicies, setNewPolicies] = useState('')
  const [newCategory, setNewCategory] = useState<string>('')
  const [newLogo, setNewLogo] = useState('')
  const [newBanner, setNewBanner] = useState('')
  const [createError, setCreateError] = useState('')

  // Edit Shop Form State
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLoc, setEditLoc] = useState('')
  const [editPolicies, setEditPolicies] = useState('')
  const [editLogo, setEditLogo] = useState('')
  const [editBanner, setEditBanner] = useState('')
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ACTIVE')
  const [editError, setEditError] = useState('')

  // Staff Form State
  const [staffEmailOrId, setStaffEmailOrId] = useState('')
  const [staffRole, setStaffRole] = useState<'MANAGER' | 'INVENTORY' | 'SUPPORT'>('MANAGER')
  const [staffError, setStaffError] = useState('')

  // Queries
  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['vendor-shops-list'],
    queryFn: () => apiClient.get('/api/shops/vendor').then((r) => r.data),
  })

  const { data: summary } = useQuery<SubscriptionSummary>({
    queryKey: ['subscription-summary'],
    queryFn: () => apiClient.get('/api/vendor/subscription/summary').then((r) => r.data),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-list'],
    queryFn: () => apiClient.get('/api/categories').then((r) => r.data),
  })

  const { data: staffList = [], refetch: refetchStaff } = useQuery<ShopStaff[]>({
    queryKey: ['shop-staff-list', managingStaffShop?.id],
    queryFn: () => apiClient.get(`/api/shops/${managingStaffShop?.id}/staff`).then((r) => r.data),
    enabled: !!managingStaffShop,
  })

  // Mutations
  const createShopMutation = useMutation({
    mutationFn: (newShop: any) => apiClient.post('/api/shops', newShop).then((r) => r.data),
    onSuccess: () => {
      toast.success('Shop created successfully!')
      queryClient.invalidateQueries({ queryKey: ['vendor-shops-list'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-summary'] })
      setActiveTab('list')
      // Reset creation form
      setNewName('')
      setNewDesc('')
      setNewLoc('')
      setNewPolicies('')
      setNewCategory('')
      setNewLogo('')
      setNewBanner('')
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.error || 'Failed to create shop.')
    },
  })

  const updateShopMutation = useMutation({
    mutationFn: (args: { id: number; updates: any }) =>
      apiClient.put(`/api/shops/${args.id}`, args.updates).then((r) => r.data),
    onSuccess: () => {
      toast.success('Shop updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['vendor-shops-list'] })
      setEditingShop(null)
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.error || 'Failed to update shop.')
    },
  })

  const addStaffMutation = useMutation({
    mutationFn: (args: { shopId: number; userId: number; role: string }) =>
      apiClient.post(`/api/shops/${args.shopId}/staff`, { userId: args.userId, role: args.role }).then((r) => r.data),
    onSuccess: () => {
      refetchStaff()
      setStaffEmailOrId('')
    },
    onError: (err: any) => {
      setStaffError(err.response?.data?.error || 'Failed to add staff.')
    },
  })

  const removeStaffMutation = useMutation({
    mutationFn: (args: { shopId: number; staffId: number }) =>
      apiClient.delete(`/api/shops/${args.shopId}/staff/${args.staffId}`).then((r) => r.data),
    onSuccess: () => {
      refetchStaff()
    },
  })

  // Handlers
  const handleCreateShopSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!newName.trim()) {
      setCreateError('Shop name is required.')
      return
    }
    createShopMutation.mutate({
      name: newName,
      description: newDesc,
      location: newLoc,
      policies: newPolicies,
      logoUrl: newLogo || null,
      bannerUrl: newBanner || null,
      primaryCategoryId: newCategory ? Number(newCategory) : null,
    })
  }

  const handleOpenEdit = (shop: Shop) => {
    setEditingShop(shop)
    setEditName(shop.name)
    setEditDesc(shop.description || '')
    setEditLoc(shop.location || '')
    setEditPolicies(shop.policies || '')
    setEditLogo(shop.logoUrl || '')
    setEditBanner(shop.bannerUrl || '')
    setEditStatus(shop.status)
    setEditError('')
  }

  const handleEditShopSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShop) return
    setEditError('')
    updateShopMutation.mutate({
      id: editingShop.id,
      updates: {
        name: editName,
        description: editDesc,
        location: editLoc,
        policies: editPolicies,
        logoUrl: editLogo,
        bannerUrl: editBanner,
        status: editStatus,
      },
    })
  }

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!managingStaffShop) return
    setStaffError('')
    
    // In our system, the input needs to be a User ID (number)
    const userIdNum = Number(staffEmailOrId)
    if (isNaN(userIdNum)) {
      setStaffError('Please enter a valid numeric User ID.')
      return
    }

    addStaffMutation.mutate({
      shopId: managingStaffShop.id,
      userId: userIdNum,
      role: staffRole,
    })
  }

  const slotLimitReached = summary ? (summary.maxShops !== -1 && summary.currentShopCount >= summary.maxShops) : false

  return (
    <div className="min-h-screen bg-[#faf6f2] py-12 px-6">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="font-[Fraunces] text-4xl font-bold text-[#221b16]">Shop Manager</h1>
            <p className="text-[#8c7564] text-sm mt-2">Create, design, and manage permissions for your online storefront outlets.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'list' 
                  ? 'bg-[#8c7564] text-white shadow-sm' 
                  : 'bg-white border border-[#e4d6c8] text-[#8c7564] hover:bg-gray-50'
              }`}
            >
              My Shops ({shops.length})
            </button>
            <Link
              to={slotLimitReached ? '#' : '/vendor/shops/setup'}
              onClick={(e) => { if (slotLimitReached) e.preventDefault() }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                slotLimitReached
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-white border border-[#e4d6c8] text-[#8c7564] hover:bg-gray-50'
              }`}
            >
              <Plus className="h-4 w-4" />
              Create Shop
            </Link>
          </div>
        </div>

        {/* Limit Warning */}
        {slotLimitReached && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between gap-4">
            <div>
              <strong>Shop limit reached!</strong> You are currently using {summary?.currentShopCount} of your {summary?.maxShops} allocated shop slots.
            </div>
            <Link to="/vendor/subscription" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all">
              Upgrade Subscription
            </Link>
          </div>
        )}

        {/* Tab 1: Shop List */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {shopsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#e4d6c8]/30" />
                ))}
              </div>
            ) : shops.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-2xl border border-[#e4d6c8]/40">
                <Store className="mx-auto h-12 w-12 text-[#8c7564] mb-4" />
                <h3 className="font-[Fraunces] text-lg font-semibold text-[#221b16]">No Shops Found</h3>
                <p className="text-[#8c7564] text-xs max-w-sm mx-auto mt-2 mb-6">Create your first shop outlet to start uploading products and scheduling auctions.</p>
                <button
                  disabled={slotLimitReached}
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2.5 bg-[#8c7564] text-white rounded-xl text-xs font-semibold hover:bg-[#6c5b4f] transition-all disabled:bg-gray-300"
                >
                  Create Outlet
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {shops.map((shop) => (
                  <div key={shop.id} className="bg-white border border-[#e4d6c8]/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-4 items-center">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#e4d6c8] border border-gray-100 flex-shrink-0">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-[Fraunces] text-2xl text-[#6c5b4f]">
                            {shop.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-[Fraunces] text-xl font-bold text-[#221b16]">{shop.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            shop.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {shop.status}
                          </span>
                          {shop.verificationLevel !== 'STANDARD' && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                              <ShieldCheck className="h-3 w-3" />
                              {shop.verificationLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8c7564] flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {shop.location || 'Dhaka, Bangladesh'}
                        </p>
                        <p className="text-[10px] text-gray-400">Slug: {shop.slug}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <Link 
                        to={`/vendor/dashboard?shop=${shop.id}`} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e4d6c8] text-[#8c7564] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                      </Link>
                      <Link 
                        to={`/shop/${shop.slug}`} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e4d6c8] text-[#8c7564] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                      >
                        Visit Shop <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(shop)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e4d6c8] text-[#8c7564] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                      >
                        <Settings className="h-3.5 w-3.5" /> Customize
                      </button>
                      <button
                        onClick={() => setManagingStaffShop(shop)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-[#e4d6c8] text-[#8c7564] rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all"
                      >
                        <Users className="h-3.5 w-3.5" /> Staff
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Shop */}
        {activeTab === 'create' && (
          <div className="bg-white border border-[#e4d6c8]/60 rounded-2xl p-8 shadow-sm max-w-xl mx-auto">
            <h2 className="font-[Fraunces] text-2xl text-[#221b16] font-bold mb-6">Create New Shop</h2>
            <form onSubmit={handleCreateShopSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ATOM Gadget Spot"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Primary Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564] bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell customers what products you specialize in..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Location / Outlet Address</label>
                <input
                  type="text"
                  placeholder="e.g. Multiplan Center, Dhaka"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Shop Policies (Returns, Warranty, Shipping details)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. 7-day refund policy, standard delivery takes 3 days..."
                  value={newPolicies}
                  onChange={(e) => setNewPolicies(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.jpg"
                  value={newLogo}
                  onChange={(e) => setNewLogo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8c7564]">Banner Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={newBanner}
                  onChange={(e) => setNewBanner(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8c7564]"
                />
              </div>

              {createError && <p className="text-red-500 text-xs">{createError}</p>}

              <button
                type="submit"
                disabled={createShopMutation.isPending}
                className={`w-full py-3 text-white rounded-xl text-sm font-semibold transition-all ${
                  createShopMutation.isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8c7564] hover:bg-[#6c5b4f]'
                }`}
              >
                {createShopMutation.isPending ? 'Creating...' : 'Create Outlet'}
              </button>
            </form>
          </div>
        )}

        {/* Modal: Edit Shop Customization */}
        {editingShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#e4d6c8] bg-white p-6 shadow-xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              
              <button
                onClick={() => setEditingShop(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>

              <h3 className="font-[Fraunces] text-2xl text-[#221b16] font-bold mb-6">Shop Settings</h3>
              
              <form onSubmit={handleEditShopSubmit} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#8c7564]">Shop Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#8c7564]">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564] bg-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8c7564]">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.jpg"
                    value={editLogo}
                    onChange={(e) => setEditLogo(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8c7564]">Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={editBanner}
                    onChange={(e) => setEditBanner(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8c7564]">Description</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8c7564]">Location</label>
                  <input
                    type="text"
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#8c7564]">Policies</label>
                  <textarea
                    rows={3}
                    value={editPolicies}
                    onChange={(e) => setEditPolicies(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                  />
                </div>

                {editError && <p className="text-red-500 text-xs">{editError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingShop(null)}
                    className="w-1/2 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all text-[#8c7564]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateShopMutation.isPending}
                    className="w-1/2 py-2.5 bg-[#8c7564] text-white rounded-xl text-xs font-semibold hover:bg-[#6c5b4f] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Staff Management */}
        {managingStaffShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-[#e4d6c8] bg-white p-6 shadow-xl relative max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              
              <button
                onClick={() => setManagingStaffShop(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>

              <div className="mb-6">
                <h3 className="font-[Fraunces] text-2xl text-[#221b16] font-bold">Staff Management</h3>
                <p className="text-xs text-[#8c7564] mt-1">Manage managers, inventory, and support accounts for <span className="font-semibold text-[#221b16]">{managingStaffShop.name}</span></p>
              </div>

              {/* Add Staff Form */}
              <form onSubmit={handleAddStaffSubmit} className="flex gap-2 mb-6 items-end">
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] font-semibold text-[#8c7564]">User ID (Numeric)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter user ID number"
                    value={staffEmailOrId}
                    onChange={(e) => setStaffEmailOrId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8c7564]"
                  />
                </div>
                <div className="w-32 space-y-1">
                  <label className="block text-[10px] font-semibold text-[#8c7564]">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8c7564] bg-white"
                  >
                    <option value="MANAGER">MANAGER</option>
                    <option value="INVENTORY">INVENTORY</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addStaffMutation.isPending}
                  className="px-4 py-2 bg-[#8c7564] text-white rounded-xl text-xs font-semibold hover:bg-[#6c5b4f] transition-all flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </button>
              </form>

              {staffError && <p className="text-red-500 text-xs mb-4">{staffError}</p>}

              {/* Staff List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#221b16] uppercase tracking-wider">Current Staff List</h4>
                
                {staffList.length === 0 ? (
                  <p className="text-xs text-[#8c7564] italic">No custom staff members added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 border border-[#e4d6c8]/40 rounded-xl bg-gray-50/50">
                        <div>
                          <p className="text-xs font-bold text-[#221b16]">{staff.user.displayName}</p>
                          <p className="text-[10px] text-gray-400">{staff.user.email} (ID: {staff.user.id})</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-semibold text-slate-800 border border-slate-200">
                            {staff.role}
                          </span>
                          {staff.role !== 'OWNER' && (
                            <button
                              onClick={() => removeStaffMutation.mutate({ shopId: managingStaffShop.id, staffId: staff.id })}
                              className="text-gray-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
