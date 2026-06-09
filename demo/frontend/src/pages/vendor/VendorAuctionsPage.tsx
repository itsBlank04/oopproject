import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import { useConfirmAction } from '../../hooks/useConfirmAction'

type Auction = {
  id: number
  title: string
  type: string
  status: string
  preparationDurationMinutes: number
  activeDurationMinutes: number
  startTime?: string
  endTime?: string
  lots?: AuctionLot[]
}

type AuctionLot = {
  id: number
  title: string
  description?: string
  conditionNote?: string
  startingPriceBdt: number
  reservePriceBdt?: number
  minBidIncrementBdt: number
  extensionDurationMinutes: number
  maxExtensions: number
  status: string
  category?: { id: number; name: string }
  images?: { imageUrl: string }[]
}

type Category = { id: number; name: string }

export default function VendorAuctionsPage() {
  const queryClient = useQueryClient()
  const { askConfirm, showResult, Dialogs } = useConfirmAction()
  const [showForm, setShowForm] = useState(false)
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null)
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null)
  const [lotForm, setLotForm] = useState({
    title: '',
    description: '',
    conditionNote: 'Used',
    startingPriceBdt: '',
    reservePriceBdt: '',
    minBidIncrementBdt: '50',
    extensionDurationMinutes: '5',
    maxExtensions: '3',
    categoryId: '',
  })
  const [auctionForm, setAuctionForm] = useState({
    title: '',
    type: 'STANDARD',
    preparationDurationMinutes: '10',
    activeDurationMinutes: '60',
    termsAccepted: false,
  })
  const [lotImages, setLotImages] = useState<Record<number, string[]>>({})

  const { data: auctions = [], isLoading } = useQuery<Auction[]>({
    queryKey: ['vendor-auctions'],
    queryFn: () => apiClient.get('/api/vendor/auctions').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 20_000,
    placeholderData: (prev) => prev ?? [],
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data.value ?? r.data),
    placeholderData: (prev) => prev ?? [],
  })

  const createAuction = useMutation({
    mutationFn: async () => {
      const body = {
        title: auctionForm.title,
        type: auctionForm.type,
        preparationDurationMinutes: parseInt(auctionForm.preparationDurationMinutes, 10),
        activeDurationMinutes: parseInt(auctionForm.activeDurationMinutes, 10),
        termsAccepted: auctionForm.termsAccepted,
      }
      return apiClient.post('/api/auctions', body).then(r => r.data)
    },
    onSuccess: (created) => {
      setEditingAuction(created)
      setSelectedAuctionId(created.id)
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
      showResult('Auction created', 'success')
    },
    onError: (e: any) => showResult(e.response?.data?.error || 'Failed to create auction', 'error'),
  })

  const updateAuction = useMutation({
    mutationFn: async () => {
      if (!editingAuction) return
      const body: any = {
        title: auctionForm.title,
        type: auctionForm.type,
        preparationDurationMinutes: parseInt(auctionForm.preparationDurationMinutes, 10),
        activeDurationMinutes: parseInt(auctionForm.activeDurationMinutes, 10),
        termsAccepted: auctionForm.termsAccepted,
      }
      return apiClient.put(`/api/auctions/${editingAuction.id}`, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
      showResult('Auction created', 'success')
    },
    onError: (e: any) => showResult(e.response?.data?.error || 'Failed to create auction', 'error'),
  })

  const publishAuction = useMutation({
    mutationFn: (auctionId: number) => apiClient.post(`/api/auctions/${auctionId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
      showResult('Auction updated', 'success')
    },
    onError: (e: any) => showResult(e.response?.data?.error || 'Failed to update auction', 'error'),
  })

  const createLot = useMutation({
    mutationFn: async (auctionId: number) => {
      const body = {
        title: lotForm.title,
        description: lotForm.description,
        conditionNote: lotForm.conditionNote,
        startingPriceBdt: parseFloat(lotForm.startingPriceBdt),
        reservePriceBdt: lotForm.reservePriceBdt ? parseFloat(lotForm.reservePriceBdt) : null,
        minBidIncrementBdt: parseFloat(lotForm.minBidIncrementBdt),
        extensionDurationMinutes: parseInt(lotForm.extensionDurationMinutes, 10),
        maxExtensions: parseInt(lotForm.maxExtensions, 10),
        categoryId: lotForm.categoryId ? parseInt(lotForm.categoryId, 10) : undefined,
      }
      const created = await apiClient.post(`/api/auctions/${auctionId}/lots`, body).then(r => r.data)
      const urls = lotImages[auctionId] || []
      for (const url of urls) {
        await apiClient.post(`/api/auction-lots/${created.id}/images`, { imageUrl: url }).catch(() => {})
      }
      return created
    },
    onSuccess: (_, auctionId) => {
      setLotForm({
        title: '', description: '', conditionNote: 'Used', startingPriceBdt: '', reservePriceBdt: '',
        minBidIncrementBdt: '50', extensionDurationMinutes: '5', maxExtensions: '3', categoryId: '',
      })
      setLotImages(prev => { const next = { ...prev }; delete next[auctionId]; return next })
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
      showResult('Lot created', 'success')
    },
    onError: (e: any) => showResult(e.response?.data?.error || 'Failed to add lot', 'error'),
  })

  const deleteLot = useMutation({
    mutationFn: (lotId: number) => apiClient.delete(`/api/auction-lots/${lotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
    },
  })

  const deleteAuction = useMutation({
    mutationFn: (auctionId: number) => apiClient.delete(`/api/auctions/${auctionId}`),
    onSuccess: () => {
      setEditingAuction(null)
      setSelectedAuctionId(null)
      queryClient.invalidateQueries({ queryKey: ['vendor-auctions'] })
    },
  })

  const openCreate = () => {
    setEditingAuction(null)
    setSelectedAuctionId(null)
    setAuctionForm({ title: '', type: 'STANDARD', preparationDurationMinutes: '10', activeDurationMinutes: '60', termsAccepted: false })
    setShowForm(true)
  }

  const openEdit = (auction: Auction) => {
    setEditingAuction(auction)
    setSelectedAuctionId(auction.id)
    setAuctionForm({
      title: auction.title,
      type: auction.type,
      preparationDurationMinutes: String(auction.preparationDurationMinutes ?? 10),
      activeDurationMinutes: String(auction.activeDurationMinutes ?? 60),
      termsAccepted: true,
    })
    setShowForm(true)
  }

  const selectedAuction = useMemo(() => auctions.find(a => a.id === selectedAuctionId) || null, [auctions, selectedAuctionId])
  const editingLocked = !!editingAuction && editingAuction.status !== 'CREATED'
  const metrics = useMemo(() => ({
    total: auctions.length,
    draft: auctions.filter(auction => auction.status === 'CREATED').length,
    live: auctions.filter(auction => auction.status === 'ACTIVE').length,
    queued: auctions.filter(auction => auction.status === 'PREPARING').length,
    lots: auctions.reduce((total, auction) => total + (auction.lots?.length || 0), 0),
  }), [auctions])

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-[#e4d6c8] bg-white p-6 text-[#221b16] shadow-[0_24px_70px_rgba(34,27,22,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c4956a]">Seller Auction Studio</p>
              <h1 className="mt-3 font-[Fraunces] text-4xl text-[#221b16] md:text-5xl">Build a live bidding event</h1>
              <p className="mt-3 text-sm leading-7 text-[#6c5b4f]">Create a draft, add honest lot details and photos, accept the rules, then publish. Published lots are locked so buyers compete against a stable listing.</p>
            </div>
            <button onClick={openCreate}
              className="rounded-2xl bg-[#c4956a] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-[#a87a4e] hover:shadow-lg active:scale-[0.97]">
              + New Auction
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            <StudioMetric label="Total" value={metrics.total} />
            <StudioMetric label="Draft" value={metrics.draft} />
            <StudioMetric label="Queued" value={metrics.queued} />
            <StudioMetric label="Live" value={metrics.live} />
            <StudioMetric label="Lots" value={metrics.lots} />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : auctions.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
            No auctions yet. Create your first auction!
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {auctions.map((a) => (
              <div key={a.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#221b16]">{a.title}</h3>
                    <p className="text-xs text-[#8c7564]">{a.type} · {a.lots?.length || 0} lot(s)</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : a.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' : a.status === 'CREATED' ? 'bg-[#f9f5f0] text-[#6c5b4f]' : 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(a)} className="rounded-lg border border-[#e4d6c8] px-3 py-1.5 text-xs">Edit</button>
                  {a.status === 'CREATED' && (
                    <button onClick={() => askConfirm({
                      title: 'Publish auction',
                      description: `Publish "${a.title}"? Once live, lots cannot be edited.`,
                      label: 'Auction published',
                      request: () => publishAuction.mutateAsync(a.id),
                    })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">Publish</button>
                  )}
                  {a.status === 'CREATED' && (
                    <button onClick={() => askConfirm({
                      title: 'Delete auction',
                      description: `Delete "${a.title}" and all its lots? Cannot be undone.`,
                      tone: 'danger',
                      label: 'Auction deleted',
                      request: () => deleteAuction.mutateAsync(a.id),
                    })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600">Delete</button>
                  )}
                  <Link to={`/auctions/${a.id}`} className="rounded-lg border border-[#e4d6c8] px-3 py-1.5 text-xs">View</Link>
                </div>
                {(a.startTime || a.endTime) && (
                  <div className="mt-4 rounded-xl bg-[#f9f5f0] px-3 py-2 text-xs text-[#6c5b4f]">
                    {a.startTime && <p>Starts: {new Date(a.startTime).toLocaleString()}</p>}
                    {a.endTime && <p>Ends: {new Date(a.endTime).toLocaleString()}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border border-[#e4d6c8] bg-white p-6">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">{editingAuction ? 'Edit Auction' : 'Create Auction'}</h2>
              {editingLocked && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Published auctions are locked. You can monitor bids from the public view, but listing rules cannot be changed after launch.
                </div>
              )}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#6c5b4f]">Title</label>
                  <input value={auctionForm.title} onChange={e => setAuctionForm({ ...auctionForm, title: e.target.value })}
                    disabled={editingLocked}
                    className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2 disabled:bg-[#f9f5f0] disabled:text-[#8c7564]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#6c5b4f]">Type</label>
                    <select value={auctionForm.type} onChange={e => setAuctionForm({ ...auctionForm, type: e.target.value })}
                      disabled={editingLocked}
                      className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2 disabled:bg-[#f9f5f0] disabled:text-[#8c7564]">
                      <option value="STANDARD">Standard</option>
                      <option value="FLASH">Flash</option>
                      <option value="REVERSE">Reverse</option>
                      <option value="RESERVE">Reserve</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <input type="checkbox" checked={auctionForm.termsAccepted}
                      disabled={editingLocked}
                      onChange={e => setAuctionForm({ ...auctionForm, termsAccepted: e.target.checked })} />
                    <span className="text-xs text-[#8c7564]">I accept auction rules</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#6c5b4f]">Preparation (min)</label>
                    <input type="number" min="0" value={auctionForm.preparationDurationMinutes}
                      disabled={editingLocked}
                      onChange={e => setAuctionForm({ ...auctionForm, preparationDurationMinutes: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2 disabled:bg-[#f9f5f0] disabled:text-[#8c7564]" />
                    <p className="mt-0.5 text-[10px] text-[#8c7564]">Shown to buyers before bidding starts</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#6c5b4f]">Active duration (min)</label>
                    <input type="number" min="1" value={auctionForm.activeDurationMinutes}
                      disabled={editingLocked}
                      onChange={e => setAuctionForm({ ...auctionForm, activeDurationMinutes: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2 disabled:bg-[#f9f5f0] disabled:text-[#8c7564]" />
                    <p className="mt-0.5 text-[10px] text-[#8c7564]">How long bidding stays open</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editingAuction ? updateAuction.mutate() : createAuction.mutate()} disabled={editingLocked || createAuction.isPending || updateAuction.isPending}
                    className="rounded-xl bg-[#221b16] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">{editingAuction ? 'Save Auction' : 'Create Auction'}</button>
                  <button onClick={() => setShowForm(false)} className="rounded-xl border border-[#e4d6c8] px-4 py-2 text-sm">Close</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4d6c8] bg-white p-6">
              <h2 className="font-[Fraunces] text-xl text-[#221b16]">Lots</h2>
              {!selectedAuction && (
                <p className="mt-2 text-sm text-[#8c7564]">Create or select an auction to manage lots.</p>
              )}
              {selectedAuction && (
                <>
                  {selectedAuction.status !== 'CREATED' && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This auction is published, so lot editing is locked for buyer trust. Use the public auction page to monitor bids.
                    </div>
                  )}
                  {selectedAuction.status === 'CREATED' && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Lot title</label>
                        <input value={lotForm.title} onChange={e => setLotForm({ ...lotForm, title: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Condition</label>
                        <select value={lotForm.conditionNote} onChange={e => setLotForm({ ...lotForm, conditionNote: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2">
                          <option>New</option>
                          <option>Used</option>
                          <option>Refurbished</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#6c5b4f]">Description</label>
                      <textarea value={lotForm.description} onChange={e => setLotForm({ ...lotForm, description: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" rows={3} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Starting price</label>
                        <input value={lotForm.startingPriceBdt} onChange={e => setLotForm({ ...lotForm, startingPriceBdt: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Min increment</label>
                        <input value={lotForm.minBidIncrementBdt} onChange={e => setLotForm({ ...lotForm, minBidIncrementBdt: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Reserve</label>
                        <input value={lotForm.reservePriceBdt} onChange={e => setLotForm({ ...lotForm, reservePriceBdt: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Extension (min)</label>
                        <input value={lotForm.extensionDurationMinutes} onChange={e => setLotForm({ ...lotForm, extensionDurationMinutes: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Max extensions</label>
                        <input value={lotForm.maxExtensions} onChange={e => setLotForm({ ...lotForm, maxExtensions: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#6c5b4f]">Category</label>
                        <select value={lotForm.categoryId} onChange={e => setLotForm({ ...lotForm, categoryId: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[#e4d6c8] px-3 py-2">
                          <option value="">Select</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#6c5b4f]">Images</label>
                      <MediaUploader folder={`auctions/${selectedAuction.id}/lots/new`}
                        maxFiles={6} maxSizeMB={8} allowVideo={false}
                        onUpload={(urls) => setLotImages(prev => ({ ...prev, [selectedAuction.id]: urls }))} />
                    </div>
                    <button onClick={() => createLot.mutate(selectedAuction.id)} disabled={createLot.isPending}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">{createLot.isPending ? 'Adding...' : 'Add Lot'}</button>
                  </div>
                  )}

                  <div className="mt-6 space-y-3">
                    {(selectedAuction.lots || []).map(lot => (
                      <div key={lot.id} className="flex items-center justify-between rounded-xl border border-[#e4d6c8] px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold">{lot.title}</p>
                          <p className="text-xs text-[#8c7564]">৳{lot.startingPriceBdt} · {lot.status}</p>
                        </div>
                        {selectedAuction.status === 'CREATED' && (
                          <button onClick={() => askConfirm({
                            title: 'Delete lot',
                            description: `Delete lot "${lot.title}"? Active bidders will be notified.`,
                            tone: 'danger',
                            label: 'Lot deleted',
                            request: () => deleteLot.mutateAsync(lot.id),
                          })} className="text-xs text-red-600">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {Dialogs}
    </div>
  )
}

function StudioMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e4d6c8] bg-[#f9f5f0] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7564]">{label}</p>
      <p className="mt-1 font-[Fraunces] text-3xl text-[#221b16]">{value}</p>
    </div>
  )
}
