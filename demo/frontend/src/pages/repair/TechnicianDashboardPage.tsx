import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Wrench, DollarSign, Star, Briefcase, Clipboard, Calendar, Clock, Phone, User, CheckCircle2, ListPlus, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TechnicianDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'open_bids' | 'active_jobs' | 'earnings'>('overview')

  // Bid form state
  const [selectedBidReq, setSelectedBidReq] = useState<any | null>(null)
  const [bidForm, setBidForm] = useState({
    quoteBdt: '',
    plan: '',
    estimatedDuration: '2-3 hours',
    visitCharge: '300',
    requiredParts: '',
    serviceNotes: ''
  })

  // Timeline update state
  const [selectedBookingTimeline, setSelectedBookingTimeline] = useState<any | null>(null)
  const [timelineForm, setTimelineForm] = useState({
    status: 'Inspection Completed',
    note: '',
    photoUrl: ''
  })

  // Spare parts state
  const [selectedBookingParts, setSelectedBookingParts] = useState<any | null>(null)
  const [partForm, setPartForm] = useState({
    partName: '',
    quantity: '1',
    priceBdt: '',
    reason: ''
  })

  // Complete job state
  const [selectedBookingComplete, setSelectedBookingComplete] = useState<any | null>(null)
  const [completeForm, setCompleteForm] = useState({
    warrantyDays: '30',
    notes: ''
  })

  // 1. Fetch Technician Stats Dashboard
  const { data: stats } = useQuery<any>({
    queryKey: ['technician-dashboard'],
    queryFn: () => apiClient.get('/api/technician/dashboard').then(r => r.data),
  })

  // 2. Fetch Open requests they can bid on
  const { data: openRequests = [] } = useQuery<any[]>({
    queryKey: ['open-repair-requests'],
    queryFn: () => apiClient.get('/api/repair/requests/open').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // 3. Fetch Technician's Bookings (Active Jobs)
  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ['technician-bookings'],
    queryFn: () => apiClient.get('/api/repair/bookings/mine').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // 4. Fetch Earnings list
  const { data: earnings = [] } = useQuery<any[]>({
    queryKey: ['technician-earnings'],
    queryFn: () => apiClient.get('/api/technician/earnings').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // 5. Fetch spare parts for active bookings to display parts summaries
  // (We'll query them per booking detail inside active jobs tab or list)

  // Mutations
  const submitBidMutation = useMutation({
    mutationFn: ({ reqId, data }: { reqId: number, data: any }) => 
      apiClient.post(`/api/repair/requests/${reqId}/quotes`, data),
    onSuccess: () => {
      toast.success('Bid quote submitted successfully')
      setSelectedBidReq(null)
      setBidForm({
        quoteBdt: '',
        plan: '',
        estimatedDuration: '2-3 hours',
        visitCharge: '300',
        requiredParts: '',
        serviceNotes: ''
      })
      queryClient.invalidateQueries({ queryKey: ['open-repair-requests'] })
      queryClient.invalidateQueries({ queryKey: ['technician-dashboard'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to submit proposal')
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number, status: string }) => 
      apiClient.put(`/api/repair/bookings/${bookingId}/status`, { status }),
    onSuccess: () => {
      toast.success('Booking status updated')
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['technician-dashboard'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update status')
  })

  const addProgressMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number, data: any }) => 
      apiClient.post(`/api/repair/bookings/${bookingId}/progress`, data),
    onSuccess: () => {
      toast.success('Progress timeline entry added')
      setSelectedBookingTimeline(null)
      setTimelineForm({ status: 'Inspection Completed', note: '', photoUrl: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add progress timeline')
  })

  const addPartMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number, data: any }) => 
      apiClient.post(`/api/repair/bookings/${bookingId}/parts`, data),
    onSuccess: () => {
      toast.success('Spare part added (Awaiting customer approval)')
      setSelectedBookingParts(null)
      setPartForm({ partName: '', quantity: '1', priceBdt: '', reason: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add spare part')
  })

  const completeJobMutation = useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number, data: any }) => 
      apiClient.put(`/api/repair/bookings/${bookingId}/complete`, data),
    onSuccess: () => {
      toast.success('Job marked completed! Service completion recorded.')
      setSelectedBookingComplete(null)
      setCompleteForm({ warrantyDays: '30', notes: '' })
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['technician-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['technician-earnings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to complete job')
  })

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bidForm.quoteBdt) {
      toast.error('Please input proposal bid price')
      return
    }
    submitBidMutation.mutate({
      reqId: selectedBidReq.id,
      data: {
        ...bidForm,
        quoteBdt: parseFloat(bidForm.quoteBdt),
        visitCharge: bidForm.visitCharge ? parseFloat(bidForm.visitCharge) : null
      }
    })
  }

  const handleTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addProgressMutation.mutate({
      bookingId: selectedBookingTimeline.id,
      data: timelineForm
    })
  }

  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partForm.partName || !partForm.priceBdt) {
      toast.error('Part name and price are required')
      return
    }
    addPartMutation.mutate({
      bookingId: selectedBookingParts.id,
      data: {
        ...partForm,
        quantity: parseInt(partForm.quantity),
        priceBdt: parseFloat(partForm.priceBdt)
      }
    })
  }

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    completeJobMutation.mutate({
      bookingId: selectedBookingComplete.id,
      data: {
        warrantyDays: parseInt(completeForm.warrantyDays),
        notes: completeForm.notes
      }
    })
  }

  // Dashboard Overview fallback stats
  const displayStats = stats || {
    totalJobs: 0,
    pendingPayouts: 0,
    totalEarned: 0.0,
    level: 'VERIFIED',
    ratingAvg: 5.0,
    completionRate: 98,
    activeJobs: 0,
    incomingRequests: 0
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16] pb-20">
      {/* Upper header */}
      <section className="bg-[#f0e8df] px-6 py-8 border-b border-[#e4d6c8]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-[Fraunces] text-3xl font-bold">Technician Dashboard</h1>
            <p className="text-xs text-[#8c7564] mt-1">Manage bids, schedule active repairs, and track payouts</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-[#221b16] px-3 py-1 text-xs font-semibold text-[#f9f5f0]">
              Role: Technician ({displayStats.level})
            </span>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="mx-auto max-w-6xl px-6 mt-6">
        <div className="flex border-b border-[#e4d6c8] gap-4 text-xs font-semibold uppercase tracking-wider mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition ${activeTab === 'overview' ? 'border-[#221b16] text-[#221b16]' : 'border-transparent text-[#8c7564] hover:text-[#221b16]'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('open_bids')}
            className={`pb-3 border-b-2 transition ${activeTab === 'open_bids' ? 'border-[#221b16] text-[#221b16]' : 'border-transparent text-[#8c7564] hover:text-[#221b16]'}`}
          >
            Open Bids ({openRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('active_jobs')}
            className={`pb-3 border-b-2 transition ${activeTab === 'active_jobs' ? 'border-[#221b16] text-[#221b16]' : 'border-transparent text-[#8c7564] hover:text-[#221b16]'}`}
          >
            Active Jobs ({bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CLOSED').length})
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-3 border-b-2 transition ${activeTab === 'earnings' ? 'border-[#221b16] text-[#221b16]' : 'border-transparent text-[#8c7564] hover:text-[#221b16]'}`}
          >
            Earnings
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8c7564] uppercase tracking-wider">Paid Earnings</p>
                    <p className="text-xl font-bold mt-0.5">{displayStats.totalEarned} BDT</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8c7564] uppercase tracking-wider">Average Rating</p>
                    <p className="text-xl font-bold mt-0.5">{displayStats.ratingAvg ? displayStats.ratingAvg.toFixed(1) : '5.0'} ★</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8c7564] uppercase tracking-wider">Jobs Completed</p>
                    <p className="text-xl font-bold mt-0.5">{displayStats.totalJobs}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8c7564] uppercase tracking-wider">Active Bookings</p>
                    <p className="text-xl font-bold mt-0.5">{displayStats.activeJobs || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Summaries */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm">
                <h3 className="font-[Fraunces] text-lg font-bold mb-4">Urgent Incoming Jobs</h3>
                
                {openRequests.filter(r => r.emergency).length === 0 ? (
                  <p className="text-xs text-[#8c7564] py-4 text-center">No urgent emergency repair requests in your area right now.</p>
                ) : (
                  <div className="space-y-3">
                    {openRequests.filter(r => r.emergency).slice(0, 3).map((r: any) => (
                      <div key={r.id} className="rounded-xl border border-red-200 bg-red-50/50 p-4 flex justify-between items-center">
                        <div>
                          <span className="rounded bg-red-100 text-[9px] font-bold text-red-700 px-2 py-0.5 uppercase tracking-wider">Emergency</span>
                          <h4 className="font-semibold text-xs text-[#221b16] mt-1">{r.title || `Request #${r.id}`}</h4>
                          <p className="text-[10px] text-[#6c5b4f] mt-0.5">Device: {r.deviceType} · Location: {r.serviceLocation}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab('open_bids'); setSelectedBidReq(r); }}
                          className="rounded-lg bg-[#221b16] text-[#f9f5f0] px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3028]"
                        >
                          Bid Fast
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-[Fraunces] text-lg font-bold">Payout Details</h3>
                <div className="text-xs text-[#6c5b4f] space-y-2">
                  <div className="flex justify-between">
                    <span>Pending Payouts</span>
                    <span className="font-semibold text-[#221b16]">{displayStats.pendingPayouts} jobs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Quality Score</span>
                    <span className="font-semibold text-[#221b16]">{displayStats.completionRate}% completion</span>
                  </div>
                </div>
                <hr className="border-[#e4d6c8]" />
                <button onClick={() => setActiveTab('earnings')} className="w-full text-center block rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold hover:bg-[#f9f5f0]">
                  View Payouts Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPEN BIDS */}
        {activeTab === 'open_bids' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-[Fraunces] text-xl font-bold">Open Repair Requests ({openRequests.length})</h3>
            <p className="text-xs text-[#8c7564] -mt-4">Submit custom quotes to win repair jobs. Emergency jobs appear first.</p>

            {openRequests.length === 0 ? (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-12 text-center text-[#8c7564]">
                <Clipboard className="h-8 w-8 mx-auto text-amber-500 mb-3" />
                <p className="text-sm font-semibold">No open requests at the moment.</p>
                <p className="text-xs mt-1">Check back later when clients post new repair requests.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {openRequests.map((r: any) => (
                  <div key={r.id} className="rounded-3xl border border-[#e4d6c8] bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-[Fraunces] text-base font-bold text-[#221b16]">{r.title || `Request #${r.id}`}</h4>
                          <p className="text-[10px] text-[#8c7564]">{r.deviceType} · {r.brand} {r.deviceModel}</p>
                        </div>
                        {r.emergency ? (
                          <span className="rounded bg-red-100 text-[9px] font-bold text-red-700 px-2.5 py-0.5 uppercase tracking-wider animate-pulse">Emergency</span>
                        ) : (
                          <span className="rounded bg-blue-100 text-[9px] font-bold text-blue-700 px-2.5 py-0.5 uppercase tracking-wider">Open</span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-[#6c5b4f] leading-relaxed line-clamp-3">
                        {r.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#8c7564]">
                        <span className="flex items-center gap-1">📍 {r.serviceLocation}</span>
                        <span className="flex items-center gap-1">🗓 Pref Date: {r.preferredDate || 'Flexible'}</span>
                        <span className="flex items-center gap-1">⏱ Slot: {r.preferredTimeSlot || 'Flexible'}</span>
                        {r.landmark && <span className="flex items-center gap-1 truncate" title={r.landmark}>📌 Near: {r.landmark}</span>}
                      </div>

                      {r.media && r.media.length > 0 && (
                        <div className="mt-4 flex gap-1.5">
                          {r.media.map((m: any) => (
                            <div key={m.id} className="h-10 w-10 rounded-lg border border-[#e4d6c8] overflow-hidden bg-[#f9f5f0]">
                              <img src={m.mediaUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#e4d6c8]/60 flex items-center justify-between">
                      <span className="text-[9px] text-[#8c7564]">Posted {new Date(r.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => setSelectedBidReq(r)}
                        className="rounded-xl bg-[#221b16] text-[#f9f5f0] px-4 py-2 text-xs font-semibold hover:bg-[#3a3028]"
                      >
                        Submit Proposal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVE JOBS */}
        {activeTab === 'active_jobs' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-[Fraunces] text-xl font-bold">Active Repair Bookings</h3>
            <p className="text-xs text-[#8c7564] -mt-4">Update repair phases, propose spare parts list, and issue service warranty on completion.</p>

            {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CLOSED').length === 0 ? (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-12 text-center text-[#8c7564]">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-3" />
                <p className="text-sm font-semibold">No active jobs assigned.</p>
                <p className="text-xs mt-1">Bid on requests or wait for clients to accept your quotes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CLOSED').map((b: any) => (
                  <div key={b.id} className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    {/* Booking Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-[#8c7564] tracking-wider uppercase">{b.workOrderId}</span>
                          <h4 className="font-[Fraunces] text-lg font-bold text-[#221b16] mt-0.5">{b.request?.title || 'Repair Request'}</h4>
                        </div>
                        <select
                          value={b.status}
                          onChange={(e) => updateStatusMutation.mutate({ bookingId: b.id, status: e.target.value })}
                          className="rounded-lg border border-[#d7c7b8] px-2.5 py-1 text-xs font-semibold bg-white outline-none focus:border-[#221b16]"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="AWAITING_PARTS">AWAITING PARTS</option>
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-xs text-[#6c5b4f]">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-[#8c7564]" />
                          <span>Client: <strong className="text-[#221b16]">{b.request?.customer?.displayName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-[#8c7564]" />
                          <span>Contact: <strong className="text-[#221b16]">{b.request?.contactNumber || 'N/A'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[#8c7564]" />
                          <span>Schedule: <strong className="text-[#221b16]">{b.scheduledDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-[#8c7564]" />
                          <span>Slot: <strong className="text-[#221b16]">{b.scheduledTimeSlot || 'Flexible'}</strong></span>
                        </div>
                      </div>

                      {b.request?.landmark && (
                        <p className="text-xs text-[#6c5b4f] bg-[#f9f5f0] p-2.5 rounded-lg border border-[#e4d6c8]/60">
                          📍 <strong>Location Detail:</strong> {b.request.serviceLocation} · Landmark: {b.request.landmark}
                        </p>
                      )}
                    </div>

                    {/* Booking Actions Sidebar */}
                    <div className="md:w-56 flex flex-col justify-between items-stretch gap-2 border-t md:border-t-0 md:border-l border-[#e4d6c8]/60 pt-4 md:pt-0 md:pl-6">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Job Actions</h5>
                      
                      <button
                        onClick={() => setSelectedBookingTimeline(b)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d7c7b8] py-2 text-xs font-semibold hover:bg-[#f9f5f0]"
                      >
                        <Edit className="h-3.5 w-3.5" /> Progress Timeline
                      </button>

                      <button
                        onClick={() => setSelectedBookingParts(b)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[#d7c7b8] py-2 text-xs font-semibold hover:bg-[#f9f5f0]"
                      >
                        <ListPlus className="h-3.5 w-3.5" /> Propose Spare Part
                      </button>

                      <button
                        onClick={() => setSelectedBookingComplete(b)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-[#221b16] text-[#f9f5f0] py-2 text-xs font-semibold hover:bg-[#3a3028]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete & Warranty
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EARNINGS */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-[Fraunces] text-xl font-bold">Earnings & Payout Ledger</h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1">
                Escrow Guarantee Activated
              </span>
            </div>

            {earnings.length === 0 ? (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-12 text-center text-[#8c7564]">
                <DollarSign className="h-8 w-8 mx-auto text-emerald-500 mb-3" />
                <p className="text-sm font-semibold">No earnings transactions recorded yet.</p>
                <p className="text-xs mt-1">Complete your active bookings to see earnings posted.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f0e8df] border-b border-[#e4d6c8] text-[#8c7564] font-bold">
                      <th className="p-4">Transaction Date</th>
                      <th className="p-4">Reference Job</th>
                      <th className="p-4">Gross Charge</th>
                      <th className="p-4">Commission</th>
                      <th className="p-4">Net Earned</th>
                      <th className="p-4">Payout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4d6c8]/60 text-[#6c5b4f]">
                    {earnings.map((e: any) => (
                      <tr key={e.id} className="hover:bg-[#f9f5f0]/40 transition">
                        <td className="p-4 font-medium">{new Date(e.createdAt || Date.now()).toLocaleDateString()}</td>
                        <td className="p-4 font-semibold text-[#221b16]">Repair Job Ref</td>
                        <td className="p-4">{e.totalAmountBdt} BDT</td>
                        <td className="p-4">{e.commissionAmountBdt} BDT</td>
                        <td className="p-4 font-bold text-[#221b16]">{e.netAmountBdt} BDT</td>
                        <td className="p-4">
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            e.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Bid Submission Modal */}
      {selectedBidReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleBidSubmit} className="w-full max-w-lg rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-xl space-y-4">
            <h3 className="font-[Fraunces] text-xl font-bold">Submit Repair Proposal</h3>
            <p className="text-xs text-[#8c7564]">Proposing quote for: {selectedBidReq.title}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Proposal Price (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={bidForm.quoteBdt}
                  onChange={(e) => setFormValue('quoteBdt', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Diagnose Charge (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 300"
                  value={bidForm.visitCharge}
                  onChange={(e) => setFormValue('visitCharge', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Estimated Duration</label>
              <input
                type="text"
                placeholder="e.g. 2-3 hours"
                value={bidForm.estimatedDuration}
                onChange={(e) => setFormValue('estimatedDuration', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Proposed Repair Plan</label>
              <textarea
                placeholder="Describe diagnostic steps & solution plan..."
                rows={3}
                value={bidForm.plan}
                onChange={(e) => setFormValue('plan', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Required Spare Parts Note</label>
                <input
                  type="text"
                  placeholder="e.g. Screen panel may be needed"
                  value={bidForm.requiredParts}
                  onChange={(e) => setFormValue('requiredParts', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Service Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bring box & warranty card"
                  value={bidForm.serviceNotes}
                  onChange={(e) => setFormValue('serviceNotes', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBidReq(null)}
                className="flex-1 rounded-xl border border-[#d7c7b8] py-2.5 text-xs font-semibold text-[#221b16]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitBidMutation.isPending}
                className="flex-1 rounded-xl bg-[#221b16] text-[#f9f5f0] py-2.5 text-xs font-semibold hover:bg-[#3a3028] disabled:opacity-50"
              >
                {submitBidMutation.isPending ? 'Submitting...' : 'Submit Quote'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Timeline Update Modal */}
      {selectedBookingTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleTimelineSubmit} className="w-full max-w-md rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-[Fraunces] text-lg font-bold">Add Timeline Update</h3>
            <p className="text-xs text-[#8c7564]">Booking: {selectedBookingTimeline.workOrderId}</p>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Repair Phase Status</label>
              <select
                value={timelineForm.status}
                onChange={(e) => setTimelineFormValue('status', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              >
                <option value="Inspection Completed">Inspection Completed</option>
                <option value="Parts Ordered">Parts Ordered</option>
                <option value="Parts Received">Parts Received</option>
                <option value="Repair Started">Repair Started</option>
                <option value="Testing Phase">Testing Phase</option>
                <option value="Clean & Prep">Clean & Prep</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Detailed Note</label>
              <textarea
                placeholder="Diagnostic findings or updates..."
                rows={3}
                value={timelineForm.note}
                onChange={(e) => setTimelineFormValue('note', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Photo Reference URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. image link"
                value={timelineForm.photoUrl}
                onChange={(e) => setTimelineFormValue('photoUrl', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingTimeline(null)}
                className="flex-1 rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addProgressMutation.isPending}
                className="flex-1 rounded-xl bg-[#221b16] text-[#f9f5f0] py-2 text-xs font-semibold hover:bg-[#3a3028] disabled:opacity-50"
              >
                {addProgressMutation.isPending ? 'Saving...' : 'Add Timeline Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Propose Spare Part Modal */}
      {selectedBookingParts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handlePartSubmit} className="w-full max-w-md rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-[Fraunces] text-lg font-bold">Propose Spare Part</h3>
            <p className="text-xs text-[#8c7564]">Requires customer approval before final payment billing release.</p>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Part Name</label>
              <input
                type="text"
                placeholder="e.g. Replacement capacitor"
                value={partForm.partName}
                onChange={(e) => setPartFormValue('partName', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Quantity</label>
                <input
                  type="number"
                  value={partForm.quantity}
                  onChange={(e) => setPartFormValue('quantity', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] mb-1">Unit Price (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={partForm.priceBdt}
                  onChange={(e) => setPartFormValue('priceBdt', e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Replacement Reason</label>
              <textarea
                placeholder="Explain why this part is necessary..."
                rows={2}
                value={partForm.reason}
                onChange={(e) => setPartFormValue('reason', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingParts(null)}
                className="flex-1 rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addPartMutation.isPending}
                className="flex-1 rounded-xl bg-[#221b16] text-[#f9f5f0] py-2 text-xs font-semibold hover:bg-[#3a3028] disabled:opacity-50"
              >
                {addPartMutation.isPending ? 'Submitting...' : 'Request Part Approval'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Complete Booking & Warranty Modal */}
      {selectedBookingComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCompleteSubmit} className="w-full max-w-md rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-[Fraunces] text-lg font-bold">Complete Repair Job</h3>
            <p className="text-xs text-[#8c7564]">This marks the job done, updates request to completed and registers completion notes.</p>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Service Warranty Coverage</label>
              <select
                value={completeForm.warrantyDays}
                onChange={(e) => setCompleteFormValue('warrantyDays', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              >
                <option value="0">No Warranty</option>
                <option value="7">7 Days Warranty</option>
                <option value="30">30 Days Warranty</option>
                <option value="90">90 Days Warranty</option>
                <option value="180">180 Days Warranty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8c7564] mb-1">Completion Notes</label>
              <textarea
                placeholder="Describe final actions done, repair notes..."
                rows={3}
                value={completeForm.notes}
                onChange={(e) => setCompleteFormValue('notes', e.target.value)}
                className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingComplete(null)}
                className="flex-1 rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completeJobMutation.isPending}
                className="flex-1 rounded-xl bg-emerald-600 text-white py-2 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {completeJobMutation.isPending ? 'Processing...' : 'Mark Job Completed'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )

  // Helpers
  function setFormValue(key: keyof typeof bidForm, val: string) {
    setBidForm(prev => ({ ...prev, [key]: val }))
  }
  function setTimelineFormValue(key: keyof typeof timelineForm, val: string) {
    setTimelineForm(prev => ({ ...prev, [key]: val }))
  }
  function setPartFormValue(key: keyof typeof partForm, val: string) {
    setPartForm(prev => ({ ...prev, [key]: val }))
  }
  function setCompleteFormValue(key: keyof typeof completeForm, val: string) {
    setCompleteForm(prev => ({ ...prev, [key]: val }))
  }
}
