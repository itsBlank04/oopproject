import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { RepairRequest, RepairQuote, RepairBooking, ServiceListing } from '@/types'

const LEVEL_BADGES: Record<string, { cls: string; label: string }> = {
  BEGINNER: { cls: 'bg-gray-100 text-gray-600', label: '🌱 Beginner' },
  VERIFIED: { cls: 'bg-blue-100 text-blue-700', label: '✓ Verified' },
  EXPERT: { cls: 'bg-amber-100 text-amber-700', label: '⭐ Expert' },
}

export default function Repairs() {
  const { role } = useAuth()
  const queryClient = useQueryClient()

  // Shared tab state
  const [mainTab, setMainTab] = useState<'requests' | 'services'>('requests')

  // Repair form state
  const [category, setCategory] = useState('Electronics')
  const [description, setDescription] = useState('')
  const [pickupNeeded, setPickupNeeded] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [techTab, setTechTab] = useState<'open' | 'bookings' | 'my-listings'>('open')

  const [quoteAmount, setQuoteAmount] = useState('')
  const [quotePlan, setQuotePlan] = useState('')
  const [quotingId, setQuotingId] = useState<number | null>(null)

  const [acceptQuoteId, setAcceptQuoteId] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')

  const [reviewRating, setReviewRating] = useState('5')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewingBooking, setReviewingBooking] = useState<number | null>(null)

  // Service listing form
  const [slCategory, setSlCategory] = useState('Electronics')
  const [slPriceMin, setSlPriceMin] = useState('')
  const [slPriceMax, setSlPriceMax] = useState('')
  const [slAvailability, setSlAvailability] = useState('')
  const [slFilterCategory, setSlFilterCategory] = useState('All')

  const isTechnician = role === 'TECHNICIAN'

  const { data: requests } = useQuery({
    queryKey: ['repair-requests', role],
    queryFn: () => (isTechnician ? api.get<RepairRequest[]>('/repairs/requests/open') : api.get<RepairRequest[]>('/repairs/requests')),
  })

  const { data: myBookings } = useQuery({
    queryKey: ['technician-bookings'],
    queryFn: () => api.get<RepairBooking[]>('/repairs/technician/bookings'),
    enabled: isTechnician,
  })

  const { data: quotes } = useQuery({
    queryKey: ['repair-quotes', expandedId],
    queryFn: () => api.get<RepairQuote[]>(`/repairs/requests/${expandedId}/quotes`),
    enabled: !!expandedId,
  })

  // Service listings queries
  const { data: allListings } = useQuery({
    queryKey: ['service-listings'],
    queryFn: () => api.get<ServiceListing[]>('/service-listings'),
  })

  const { data: myListings } = useQuery({
    queryKey: ['my-service-listings'],
    queryFn: () => api.get<ServiceListing[]>('/service-listings/mine'),
    enabled: isTechnician,
  })

  // Mutations
  const createRequest = useMutation({
    mutationFn: () => api.post('/repairs/requests', { category, description, pickupNeeded, media: [] }),
    onSuccess: () => {
      toast.success('Repair request submitted')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendQuote = useMutation({
    mutationFn: ({ requestId, amountBdt, plan }: { requestId: number; amountBdt: number; plan: string }) =>
      api.post<RepairQuote>(`/repairs/requests/${requestId}/quotes`, { quoteBdt: amountBdt, plan }),
    onSuccess: () => {
      toast.success('Quote sent')
      setQuotingId(null)
      setQuoteAmount('')
      setQuotePlan('')
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const acceptQuote = useMutation({
    mutationFn: ({ quoteId, date }: { quoteId: number; date: string }) =>
      api.post('/repairs/bookings', { quoteId, scheduledDate: date }),
    onSuccess: () => {
      toast.success('Booking confirmed')
      setAcceptQuoteId(null)
      setScheduledDate('')
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
      queryClient.invalidateQueries({ queryKey: ['repair-quotes'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const completeBooking = useMutation({
    mutationFn: (bookingId: number) => api.post(`/repairs/bookings/${bookingId}/complete`),
    onSuccess: () => {
      toast.success('Booking completed')
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectBooking = useMutation({
    mutationFn: (bookingId: number) => api.post(`/repairs/bookings/${bookingId}/reject`),
    onSuccess: () => {
      toast.success('Booking rejected')
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const submitReview = useMutation({
    mutationFn: ({ revieweeId, rating, comment }: { revieweeId: number; rating: number; comment: string }) =>
      api.post('/repairs/reviews', { revieweeId, rating, comment }),
    onSuccess: () => {
      toast.success('Review submitted')
      setReviewingBooking(null)
      setReviewComment('')
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createListing = useMutation({
    mutationFn: () => api.post('/service-listings', {
      category: slCategory,
      priceMinBdt: Number(slPriceMin),
      priceMaxBdt: Number(slPriceMax),
      availabilityNote: slAvailability || null,
    }),
    onSuccess: () => {
      toast.success('Service listing created')
      setSlPriceMin('')
      setSlPriceMax('')
      setSlAvailability('')
      queryClient.invalidateQueries({ queryKey: ['my-service-listings'] })
      queryClient.invalidateQueries({ queryKey: ['service-listings'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteListing = useMutation({
    mutationFn: (id: number) => api.delete(`/service-listings/${id}`),
    onSuccess: () => {
      toast.success('Listing removed')
      queryClient.invalidateQueries({ queryKey: ['my-service-listings'] })
      queryClient.invalidateQueries({ queryKey: ['service-listings'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Helper to get technician name from ServiceListing
  const getTechName = (sl: ServiceListing) => {
    if (typeof sl.technician === 'object' && sl.technician !== null) {
      return sl.technician.user?.displayName || 'Technician'
    }
    return 'Technician'
  }

  // Filter service listings
  const filteredListings = allListings?.filter(sl => {
    if (sl.status !== 'ACTIVE') return false
    if (slFilterCategory !== 'All' && sl.category !== slFilterCategory) return false
    return true
  })

  // ─── SERVICE LISTINGS BROWSE TAB (for all users) ───
  const renderServiceListingsBrowse = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <select
          className="input max-w-xs"
          value={slFilterCategory}
          onChange={(e) => setSlFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Appliances">Appliances</option>
          <option value="Furniture">Furniture</option>
          <option value="Electrical">Electrical</option>
        </select>
        <p className="text-sm text-ink-400">{filteredListings?.length || 0} services available</p>
      </div>

      {!filteredListings?.length ? (
        <div className="text-center py-16 text-ink-400">
          <p className="text-5xl mb-3">🔧</p>
          <p className="text-lg">No service listings available</p>
          <p className="text-sm mt-1">Check back later or browse repair requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((sl) => (
            <div key={sl.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                    {sl.category}
                  </span>
                  <p className="font-medium text-ink-950 mt-2">{getTechName(sl)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal-700">
                    ৳{Number(sl.priceMinBdt).toLocaleString()} – ৳{Number(sl.priceMaxBdt).toLocaleString()}
                  </p>
                </div>
              </div>
              {sl.availabilityNote && (
                <p className="text-sm text-ink-500 mt-3">📅 {sl.availabilityNote}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {sl.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ─── TECHNICIAN VIEW ───
  if (isTechnician) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-3xl text-ink-950 mb-8">Repair Services</h1>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTechTab('open')} className={`btn btn-sm ${techTab === 'open' ? 'btn-primary' : 'btn-ghost'}`}>
            Open Requests
          </button>
          <button onClick={() => setTechTab('bookings')} className={`btn btn-sm ${techTab === 'bookings' ? 'btn-primary' : 'btn-ghost'}`}>
            My Bookings
          </button>
          <button onClick={() => setTechTab('my-listings')} className={`btn btn-sm ${techTab === 'my-listings' ? 'btn-primary' : 'btn-ghost'}`}>
            My Service Listings
          </button>
        </div>

        {techTab === 'open' && (
          <div className="space-y-4">
            {requests?.length === 0 && <p className="text-ink-400 text-center py-12">No open requests</p>}
            {requests?.map((req) => (
              <div key={req.id} className="card p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-ink-950">{req.category}</h3>
                    <p className="text-sm text-ink-500 mt-1">{req.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-ink-400">Status: {req.status}</span>
                      {req.pickupNeeded && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">🚚 Pickup needed</span>
                      )}
                    </div>
                  </div>
                  {quotingId === req.id ? (
                    <div className="w-72 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input className="input text-sm" type="number" placeholder="Quote (৳)" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} min="0" />
                      <input className="input text-sm" placeholder="Plan (e.g. Inspection + parts)" value={quotePlan} onChange={(e) => setQuotePlan(e.target.value)} />
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={() => sendQuote.mutate({ requestId: req.id, amountBdt: Number(quoteAmount), plan: quotePlan })} disabled={!quoteAmount || Number(quoteAmount) <= 0 || !quotePlan}>
                          Send
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setQuotingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setQuotingId(req.id)}>
                      Send Quote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {techTab === 'bookings' && (
          <div className="space-y-4">
            {myBookings?.length === 0 && <p className="text-ink-400 text-center py-12">No bookings yet</p>}
            {myBookings?.map((b) => (
              <div key={b.id} className="card p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-ink-950">Booking #{b.id}</p>
                    <p className="text-sm text-ink-500 mt-1">Scheduled: {b.scheduledDate}</p>
                    <p className="text-sm text-ink-500">Status: {b.status}</p>
                  </div>
                  {b.status === 'CONFIRMED' && (
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => completeBooking.mutate(b.id)} disabled={completeBooking.isPending}>
                        Mark Complete
                      </button>
                      <button className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50" onClick={() => rejectBooking.mutate(b.id)} disabled={rejectBooking.isPending}>
                        Reject
                      </button>
                    </div>
                  )}
                  {b.status === 'REJECTED' && (
                    <span className="text-sm text-red-500 font-medium">Rejected</span>
                  )}
                  {b.status === 'COMPLETED' && (
                    <span className="text-sm text-green-600 font-medium">✓ Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {techTab === 'my-listings' && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="card p-6 space-y-4">
              <h2 className="font-display text-xl">Create Service Listing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={slCategory} onChange={(e) => setSlCategory(e.target.value)}>
                    <option>Electronics</option>
                    <option>Appliances</option>
                    <option>Furniture</option>
                    <option>Electrical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Availability Note</label>
                  <input className="input" value={slAvailability} onChange={(e) => setSlAvailability(e.target.value)} placeholder="e.g. Mon-Fri 9am-5pm" />
                </div>
                <div>
                  <label className="label">Min Price (৳)</label>
                  <input className="input" type="number" value={slPriceMin} onChange={(e) => setSlPriceMin(e.target.value)} placeholder="500" />
                </div>
                <div>
                  <label className="label">Max Price (৳)</label>
                  <input className="input" type="number" value={slPriceMax} onChange={(e) => setSlPriceMax(e.target.value)} placeholder="5000" />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => createListing.mutate()}
                disabled={!slPriceMin || !slPriceMax || Number(slPriceMin) <= 0 || Number(slPriceMax) <= 0 || createListing.isPending}
              >
                {createListing.isPending ? 'Creating...' : 'Create Listing'}
              </button>
            </div>

            {/* My listings */}
            <div className="space-y-3">
              {myListings?.length === 0 && <p className="text-ink-400 text-center py-8">No service listings yet</p>}
              {myListings?.map((sl) => (
                <div key={sl.id} className="card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {sl.category}
                    </span>
                    <span className="font-medium text-ink-950">
                      ৳{Number(sl.priceMinBdt).toLocaleString()} – ৳{Number(sl.priceMaxBdt).toLocaleString()}
                    </span>
                    {sl.availabilityNote && (
                      <span className="text-sm text-ink-500">📅 {sl.availabilityNote}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sl.status}
                    </span>
                  </div>
                  <button
                    className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => deleteListing.mutate(sl.id)}
                    disabled={deleteListing.isPending}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── CUSTOMER / VENDOR VIEW ───
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Repair Services</h1>

      {/* Main tabs: Requests vs Service Listings */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setMainTab('requests')} className={`btn btn-sm ${mainTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}>
          Repair Requests
        </button>
        <button onClick={() => setMainTab('services')} className={`btn btn-sm ${mainTab === 'services' ? 'btn-primary' : 'btn-ghost'}`}>
          Browse Services
        </button>
      </div>

      {mainTab === 'services' && renderServiceListingsBrowse()}

      {mainTab === 'requests' && (
        <>
          <form
            onSubmit={(e) => { e.preventDefault(); createRequest.mutate() }}
            className="card p-6 mb-8 space-y-4"
          >
            <h2 className="font-display text-xl">Request a repair</h2>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Electronics</option>
                <option>Appliances</option>
                <option>Furniture</option>
                <option>Electrical</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-500">
              <input type="checkbox" checked={pickupNeeded} onChange={(e) => setPickupNeeded(e.target.checked)} />
              Pickup needed
            </label>
            <button type="submit" className="btn btn-primary" disabled={createRequest.isPending}>
              {createRequest.isPending ? 'Submitting...' : 'Submit request'}
            </button>
          </form>

          <div className="space-y-4">
            {requests?.length === 0 && <p className="text-ink-400 text-center py-12">No repair requests</p>}
            {requests?.map((req) => (
              <div key={req.id} className="card p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-ink-950">{req.category}</h3>
                    <p className="text-sm text-ink-500 mt-1">{req.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-ink-400">Status: {req.status}</span>
                      {req.pickupNeeded && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">🚚 Pickup</span>
                      )}
                    </div>
                  </div>
                </div>

                {req.status === 'QUOTED' && (
                  <div className="mt-3">
                    <button
                      className="text-sm text-teal-600 hover:underline"
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    >
                      {expandedId === req.id ? 'Hide quotes' : 'View quotes'}
                    </button>

                    {expandedId === req.id && quotes && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-cream-200">
                        {quotes.map((q) => (
                          <div key={q.id} className="p-4 bg-cream-50 rounded-xl">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-ink-950">{q.technicianName}</p>
                                <p className="text-lg font-semibold text-teal-700">৳{Number(q.quoteBdt).toLocaleString()}</p>
                                {q.plan && <p className="text-sm text-ink-500 mt-1">{q.plan}</p>}
                              </div>
                              {acceptQuoteId === q.id ? (
                                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                  <input className="input text-sm" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                                  <div className="flex gap-2">
                                    <button className="btn btn-primary btn-sm" onClick={() => acceptQuote.mutate({ quoteId: q.id, date: scheduledDate })} disabled={!scheduledDate}>
                                      Confirm
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAcceptQuoteId(null); setScheduledDate('') }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => setAcceptQuoteId(q.id)}>
                                  Accept
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {quotes.length === 0 && <p className="text-sm text-ink-400">No quotes yet</p>}
                      </div>
                    )}
                  </div>
                )}

                {req.status === 'BOOKED' && (
                  <p className="mt-3 text-sm text-teal-600 font-medium">Booking confirmed — technician will contact you</p>
                )}

                {req.status === 'COMPLETED' && (
                  <div className="mt-3">
                    {reviewingBooking === req.id ? (
                      <div className="p-4 bg-cream-50 rounded-xl space-y-2">
                        <label className="label text-sm">Rating</label>
                        <select className="input text-sm" value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
                          {[5,4,3,2,1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</option>)}
                        </select>
                        <label className="label text-sm">Comment (optional)</label>
                        <textarea className="input text-sm min-h-[60px]" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            const booking = req.activeBooking
                            if (!booking) return toast.error('Booking not found')
                            submitReview.mutate({ revieweeId: booking.technicianUserId, rating: Number(reviewRating), comment: reviewComment })
                          }} disabled={submitReview.isPending}>
                            Submit Review
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setReviewingBooking(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => setReviewingBooking(req.id)}>
                        Leave Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
