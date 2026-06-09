/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'
import ImageLightbox from '../../components/ImageLightbox'

export default function RepairRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<{ images: { url: string }[]; index: number } | null>(null)
  
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState('09:00 AM - 12:00 PM')

  const [reviewForm, setReviewForm] = useState({
    workQuality: 5,
    professionalism: 5,
    communication: 5,
    timeliness: 5,
    pricingFairness: 5,
    comment: ''
  })
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { data: request, isLoading: requestLoading, error } = useQuery<any>({
    queryKey: ['repair-request', id],
    queryFn: () => apiClient.get(`/api/repair/requests/${id}`).then(r => r.data),
  })

  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ['repair-quotes', id],
    queryFn: () => apiClient.get(`/api/repair/requests/${id}/quotes`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!request,
  })

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ['customer-bookings'],
    queryFn: () => apiClient.get('/api/repair/bookings/customer').then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!request,
  })

  const booking = bookings.find(b => b.request?.id === parseInt(id || ''))

  const { data: progressList = [] } = useQuery<any[]>({
    queryKey: ['booking-progress', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/progress`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!booking,
  })

  const { data: spareParts = [] } = useQuery<any[]>({
    queryKey: ['booking-parts', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/parts`).then(r => Array.isArray(r.data) ? r.data : []),
    enabled: !!booking,
  })

  const { data: bookingReview } = useQuery<any>({
    queryKey: ['booking-review', booking?.id],
    queryFn: () => apiClient.get(`/api/repair/bookings/${booking.id}/review`).then(r => r.status === 200 ? r.data : null),
    enabled: !!booking,
    retry: false,
  })

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-on-surface-variant text-center flex flex-col items-center gap-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <span>Loading request details...</span>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center py-12 px-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm">
          <p className="text-on-surface-variant">Request not found.</p>
          <Link to="/repair/requests" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  const handleAcceptQuoteClick = (quote: any) => {
    setSelectedQuote(quote)
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
        <span className="text-label-sm text-on-surface-variant">{label}</span>
        <div className="flex gap-1 text-tertiary">
          {Array.from({ length: 5 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setReviewForm({ ...reviewForm, [dimension]: idx + 1 })}
              className="focus:outline-none"
            >
              <span className={`material-symbols-outlined text-[20px] ${idx < (reviewForm[dimension] as number) ? 'icon-fill' : 'text-outline-variant/50'}`}>star</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const approvedSpares = spareParts.filter(p => p.approvedByCustomer)
  const totalSparesCost = approvedSpares.reduce((sum, p) => sum + (p.priceBdt * p.quantity), 0)

  const steps = ['OPEN', 'QUOTED', 'BOOKED', 'COMPLETED']
  const currentStepIdx = steps.indexOf(request.status)

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-[#f9f5f0] text-[#6c5b4f]'
      case 'QUOTED': return 'bg-amber-100 text-amber-800'
      case 'BOOKED': return 'bg-[#f0e8df] text-[#5c4e42]'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-surface-container-low text-on-surface-variant'
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20 px-4 md:px-8 py-8">
      <div className="mx-auto max-w-5xl flex items-center justify-between">
        <Link to="/repair/requests" className="inline-flex items-center gap-1.5 text-label-md font-semibold text-on-surface-variant hover:text-primary transition">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to My Repairs
        </Link>
        <span className={`rounded-full px-3 py-1 text-label-sm font-semibold uppercase tracking-wider ${statusColor(request.status)}`}>
          {request.status}
        </span>
      </div>

      <div className="mx-auto max-w-5xl mt-8">
        {request.status !== 'CANCELLED' && (
          <div className="mb-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-label-sm font-bold ${
                      idx <= currentStepIdx 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface-container-low border border-outline-variant text-on-surface-variant'
                    }`}>
                      {idx < currentStepIdx ? <span className="material-symbols-outlined text-[16px]">check</span> : idx + 1}
                    </div>
                    <span className="mt-2 text-label-sm font-semibold tracking-wider text-on-surface-variant">{s}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      idx < currentStepIdx ? 'bg-primary' : 'bg-outline-variant/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
              <h2 className="text-headline-sm font-bold text-on-surface">{request.title || `Repair Request #${request.id}`}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
                <span className="font-semibold">{request.deviceType}</span>
                <span>·</span>
                <span>{request.brand} {request.deviceModel}</span>
                <span>·</span>
                <span className="rounded bg-surface-container-low border border-outline-variant/10 px-2 py-0.5">{request.category?.name}</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                  <span>Location: <strong className="text-on-surface">{request.serviceLocation}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>Preferred Date: <strong className="text-on-surface">{request.preferredDate || 'Flexible'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>Time Slot: <strong className="text-on-surface">{request.preferredTimeSlot || 'Flexible'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>Contact: <strong className="text-on-surface">{request.contactNumber || 'N/A'}</strong></span>
                </div>
              </div>

              {request.landmark && (
                <p className="mt-4 text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <strong>Landmark:</strong> {request.landmark}
                </p>
              )}

              {request.emergency && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-label-sm font-semibold text-red-700">
                  <span className="material-symbols-outlined text-[18px] text-red-700 animate-pulse">warning</span>
                  EMERGENCY PRIORITY HANDLING REQUESTED
                </div>
              )}

              <hr className="my-6 border-outline-variant/20" />

              <div>
                <h4 className="font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider">Problem Description</h4>
                <p className="mt-2 text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {request.media && request.media.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Uploaded Photos/Videos</h4>
                  <div className="flex flex-wrap gap-2">
                    {request.media.map((m: any, idx: number) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLightbox({
                          images: request.media.map((mm: any) => ({ url: mm.mediaUrl })),
                          index: idx
                        })}
                        className="h-20 w-20 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm"
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
                <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-end">
                  <button
                    onClick={() => { if(confirm('Are you sure you want to cancel this request?')) cancelRequestMutation.mutate() }}
                    disabled={cancelRequestMutation.isPending}
                    className="rounded-xl border border-red-200 px-5 py-2.5 text-label-md font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>

            {(request.status === 'OPEN' || request.status === 'QUOTED') && (
              <div className="space-y-4">
                <h3 className="text-headline-sm font-bold text-on-surface text-base">Technician Proposals ({quotes.length})</h3>
                
                {quotes.length === 0 ? (
                  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center text-on-surface-variant shadow-sm">
                    <span className="material-symbols-outlined text-[32px] text-amber-500 animate-pulse mb-3 block">auto_awesome</span>
                    <p className="text-body-md font-bold text-on-surface">Waiting for proposals...</p>
                    <p className="mt-1 text-label-sm">Craftsmen in your area are reviewing your request.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quotes.map((q: any) => (
                      <div key={q.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-primary-container transition duration-300">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">
                              {q.technician?.user?.displayName?.[0] || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link to={`/repair/technicians/${q.technician?.id}`} className="font-semibold text-body-md hover:underline text-on-surface">
                                  {q.technician?.user?.displayName}
                                </Link>
                                <span className="rounded bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 text-label-sm font-bold text-on-surface-variant">
                                  {q.technician?.level}
                                </span>
                              </div>
                              <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[14px] text-tertiary icon-fill">star</span>
                                {q.technician?.ratingAvg ? q.technician.ratingAvg.toFixed(1) : '5.0'} ({q.technician?.completedJobs || 0} repairs)
                              </p>
                            </div>
                          </div>

                          <div className="text-label-md text-on-surface-variant space-y-2">
                            <p><strong>Proposed Plan:</strong> {q.plan || 'Diagnostic & Repair'}</p>
                            {q.serviceNotes && <p><strong>Notes:</strong> {q.serviceNotes}</p>}
                            {q.requiredParts && <p><strong>Estimated Parts:</strong> {q.requiredParts}</p>}
                          </div>
                        </div>

                        <div className="md:w-48 flex flex-col justify-between items-end gap-4 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-6">
                          <div className="text-right">
                            <p className="text-label-sm text-on-surface-variant">Total Proposal</p>
                            <p className="font-headline-sm text-headline-sm font-bold text-primary">{q.quoteBdt} BDT</p>
                            {q.visitCharge && (
                              <p className="text-label-sm text-on-surface-variant">Inc. {q.visitCharge} BDT visit charge</p>
                            )}
                            {q.estimatedDuration && (
                              <p className="text-label-sm text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span> {q.estimatedDuration}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 w-full justify-end">
                            <button
                              onClick={() => { if(confirm('Reject this proposal?')) rejectQuoteMutation.mutate(q.id) }}
                              className="rounded-xl border border-outline-variant p-2.5 text-on-surface-variant hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                              title="Reject proposal"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                            <button
                              onClick={() => handleAcceptQuoteClick(q)}
                              className="flex-1 rounded-xl bg-primary py-2.5 px-3 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition text-center shadow-sm hover:scale-[1.02] active:scale-95"
                            >
                              Accept & Book
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {booking && spareParts.length > 0 && (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
                <h3 className="text-headline-sm font-bold text-on-surface text-base mb-4">Required Spare Parts</h3>
                <p className="text-label-sm text-on-surface-variant mb-4">The technician has requested approval for the following spare parts to perform the repair. Approved items will be charged to the final invoice.</p>

                <div className="divide-y divide-outline-variant/20">
                  {spareParts.map((p: any) => (
                    <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-body-md text-on-surface">{p.partName} <span className="text-label-sm text-on-surface-variant font-normal">(Qty: {p.quantity})</span></h4>
                        {p.reason && <p className="text-label-sm text-on-surface-variant mt-1">Reason: {p.reason}</p>}
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <p className="font-semibold text-body-md text-primary">{p.priceBdt * p.quantity} BDT</p>
                        {p.approvedByCustomer ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 px-2.5 py-1 text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => approvePartMutation.mutate(p.id)}
                            disabled={approvePartMutation.isPending}
                            className="rounded-xl bg-primary px-4 py-2 text-label-sm font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95"
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

          <div className="space-y-6">
            {booking ? (
              <>
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-bold text-on-surface-variant tracking-wider uppercase">Active Job Detail</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-label-sm font-bold text-emerald-800">{booking.status}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-body-md text-on-surface">{booking.workOrderId}</h3>
                    <p className="text-label-sm text-on-surface-variant">Escrow Hold Order ID</p>
                  </div>

                  <div className="border-t border-outline-variant/10 pt-4 text-label-md text-on-surface-variant space-y-3">
                    <div className="flex justify-between">
                      <span>Scheduled Date</span>
                      <strong className="text-on-surface">{booking.scheduledDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Slot</span>
                      <strong className="text-on-surface">{booking.scheduledTimeSlot || 'Flexible'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Parts Cost</span>
                      <strong className="text-on-surface">{totalSparesCost} BDT</strong>
                    </div>
                  </div>

                  <hr className="border-outline-variant/20" />

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
                      {booking.technician?.user?.displayName?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-label-md text-on-surface">{booking.technician?.user?.displayName}</p>
                      <p className="text-label-sm text-on-surface-variant">{booking.technician?.specialization}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Progress Timeline</h3>
                  
                  {progressList.length === 0 ? (
                    <p className="text-label-sm text-on-surface-variant">No timeline entries logged yet.</p>
                  ) : (
                    <div className="relative border-l border-outline-variant pl-4 space-y-6">
                      {progressList.map((p: any) => (
                        <div key={p.id} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                          
                          <div className="text-label-md text-on-surface-variant">
                            <span className="font-bold text-on-surface block">{p.status}</span>
                            <span className="text-label-sm text-on-surface-variant block mt-0.5">{new Date(p.createdAt).toLocaleString()}</span>
                            {p.note && <p className="mt-1 text-body-md">{p.note}</p>}
                            {p.photoUrl && (
                              <button
                                onClick={() => setLightbox({ images: [{ url: p.photoUrl }], index: 0 })}
                                className="mt-2 h-12 w-20 overflow-hidden rounded border border-outline-variant/30 hover:opacity-90 transition shadow-sm"
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

                {(booking.status === 'COMPLETED' || booking.status === 'CLOSED') && booking.warrantyDays > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[24px]">workspace_premium</span>
                    <div>
                      <h4 className="font-semibold text-label-sm text-emerald-950 uppercase tracking-wider">Service Warranty Active</h4>
                      <p className="text-label-sm text-emerald-800 mt-1 leading-relaxed">
                        This repair has a {booking.warrantyDays}-day warranty active. Expires on {new Date(booking.warrantyExpiresAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                )}

                {(booking.status === 'COMPLETED' || booking.status === 'CLOSED') && (
                  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                    <h3 className="font-bold text-label-md uppercase tracking-wider text-on-surface-variant mb-4">Service Review</h3>
                    
                    {bookingReview ? (
                      <div className="space-y-3">
                        <div className="flex gap-0.5 text-tertiary">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const avg = (bookingReview.workQuality + bookingReview.professionalism + bookingReview.communication + bookingReview.timeliness + bookingReview.pricingFairness) / 5.0
                            return <span key={i} className={`material-symbols-outlined text-[16px] ${i < Math.round(avg) ? 'icon-fill' : 'text-outline-variant/50'}`}>star</span>
                          })}
                        </div>
                        {bookingReview.comment && (
                          <p className="text-label-sm text-on-surface-variant italic">"{bookingReview.comment}"</p>
                        )}
                        <span className="text-label-sm text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> Feedback recorded
                        </span>
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
                            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-3 py-2 text-label-md outline-none focus:border-primary"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitReviewMutation.isPending}
                          className="w-full rounded-xl bg-primary py-2.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02]"
                        >
                          {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full rounded-xl border border-outline-variant py-2.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition shadow-sm"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-amber-500 mb-2">auto_awesome</span>
                <h4 className="font-semibold text-label-sm text-on-surface uppercase tracking-wider">No Booking Yet</h4>
                <p className="text-label-sm mt-1">Accept a proposal quote to schedule your technician and secure your service appointment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-xl animate-in zoom-in-95">
            <h3 className="font-bold text-headline-sm text-on-surface text-lg">Accept Proposal & Book</h3>
            <p className="text-label-md text-on-surface-variant mt-1.5">You are booking {selectedQuote.technician?.user?.displayName} for {selectedQuote.quoteBdt} BDT.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Schedule Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Preferred Time Slot</label>
                <select
                  value={scheduleTimeSlot}
                  onChange={(e) => setScheduleTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-2.5 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-semibold text-on-surface hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={acceptQuoteMutation.isPending}
                className="flex-1 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition disabled:opacity-50 shadow-sm"
              >
                {acceptQuoteMutation.isPending ? 'Booking...' : 'Confirm Book'}
              </button>
            </div>
          </div>
        </div>
      )}

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
