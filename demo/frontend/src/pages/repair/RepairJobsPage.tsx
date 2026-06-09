/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

export default function RepairJobsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'open' | 'active' | 'completed'>('open')

  const [selectedBidReq, setSelectedBidReq] = useState<any | null>(null)
  const [bidForm, setBidForm] = useState({
    quoteBdt: '',
    plan: '',
    estimatedDuration: '2-3 hours',
    visitCharge: '300',
    requiredParts: '',
    serviceNotes: '',
  })

  const [selectedBookingTimeline, setSelectedBookingTimeline] = useState<any | null>(null)
  const [timelineForm, setTimelineForm] = useState({ status: 'Inspection Completed', note: '', photoUrl: '' })

  const [selectedBookingParts, setSelectedBookingParts] = useState<any | null>(null)
  const [partForm, setPartForm] = useState({ partName: '', quantity: '1', priceBdt: '', reason: '' })

  const [selectedBookingComplete, setSelectedBookingComplete] = useState<any | null>(null)
  const [completeForm, setCompleteForm] = useState({ warrantyDays: '30', notes: '' })

  const { data: openRequests = [] } = useQuery<any[]>({
    queryKey: ['open-repair-requests'],
    queryFn: () => apiClient.get('/api/repair/requests/open').then(r => (Array.isArray(r.data) ? r.data : [])),
  })

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ['technician-bookings'],
    queryFn: () => apiClient.get('/api/repair/bookings/mine').then(r => (Array.isArray(r.data) ? r.data : [])),
  })

  const activeBookings = bookings.filter((b: any) => b.status !== 'COMPLETED' && b.status !== 'CLOSED')
  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED' || b.status === 'CLOSED')

  const submitBidMutation = useMutation({
    mutationFn: ({ reqId, data }: { reqId: number; data: any }) =>
      apiClient.post(`/api/repair/requests/${reqId}/quotes`, data),
    onSuccess: () => {
      toast.success('Bid quote submitted')
      setSelectedBidReq(null)
      setBidForm({ quoteBdt: '', plan: '', estimatedDuration: '2-3 hours', visitCharge: '300', requiredParts: '', serviceNotes: '' })
      queryClient.invalidateQueries({ queryKey: ['open-repair-requests'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to submit bid'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: string }) =>
      apiClient.put(`/api/repair/bookings/${bookingId}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update status'),
  })

  const addProgressMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: any }) =>
      apiClient.post(`/api/repair/bookings/${bookingId}/progress`, data),
    onSuccess: () => {
      toast.success('Timeline entry added')
      setSelectedBookingTimeline(null)
      setTimelineForm({ status: 'Inspection Completed', note: '', photoUrl: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add timeline entry'),
  })

  const addPartMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: any }) =>
      apiClient.post(`/api/repair/bookings/${bookingId}/parts`, data),
    onSuccess: () => {
      toast.success('Spare part proposed (pending customer approval)')
      setSelectedBookingParts(null)
      setPartForm({ partName: '', quantity: '1', priceBdt: '', reason: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add part'),
  })

  const completeJobMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: any }) =>
      apiClient.put(`/api/repair/bookings/${bookingId}/complete`, data),
    onSuccess: () => {
      toast.success('Job completed!')
      setSelectedBookingComplete(null)
      setCompleteForm({ warrantyDays: '30', notes: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to complete job'),
  })

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bidForm.quoteBdt) { toast.error('Enter a quote price'); return }
    submitBidMutation.mutate({
      reqId: selectedBidReq.id,
      data: { ...bidForm, quoteBdt: parseFloat(bidForm.quoteBdt), visitCharge: bidForm.visitCharge ? parseFloat(bidForm.visitCharge) : null },
    })
  }

  const handleTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addProgressMutation.mutate({ bookingId: selectedBookingTimeline.id, data: timelineForm })
  }

  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partForm.partName || !partForm.priceBdt) { toast.error('Part name and price required'); return }
    addPartMutation.mutate({
      bookingId: selectedBookingParts.id,
      data: { ...partForm, quantity: parseInt(partForm.quantity), priceBdt: parseFloat(partForm.priceBdt) },
    })
  }

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    completeJobMutation.mutate({
      bookingId: selectedBookingComplete.id,
      data: { warrantyDays: parseInt(completeForm.warrantyDays), notes: completeForm.notes },
    })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      <section className="bg-surface-container px-margin-mobile md:px-margin-desktop py-10 border-b border-outline-variant/20">
        <div className="mx-auto max-w-container-max">
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Repair Jobs</h1>
          <p className="text-label-md text-on-surface-variant mt-1">Browse open requests, manage active jobs, and track completions</p>
        </div>
      </section>

      <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop mt-8">
        <div className="flex border-b border-outline-variant/30 gap-6 text-label-md font-semibold uppercase tracking-wider mb-8">
          {([
            { key: 'open', label: 'Open Jobs', count: openRequests.length },
            { key: 'active', label: 'Active Jobs', count: activeBookings.length },
            { key: 'completed', label: 'Completed', count: completedBookings.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── OPEN JOBS ── */}
        {activeTab === 'open' && (
          <div className="space-y-4 animate-fadeIn">
            {openRequests.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center text-on-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">assignment</span>
                <p className="text-body-md font-bold text-on-surface">No open repair requests</p>
                <p className="text-label-sm mt-1">Check back later when clients post new jobs.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {openRequests.map((r: any) => (
                  <div key={r.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between hover:border-primary-container transition">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-body-md text-on-surface">{r.title || `Request #${r.id}`}</h4>
                          <p className="text-label-sm text-on-surface-variant">{r.deviceType}{r.brand ? ` · ${r.brand}` : ''}{r.deviceModel ? ` ${r.deviceModel}` : ''}</p>
                        </div>
                        {r.emergency ? (
                          <span className="rounded bg-red-100 text-[9px] font-bold text-red-800 px-2.5 py-0.5 uppercase animate-pulse shrink-0">Emergency</span>
                        ) : (
                          <span className="rounded bg-surface-container-high text-[9px] font-bold text-on-surface-variant px-2.5 py-0.5 uppercase shrink-0">Open</span>
                        )}
                      </div>
                      <p className="mt-4 text-body-md text-on-surface-variant leading-relaxed line-clamp-3">{r.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-label-sm text-on-surface-variant pt-2 border-t border-outline-variant/10">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span> {r.serviceLocation || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span> {r.preferredDate || 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> {r.preferredTimeSlot || 'Flexible'}
                        </span>
                        {r.urgencyLevel && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">priority_high</span> {r.urgencyLevel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                      <span className="text-label-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</span>
                      <button onClick={() => setSelectedBidReq(r)} className="rounded-xl bg-primary text-on-primary px-5 py-2.5 text-label-md font-semibold hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95">
                        Submit Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVE JOBS ── */}
        {activeTab === 'active' && (
          <div className="space-y-4 animate-fadeIn">
            {activeBookings.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center text-on-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-emerald-600 mb-3 block">check_circle</span>
                <p className="text-body-md font-bold text-on-surface">No active jobs</p>
                <p className="text-label-sm mt-1">Bid on open jobs or wait for clients to accept your quotes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((b: any) => (
                  <div key={b.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-primary-container transition">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-label-sm font-bold text-on-surface-variant tracking-wider uppercase">{b.workOrderId || `Booking #${b.id}`}</span>
                          <h4 className="font-semibold text-body-md text-on-surface mt-1">{b.request?.title || 'Repair Request'}</h4>
                        </div>
                        <select
                          value={b.status}
                          onChange={(e) => updateStatusMutation.mutate({ bookingId: b.id, status: e.target.value })}
                          className="rounded-xl border border-outline-variant px-3 py-2 text-label-sm font-semibold bg-surface-bright outline-none focus:border-primary"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="AWAITING_PARTS">AWAITING PARTS</option>
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 text-label-sm text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                          Client: <strong className="text-on-surface">{b.request?.customer?.displayName || 'N/A'}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">call</span>
                          Contact: <strong className="text-on-surface">{b.request?.contactNumber || 'N/A'}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          Scheduled: <strong className="text-on-surface">{b.scheduledDate || 'TBD'}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          Slot: <strong className="text-on-surface">{b.scheduledTimeSlot || 'Flexible'}</strong>
                        </div>
                      </div>
                      {b.request?.landmark && (
                        <p className="text-label-sm text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
                          <span className="material-symbols-outlined text-[14px] inline align-text-top">location_on</span> {b.request.serviceLocation} · {b.request.landmark}
                        </p>
                      )}
                    </div>
                    <div className="md:w-52 flex flex-col justify-between items-stretch gap-2.5 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-6">
                      <h5 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Actions</h5>
                      <button onClick={() => setSelectedBookingTimeline(b)} className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant py-2.5 text-label-sm font-semibold text-on-surface hover:bg-surface-container transition">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span> Add Progress
                      </button>
                      <button onClick={() => setSelectedBookingParts(b)} className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant py-2.5 text-label-sm font-semibold text-on-surface hover:bg-surface-container transition">
                        <span className="material-symbols-outlined text-[16px]">playlist_add</span> Add Part
                      </button>
                      <button onClick={() => setSelectedBookingComplete(b)} className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-on-primary py-2.5 text-label-sm font-semibold hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETED JOBS ── */}
        {activeTab === 'completed' && (
          <div className="space-y-4 animate-fadeIn">
            {completedBookings.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center text-on-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">history</span>
                <p className="text-body-md font-bold text-on-surface">No completed jobs yet</p>
                <p className="text-label-sm mt-1">Completed jobs will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedBookings.map((b: any) => (
                  <div key={b.id} className="rounded-2xl border border-emerald-200/60 bg-surface-container-lowest p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-label-sm font-bold text-emerald-700 tracking-wider uppercase">{b.workOrderId || `Booking #${b.id}`}</span>
                        <h4 className="font-semibold text-body-md text-on-surface mt-1">{b.request?.title || 'Repair Request'}</h4>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 uppercase">Completed</span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3 text-label-sm text-on-surface-variant">
                      <span>Client: <strong className="text-on-surface">{b.request?.customer?.displayName || 'N/A'}</strong></span>
                      <span>Device: <strong className="text-on-surface">{b.request?.deviceType || 'N/A'}</strong></span>
                      <span>Completed: <strong className="text-on-surface">{b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : 'N/A'}</strong></span>
                    </div>
                    {b.warrantyDays > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        {b.warrantyDays} Day Warranty
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BID MODAL ── */}
      {selectedBidReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form onSubmit={handleBidSubmit} className="w-full max-w-lg rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-headline-sm text-on-surface text-lg">Submit Quote</h3>
            <p className="text-label-md text-on-surface-variant">{selectedBidReq.title || `Request #${selectedBidReq.id}`}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Quote (BDT)</label>
                <input type="number" placeholder="e.g. 1500" value={bidForm.quoteBdt} onChange={e => setBidForm(p => ({ ...p, quoteBdt: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Visit Charge (BDT)</label>
                <input type="number" placeholder="e.g. 300" value={bidForm.visitCharge} onChange={e => setBidForm(p => ({ ...p, visitCharge: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Estimated Duration</label>
              <input type="text" placeholder="e.g. 2-3 hours" value={bidForm.estimatedDuration} onChange={e => setBidForm(p => ({ ...p, estimatedDuration: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Repair Plan</label>
              <textarea placeholder="Describe your repair approach..." rows={3} value={bidForm.plan} onChange={e => setBidForm(p => ({ ...p, plan: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Required Parts</label>
                <input type="text" placeholder="e.g. Screen panel needed" value={bidForm.requiredParts} onChange={e => setBidForm(p => ({ ...p, requiredParts: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Service Notes</label>
                <input type="text" placeholder="e.g. Bring device and accessories" value={bidForm.serviceNotes} onChange={e => setBidForm(p => ({ ...p, serviceNotes: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setSelectedBidReq(null)}
                className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-semibold text-on-surface hover:bg-surface-container transition">Cancel</button>
              <button type="submit" disabled={submitBidMutation.isPending}
                className="flex-1 rounded-xl bg-primary text-on-primary py-3 text-label-md font-semibold hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                {submitBidMutation.isPending ? 'Submitting...' : 'Submit Quote'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TIMELINE MODAL ── */}
      {selectedBookingTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleTimelineSubmit} className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-headline-sm text-on-surface text-lg">Add Progress Update</h3>
            <p className="text-label-md text-on-surface-variant">{selectedBookingTimeline.workOrderId || `Booking #${selectedBookingTimeline.id}`}</p>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Status Phase</label>
              <select value={timelineForm.status} onChange={e => setTimelineForm(p => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="Inspection Completed">Inspection Completed</option>
                <option value="Parts Ordered">Parts Ordered</option>
                <option value="Parts Received">Parts Received</option>
                <option value="Repair Started">Repair Started</option>
                <option value="Testing Phase">Testing Phase</option>
                <option value="Clean & Prep">Clean & Prep</option>
              </select>
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Note</label>
              <textarea placeholder="Describe what was done..." rows={3} value={timelineForm.note} onChange={e => setTimelineForm(p => ({ ...p, note: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Photo URL (optional)</label>
              <input type="text" placeholder="https://..." value={timelineForm.photoUrl} onChange={e => setTimelineForm(p => ({ ...p, photoUrl: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setSelectedBookingTimeline(null)}
                className="flex-1 rounded-xl border border-outline-variant py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition">Cancel</button>
              <button type="submit" disabled={addProgressMutation.isPending}
                className="flex-1 rounded-xl bg-primary text-on-primary py-2.5 text-label-md font-semibold hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] disabled:opacity-50">
                {addProgressMutation.isPending ? 'Saving...' : 'Add Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SPARE PART MODAL ── */}
      {selectedBookingParts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handlePartSubmit} className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-headline-sm text-on-surface text-lg">Propose Spare Part</h3>
            <p className="text-label-md text-on-surface-variant">Requires customer approval before billing.</p>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Part Name</label>
              <input type="text" placeholder="e.g. Replacement screen" value={partForm.partName} onChange={e => setPartForm(p => ({ ...p, partName: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Quantity</label>
                <input type="number" value={partForm.quantity} onChange={e => setPartForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Unit Price (BDT)</label>
                <input type="number" placeholder="e.g. 500" value={partForm.priceBdt} onChange={e => setPartForm(p => ({ ...p, priceBdt: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Reason</label>
              <textarea placeholder="Why is this part needed?" rows={2} value={partForm.reason} onChange={e => setPartForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setSelectedBookingParts(null)}
                className="flex-1 rounded-xl border border-outline-variant py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition">Cancel</button>
              <button type="submit" disabled={addPartMutation.isPending}
                className="flex-1 rounded-xl bg-primary text-on-primary py-2.5 text-label-md font-semibold hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] disabled:opacity-50">
                {addPartMutation.isPending ? 'Submitting...' : 'Request Approval'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── COMPLETE JOB MODAL ── */}
      {selectedBookingComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCompleteSubmit} className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-headline-sm text-on-surface text-lg">Complete Job</h3>
            <p className="text-label-md text-on-surface-variant">Marks the job done and registers completion details.</p>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Warranty</label>
              <select value={completeForm.warrantyDays} onChange={e => setCompleteForm(p => ({ ...p, warrantyDays: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="0">No Warranty</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">Completion Notes</label>
              <textarea placeholder="Final notes on repair..." rows={3} value={completeForm.notes} onChange={e => setCompleteForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setSelectedBookingComplete(null)}
                className="flex-1 rounded-xl border border-outline-variant py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition">Cancel</button>
              <button type="submit" disabled={completeJobMutation.isPending}
                className="flex-1 rounded-xl bg-emerald-600 text-white py-2.5 text-label-md font-semibold hover:bg-emerald-700 transition shadow-sm hover:scale-[1.02] disabled:opacity-50">
                {completeJobMutation.isPending ? 'Processing...' : 'Complete Job'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
