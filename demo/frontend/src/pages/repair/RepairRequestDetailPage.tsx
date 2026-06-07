import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Check, X, Star, Calendar, Clock, MapPin, Phone, ShieldAlert, Award, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageLightbox from '../../components/ImageLightbox'

export default function RepairRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  
  // Booking scheduling modal state
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState('09:00 AM - 12:00 PM')

  // Review state
  const [reviewForm, setReviewForm] = useState({
    workQuality: 5,
    professionalism: 5,
    communication: 5,
    timeliness: 5,
    pricingFairness: 5,
    comment: ''
  })
  const [showReviewForm, setShowReviewForm] = useState(false)

  // 1. Fetch Request Details
  const { data: request, isLoading: requestLoading, error } = useQuery<any>({
    queryKey: ['repair-request', id],
    queryFn: () => apiClient.get(`/api/repair/requests/${id}`).then(r => r.data),
  })

  // 2. Fetch Quotes
  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ['repair-quotes', id],
    queryFn: () => apiClient.get(`/api/repair/requests/${id}/quotes`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!request,
  })

  // 3. Fetch Bookings to find the one associated with this request
  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ['customer-bookings'],
    queryFn: () => apiClient.get('/api/repair/bookings/customer').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!request,
  })

  const booking = bookings.find(b => b.request?.id === parseInt(id || ''))

  // 4. Fetch Progress Timeline (enabled only if booking exists)
  const { data: progressList = [] } = useQuery<any[]>({
    queryKey: ['booking-progress', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/progress`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!booking,
  })

  // 5. Fetch Spare Parts
  const { data: spareParts = [] } = useQuery<any[]>({
    queryKey: ['booking-parts', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/parts`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!booking,
  })

  // 6. Fetch Review
  const { data: bookingReview } = useQuery<any>({
    queryKey: ['booking-review', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/review`).then(r => r.status === 200 ? r.data : null),
    enabled: !!booking,
    retry: false,
  })

  // Mutations
  const cancelRequestMutation = useMutation({
    mutationFn: () => apiClient.put(`/api/repair/requests/${id}/cancel`),
    onSuccess: () => {
      toast.success('Request cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['repair-request', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to cancel request')
  })

  const acceptQuoteMutation = useMutation({
    mutationFn: ({ quoteId, scheduledDate, scheduledTimeSlot }: { quoteId: number, scheduledDate: string, scheduledTimeSlot: string }) => 
      apiClient.put(`/api/repair/quotes/${quoteId}/accept`, { scheduledDate, scheduledTimeSlot }),
    onSuccess: () => {
      toast.success('Quote accepted! Booking created.')
      setSelectedQuote(null)
      queryClient.invalidateQueries({ queryKey: ['repair-request', id] })
      queryClient.invalidateQueries({ queryKey: ['repair-quotes', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to accept quote')
  })

  const rejectQuoteMutation = useMutation({
    mutationFn: (quoteId: number) => apiClient.put(`/api/repair/quotes/${quoteId}/reject`),
    onSuccess: () => {
      toast.success('Quote rejected')
      queryClient.invalidateQueries({ queryKey: ['repair-quotes', id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to reject quote')
  })

  const approvePartMutation = useMutation({
    mutationFn: (partId: number) => apiClient.put(`/api/repair/parts/${partId}/approve`),
    onSuccess: () => {
      toast.success('Spare part approved')
      queryClient.invalidateQueries({ queryKey: ['booking-parts', booking?.id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to approve part')
  })

  const submitReviewMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/api/repair/bookings/${booking.id}/review`, data),
    onSuccess: () => {
      toast.success('Review submitted successfully')
      setShowReviewForm(false)
      queryClient.invalidateQueries({ queryKey: ['booking-review', booking?.id] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to submit review')
  })

  if (requestLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0]">
        <div className="text-[#8c7564] text-center">Loading request details...</div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0]">
        <div className="text-center">
          <p className="text-[#8c7564]">Request not found.</p>
          <Link to="/repair/requests" className="mt-4 inline-block text-sm font-semibold text-[#221b16] underline">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  const handleAcceptQuoteClick = (quote: any) => {
    setSelectedQuote(quote)
    // Default schedule date to preferred date or tomorrow
    const defaultDate = request.preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
    setScheduleDate(defaultDate)
    setScheduleTimeSlot(request.preferredTimeSlot || '09:00 AM - 12:00 PM')
  }

  const handleConfirmBooking = () => {
    if (!scheduleDate) {
      toast.error('Please select a schedule date')
      return
    }
    acceptQuoteMutation.mutate({
      quoteId: selectedQuote.id,
      scheduledDate: scheduleDate,
      scheduledTimeSlot: scheduleTimeSlot
    })
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitReviewMutation.mutate(reviewForm)
  }

  const renderStarsSelector = (dimension: keyof typeof reviewForm, label: string) => {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-[#6c5b4f]">{label}</span>
        <div className="flex gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setReviewForm({ ...reviewForm, [dimension]: idx + 1 })}
              className="focus:outline-none"
            >
              <Star className={`h-5 w-5 ${idx < (reviewForm[dimension] as number) ? 'fill-current' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Calculate total spares cost
  const approvedSpares = spareParts.filter(p => p.approvedByCustomer)
  const totalSparesCost = approvedSpares.reduce((sum, p) => sum + (p.priceBdt * p.quantity), 0)

  // Status steps helper
  const steps = ['OPEN', 'QUOTED', 'BOOKED', 'COMPLETED']
  const currentStepIdx = steps.indexOf(request.status)

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-blue-100 text-blue-700'
      case 'QUOTED': return 'bg-amber-100 text-amber-700 font-medium'
      case 'BOOKED': return 'bg-indigo-100 text-indigo-700 font-medium'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 font-medium'
      case 'CANCELLED': return 'bg-red-100 text-red-700 font-medium'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16] pb-20">
      {/* Top Banner Breadcrumbs */}
      <div className="mx-auto max-w-5xl px-6 pt-8 flex items-center justify-between">
        <Link to="/repair/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c5b4f] hover:text-[#221b16] transition">
          <ArrowLeft className="h-4 w-4" /> Back to My Repairs
        </Link>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor(request.status)}`}>
          {request.status}
        </span>
      </div>

      <div className="mx-auto max-w-5xl px-6 mt-6">
        {/* Step Progress Tracker */}
        {request.status !== 'CANCELLED' && (
          <div className="mb-8 rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx <= currentStepIdx 
                        ? 'bg-[#221b16] text-[#f9f5f0]' 
                        : 'bg-[#f9f5f0] border border-[#d7c7b8] text-[#8c7564]'
                    }`}>
                      {idx < currentStepIdx ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className="mt-2 text-[10px] font-semibold tracking-wider text-[#6c5b4f]">{s}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      idx < currentStepIdx ? 'bg-[#221b16]' : 'bg-[#e4d6c8]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Side: Request Info, Media, Bids */}
          <div className="md:col-span-2 space-y-6">
            {/* Request Info Card */}
            <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
              <h2 className="font-[Fraunces] text-2xl font-bold">{request.title || `Repair Request #${request.id}`}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8c7564]">
                <span className="font-semibold">{request.deviceType}</span>
                <span>·</span>
                <span>{request.brand} {request.deviceModel}</span>
                <span>·</span>
                <span className="rounded bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5">{request.category?.name}</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs text-[#6c5b4f]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#8c7564]" />
                  <span>Location: <strong className="text-[#221b16]">{request.serviceLocation}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#8c7564]" />
                  <span>Preferred Date: <strong className="text-[#221b16]">{request.preferredDate || 'Flexible'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#8c7564]" />
                  <span>Time Slot: <strong className="text-[#221b16]">{request.preferredTimeSlot || 'Flexible'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#8c7564]" />
                  <span>Contact: <strong className="text-[#221b16]">{request.contactNumber || 'N/A'}</strong></span>
                </div>
              </div>

              {request.landmark && (
                <p className="mt-3 text-xs text-[#6c5b4f]">
                  📍 <strong>Landmark:</strong> {request.landmark}
                </p>
              )}

              {request.emergency && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">
                  <ShieldAlert className="h-4 w-4 animate-bounce" />
                  EMERGENCY PRIORITY HANDLING REQUESTED
                </div>
              )}

              <hr className="my-6 border-[#e4d6c8]" />

              <div>
                <h4 className="font-semibold text-xs text-[#8c7564] uppercase tracking-wider">Problem Description</h4>
                <p className="mt-2 text-sm text-[#221b16] leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {request.media && request.media.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-xs text-[#8c7564] uppercase tracking-wider mb-3">Uploaded Photos/Videos</h4>
                  <div className="flex flex-wrap gap-2">
                    {request.media.map((m: any, idx: number) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLightbox({
                          images: request.media.map((mm: any) => ({ url: mm.mediaUrl })),
                          index: idx
                        })}
                        className="h-20 w-20 overflow-hidden rounded-xl border border-[#e4d6c8] bg-[#f9f5f0]"
                      >
                        {m.mediaUrl.endsWith('.mp4') || m.mediaUrl.endsWith('.webm') ? (
                          <video src={m.mediaUrl} className="h-full w-full object-cover" />
                        ) : (
                          <img src={m.mediaUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(request.status === 'OPEN' || request.status === 'QUOTED') && (
                <div className="mt-8 pt-6 border-t border-[#e4d6c8] flex justify-end">
                  <button
                    onClick={() => { if(confirm('Are you sure you want to cancel this request?')) cancelRequestMutation.mutate() }}
                    disabled={cancelRequestMutation.isPending}
                    className="rounded-xl border border-red-200 px-5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>

            {/* Bids / Quotes comparison list */}
            {(request.status === 'OPEN' || request.status === 'QUOTED') && (
              <div className="space-y-4">
                <h3 className="font-[Fraunces] text-xl font-bold">Technician Proposals ({quotes.length})</h3>
                
                {quotes.length === 0 ? (
                  <div className="rounded-3xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
                    <Sparkles className="h-8 w-8 mx-auto text-amber-500 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-[#221b16]">Waiting for proposals...</p>
                    <p className="mt-1 text-xs">Craftsmen in your area are reviewng your request.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quotes.map((q: any) => (
                      <div key={q.id} className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#221b16] text-[#f9f5f0] text-sm font-bold">
                              {q.technician?.user?.displayName?.[0] || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link to={`/repair/technicians/${q.technician?.id}`} className="font-semibold text-sm hover:underline text-[#221b16]">
                                  {q.technician?.user?.displayName}
                                </Link>
                                <span className="rounded bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 text-[9px] font-bold text-[#6c5b4f]">
                                  {q.technician?.level}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#8c7564]">★ {q.technician?.ratingAvg ? q.technician.ratingAvg.toFixed(1) : '5.0'} ({q.technician?.completedJobs || 0} repairs)</p>
                            </div>
                          </div>

                          <div className="text-xs text-[#6c5b4f] space-y-1">
                            <p>🔧 <strong>Proposed Plan:</strong> {q.plan || 'Diagnostic & Repair'}</p>
                            {q.serviceNotes && <p>📝 <strong>Notes:</strong> {q.serviceNotes}</p>}
                            {q.requiredParts && <p>📦 <strong>Estimated Parts:</strong> {q.requiredParts}</p>}
                          </div>
                        </div>

                        <div className="md:w-48 flex flex-col justify-between items-end gap-4 border-t md:border-t-0 md:border-l border-[#e4d6c8]/60 pt-4 md:pt-0 md:pl-6">
                          <div className="text-right">
                            <p className="text-xs text-[#8c7564]">Total Proposal</p>
                            <p className="font-[Fraunces] text-xl font-bold text-[#221b16]">{q.quoteBdt} BDT</p>
                            {q.visitCharge && (
                              <p className="text-[10px] text-[#8c7564]">Inc. {q.visitCharge} BDT visit charge</p>
                            )}
                            {q.estimatedDuration && (
                              <p className="text-[10px] text-emerald-600 font-semibold mt-1">⏱ {q.estimatedDuration}</p>
                            )}
                          </div>

                          <div className="flex gap-2 w-full justify-end">
                            <button
                              onClick={() => { if(confirm('Reject this proposal?')) rejectQuoteMutation.mutate(q.id) }}
                              className="rounded-xl border border-[#d7c7b8] p-2 text-[#6c5b4f] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                              title="Reject proposal"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAcceptQuoteClick(q)}
                              className="flex-1 rounded-xl bg-[#221b16] py-2 px-3 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition text-center"
                            >
                              Accept & Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Spare Parts (Appears when booked/in-progress) */}
            {booking && spareParts.length > 0 && (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
                <h3 className="font-[Fraunces] text-lg font-bold mb-4">Required Spare Parts</h3>
                <p className="text-xs text-[#8c7564] mb-4">Technician has requested the following parts for your repair. Approving releases billing for these parts on final invoice.</p>

                <div className="divide-y divide-[#e4d6c8]/60">
                  {spareParts.map((p: any) => (
                    <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">{p.partName} <span className="text-xs text-[#8c7564]">(Qty: {p.quantity})</span></h4>
                        {p.reason && <p className="text-xs text-[#6c5b4f] mt-1">Reason: {p.reason}</p>}
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <p className="font-semibold text-sm">{p.priceBdt * p.quantity} BDT</p>
                        {p.approvedByCustomer ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-2 py-1 text-xs font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => approvePartMutation.mutate(p.id)}
                            disabled={approvePartMutation.isPending}
                            className="rounded-lg bg-[#221b16] px-3 py-1.5 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028]"
                          >
                            {approvePartMutation.isPending ? 'Approving...' : 'Approve Part'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Booking, Timeline, Warranty, Reviews */}
          <div className="space-y-6">
            {booking ? (
              <>
                {/* Active Booking Card */}
                <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8c7564] tracking-wider uppercase">Active Job Detail</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{booking.status}</span>
                  </div>

                  <div>
                    <h3 className="font-[Fraunces] text-lg font-bold text-[#221b16]">{booking.workOrderId}</h3>
                    <p className="text-xs text-[#8c7564]">Technician Escrow Hold Order</p>
                  </div>

                  <div className="border-t border-[#f9f5f0] pt-3 text-xs text-[#6c5b4f] space-y-2">
                    <div className="flex justify-between">
                      <span>Scheduled Date</span>
                      <strong className="text-[#221b16]">{booking.scheduledDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheduled Slot</span>
                      <strong className="text-[#221b16]">{booking.scheduledTimeSlot || 'Flexible'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Parts</span>
                      <strong className="text-[#221b16]">{totalSparesCost} BDT</strong>
                    </div>
                  </div>

                  <hr className="border-[#e4d6c8]" />

                  {/* Technician Card */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#221b16] text-[#f9f5f0] text-xs font-bold">
                      {booking.technician?.user?.displayName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#221b16]">{booking.technician?.user?.displayName}</p>
                      <p className="text-[10px] text-[#8c7564]">{booking.technician?.specialization}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm">
                  <h3 className="font-[Fraunces] text-sm font-bold text-[#8c7564] uppercase tracking-wider mb-4">Progress Timeline</h3>
                  
                  {progressList.length === 0 ? (
                    <p className="text-xs text-[#8c7564]">No timeline entries logged yet.</p>
                  ) : (
                    <div className="relative border-l border-[#e4d6c8] pl-4 space-y-6">
                      {progressList.map((p: any) => (
                        <div key={p.id} className="relative">
                          {/* Bullet */}
                          <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#221b16]" />
                          
                          <div className="text-xs">
                            <span className="font-bold text-[#221b16]">{p.status}</span>
                            <span className="text-[9px] text-[#8c7564] block">{new Date(p.createdAt).toLocaleString()}</span>
                            {p.note && <p className="mt-1 text-[#6c5b4f]">{p.note}</p>}
                            {p.photoUrl && (
                              <button
                                onClick={() => setLightbox({ images: [{ url: p.photoUrl }], index: 0 })}
                                className="mt-2 h-12 w-20 overflow-hidden rounded border border-[#e4d6c8]"
                              >
                                <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warranty Info (If completed) */}
                {(booking.status === 'COMPLETED' || booking.status === 'CLOSED') && booking.warrantyDays > 0 && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm flex items-start gap-3">
                    <Award className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-xs text-emerald-950 uppercase tracking-wider">Service Warranty Active</h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        This repair has a {booking.warrantyDays}-day warranty active. Expires on {new Date(booking.warrantyExpiresAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Panel */}
                {(booking.status === 'COMPLETED' || booking.status === 'CLOSED') && (
                  <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm">
                    <h3 className="font-[Fraunces] text-base font-bold mb-3">Service Review</h3>
                    
                    {bookingReview ? (
                      <div className="space-y-3">
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const avg = (bookingReview.workQuality + bookingReview.professionalism + bookingReview.communication + bookingReview.timeliness + bookingReview.pricingFairness) / 5.0
                            return <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? 'fill-current' : 'text-gray-300'}`} />
                          })}
                        </div>
                        {bookingReview.comment && (
                          <p className="text-xs text-[#6c5b4f] italic">"{bookingReview.comment}"</p>
                        )}
                        <span className="text-[10px] text-emerald-600 font-semibold block">✓ Feedback recorded</span>
                      </div>
                    ) : showReviewForm ? (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        {renderStarsSelector('workQuality', 'Work Quality')}
                        {renderStarsSelector('professionalism', 'Professionalism')}
                        {renderStarsSelector('communication', 'Communication')}
                        {renderStarsSelector('timeliness', 'Timeliness')}
                        {renderStarsSelector('pricingFairness', 'Pricing Fairness')}
                        
                        <div>
                          <textarea
                            placeholder="Add your comments here..."
                            rows={3}
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            className="w-full rounded-xl border border-[#d7c7b8] px-3 py-2 text-xs outline-none focus:border-[#221b16]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitReviewMutation.isPending}
                          className="w-full rounded-xl bg-[#221b16] py-2 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028]"
                        >
                          {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full rounded-xl border border-[#d7c7b8] py-2 text-xs font-semibold text-[#221b16] hover:bg-[#f9f5f0]"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm text-center text-[#8c7564]">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <h4 className="font-semibold text-xs text-[#221b16] uppercase tracking-wider">No Booking Yet</h4>
                <p className="text-xs mt-1">Accept a proposal quote to schedule your technician and lock in your service slot.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Schedule Confirmation Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-xl">
            <h3 className="font-[Fraunces] text-xl font-bold">Accept Quote & Schedule</h3>
            <p className="text-xs text-[#8c7564] mt-1">You are booking {selectedQuote.technician?.user?.displayName} for {selectedQuote.quoteBdt} BDT.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Schedule Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Preferred Time Slot</label>
                <select
                  value={scheduleTimeSlot}
                  onChange={(e) => setScheduleTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                >
                  <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="12:00 PM - 03:00 PM">Midday (12:00 PM - 03:00 PM)</option>
                  <option value="03:00 PM - 06:00 PM">Afternoon (03:00 PM - 06:00 PM)</option>
                  <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setSelectedQuote(null)}
                className="flex-1 rounded-xl border border-[#d7c7b8] py-3 text-xs font-semibold text-[#221b16] hover:bg-[#f9f5f0]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={acceptQuoteMutation.isPending}
                className="flex-1 rounded-xl bg-[#221b16] py-3 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028] disabled:opacity-50"
              >
                {acceptQuoteMutation.isPending ? 'Booking...' : 'Confirm Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
