import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'
import { ArrowRight, Wrench } from 'lucide-react'

export default function RepairRequestsPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const shouldOpenForm = searchParams.get('open') === 'true'
  const techId = searchParams.get('techId')
  const techName = searchParams.get('techName')

  const [showForm, setShowForm] = useState(shouldOpenForm)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  
  // Upgraded rich form state
  const [form, setForm] = useState({
    title: '',
    deviceType: '',
    brand: '',
    deviceModel: '',
    categoryId: '',
    description: '',
    serviceLocation: 'HOME_VISIT', // HOME_VISIT, WORKSHOP, PICKUP
    contactNumber: '',
    landmark: '',
    preferredDate: '',
    preferredTimeSlot: '09:00 AM - 12:00 PM',
    flexibleSchedule: true,
    emergency: false,
    urgencyLevel: 'NORMAL', // NORMAL, URGENT, EMERGENCY
    pickupNeeded: false
  })

  const [lightbox, setLightbox] = useState<{ images: { url: string; type?: string }[]; index: number } | null>(null)

  // Auto-open form if query param tells us to
  useEffect(() => {
    if (shouldOpenForm) {
      setShowForm(true)
      if (techName) {
        setForm(prev => ({
          ...prev,
          description: `Direct request for technician ${techName}.\n\n`
        }))
      }
    }
  }, [shouldOpenForm, techName])

  // Fetch customer's own requests
  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['repair-requests'],
    queryFn: () => apiClient.get('/api/repair/requests/mine').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  })

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      // Validate fields
      if (!form.title.trim() || !form.deviceType.trim() || !form.description.trim() || !form.contactNumber.trim()) {
        throw new Error('Title, Device Type, Description and Contact Number are required')
      }

      const res = await apiClient.post('/api/repair/requests', {
        ...form,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        // If urgency level is emergency, auto-set emergency flag
        emergency: form.urgencyLevel === 'EMERGENCY' || form.emergency
      })

      // Upload media associations if any
      for (const url of mediaUrls) {
        await apiClient.post(`/api/repair/requests/${res.data.id}/media`, { mediaUrl: url, mediaType: 'image' }).catch(() => {})
      }

      // If a specific technician was selected, send direct notification (in real project chat or message)
      if (techId) {
        // Send simulated booking notification or note
        await apiClient.post('/api/notifications', {
          userId: parseInt(techId),
          title: 'Direct Repair Request',
          content: `Customer ${user?.displayName} has requested a bid on "${form.title}" (${res.data.id}).`,
          link: `/repair/dashboard`
        }).catch(() => {})
      }

      return res.data
    },
    onSuccess: (data) => {
      toast.success('Repair request created successfully')
      setShowForm(false)
      setForm({
        title: '',
        deviceType: '',
        brand: '',
        deviceModel: '',
        categoryId: '',
        description: '',
        serviceLocation: 'HOME_VISIT',
        contactNumber: '',
        landmark: '',
        preferredDate: '',
        preferredTimeSlot: '09:00 AM - 12:00 PM',
        flexibleSchedule: true,
        emergency: false,
        urgencyLevel: 'NORMAL',
        pickupNeeded: false
      })
      setMediaUrls([])
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
      // Navigate to detail page
      navigate(`/repair/requests/${data.id}`)
    },
    onError: (e: any) => toast.error(e.message || e.response?.data?.error || 'Failed to create request'),
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-blue-100 text-blue-700 font-semibold'
      case 'QUOTED': return 'bg-amber-100 text-amber-700 font-semibold'
      case 'BOOKED': return 'bg-indigo-100 text-indigo-700 font-semibold'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 font-semibold'
      case 'CANCELLED': return 'bg-red-100 text-red-700 font-semibold'
      default: return 'bg-gray-100 text-gray-600 font-semibold'
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center bg-[#f9f5f0]">
        <p className="text-[#6c5b4f]">Sign in to manage your repair requests.</p>
        <Link to="/auth/login" className="mt-4 inline-block rounded-xl bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10 text-[#221b16]">
      <div className="mx-auto max-w-4xl">
        
        {/* Role upgrade callout */}
        {!hasRole('TECHNICIAN') && (
          <div className="mb-6 rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e8df] flex-shrink-0">
                  <Wrench className="h-6 w-6 text-[#221b16]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a28672]">Become a provider</p>
                  <p className="mt-1 text-sm font-semibold text-[#221b16]">Join the Craftsmen Team</p>
                  <p className="mt-1 text-xs text-[#8c7564]">Offer your repair services, bid on open listings, and manage bookings.</p>
                </div>
              </div>
              <Link to="/profile#role-upgrade" className="inline-flex items-center gap-2 rounded-xl bg-[#221b16] px-5 py-2.5 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition shadow-sm">
                Apply in Profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[Fraunces] text-3xl font-bold">My Repair Requests</h1>
            <p className="text-xs text-[#8c7564] mt-1">Track diagnoses, compare quotes, and monitor active repairs</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) navigate('/repair/requests') }}
            className="rounded-xl bg-[#221b16] px-5 py-2.5 text-xs font-bold text-[#f9f5f0] hover:bg-[#3a3028] transition"
          >
            {showForm ? 'Cancel Request Form' : '+ Create Request'}
          </button>
        </div>

        {/* Upgraded Repair Request Form */}
        {showForm && (
          <div className="mt-6 space-y-6 rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
            <div>
              <h3 className="font-[Fraunces] text-lg font-bold text-[#221b16]">Describe your repair needs</h3>
              {techName && (
                <p className="mt-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 inline-block">
                  ✓ Booking request recommended for: {techName}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {/* Problem Title */}
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Issue Title</label>
                <input
                  placeholder="e.g. Samsung Refrigerator compressor not cooling"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                />
              </div>

              {/* Device and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Device Type</label>
                  <input
                    placeholder="e.g. Refrigerator / Microwave / Smart TV"
                    value={form.deviceType}
                    onChange={e => setForm({ ...form, deviceType: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Category Specialist</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Brand and Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Brand</label>
                  <input
                    placeholder="e.g. LG / Samsung / Sony"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Device Model (Optional)</label>
                  <input
                    placeholder="e.g. RT42K5038S8 / iPhone 15 Pro"
                    value={form.deviceModel}
                    onChange={e => setForm({ ...form, deviceModel: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Detailed Description</label>
                <textarea
                  placeholder="Explain when the problem started, symptoms, any error codes displayed, and diagnostic clues..."
                  value={form.description}
                  rows={4}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                />
              </div>

              {/* Location and Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Service Location Mode</label>
                  <select
                    value={form.serviceLocation}
                    onChange={e => setForm({ ...form, serviceLocation: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  >
                    <option value="HOME_VISIT">Home Visit Diagnosis</option>
                    <option value="WORKSHOP">Drop-off to Workshop</option>
                    <option value="PICKUP">Technician Pickup Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Contact Number</label>
                  <input
                    placeholder="e.g. +88017XXXXXXXX"
                    value={form.contactNumber}
                    onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Area Landmark / Address Info</label>
                <input
                  placeholder="e.g. Near Dhanmondi Lake, Road 8A, Dhaka"
                  value={form.landmark}
                  onChange={e => setForm({ ...form, landmark: e.target.value })}
                  className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                />
              </div>

              {/* Schedule and urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Preferred Date</label>
                  <input
                    type="date"
                    value={form.preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({ ...form, preferredDate: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Preferred Time Slot</label>
                  <select
                    value={form.preferredTimeSlot}
                    onChange={e => setForm({ ...form, preferredTimeSlot: e.target.value })}
                    className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]"
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Midday (12:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Afternoon (03:00 PM - 06:00 PM)</option>
                    <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Urgency Level selection */}
              <div>
                <label className="block text-xs font-semibold text-[#8c7564] uppercase tracking-wider mb-2">Urgency Level</label>
                <div className="flex gap-4">
                  {['NORMAL', 'URGENT', 'EMERGENCY'].map(level => (
                    <label key={level} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="urgencyLevel"
                        value={level}
                        checked={form.urgencyLevel === level}
                        onChange={e => setForm({ ...form, urgencyLevel: e.target.value, emergency: level === 'EMERGENCY' })}
                        className="h-4 w-4 border-[#d7c7b8] accent-[#221b16]"
                      />
                      <span className={level === 'EMERGENCY' ? 'text-red-600 font-bold' : ''}>{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Media Uploader */}
              <div className="pt-2">
                <MediaUploader
                  folder="repairs"
                  label="Photos & Videos of the issue (up to 6)"
                  maxFiles={6}
                  maxSizeMB={25}
                  allowVideo={true}
                  onUpload={setMediaUrls}
                />
              </div>
            </div>

            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full rounded-xl bg-[#221b16] py-3.5 font-bold text-xs uppercase tracking-wider text-[#f9f5f0] hover:bg-[#3a3028] disabled:opacity-50 transition"
            >
              {createMutation.isPending ? 'Publishing Request...' : 'Publish Repair Request'}
            </button>
          </div>
        )}

        {/* Requests List */}
        {isLoading ? (
          <div className="mt-16 text-center text-xs text-[#8c7564]">
            <div className="animate-spin h-5 w-5 border-2 border-[#221b16] border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading your active requests...
          </div>
        ) : requests.length === 0 && !showForm ? (
          <div className="mt-12 rounded-3xl border border-[#e4d6c8] bg-white p-12 text-center">
            <p className="text-base font-semibold text-[#221b16]">No repair requests posted yet</p>
            <p className="text-xs text-[#8c7564] mt-1 mb-6">Describe your repair, upload photos, and compare quotes from local experts.</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-[#221b16] px-6 py-3 text-xs font-semibold text-[#f9f5f0] hover:bg-[#3a3028]"
            >
              Post a Repair Request
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {requests.map((r: any) => (
              <div key={r.id} className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm flex flex-col justify-between hover:border-[#221b16]/30 transition">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[#221b16] text-base">{r.title || `Request #${r.id}`}</h3>
                      <p className="text-xs text-[#8c7564] mt-0.5">{r.deviceType} · {r.brand} {r.deviceModel}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-wider ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#6c5b4f] leading-relaxed line-clamp-2">{r.description}</p>
                  
                  {r.media?.length > 0 && (
                    <div className="mt-4 flex gap-1.5">
                      {r.media.map((m: any, i: number) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLightbox({
                              images: r.media.map((mm: any) => ({ url: mm.mediaUrl })),
                              index: i
                            })
                          }}
                          className="h-12 w-12 overflow-hidden rounded-lg border border-[#e4d6c8] bg-[#f9f5f0]"
                        >
                          <img src={m.mediaUrl} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#e4d6c8]/60 flex items-center justify-between gap-4">
                  <div className="flex gap-4 text-[10px] text-[#8c7564]">
                    <span>📍 {r.serviceLocation}</span>
                    <span>🗓 Date: {r.preferredDate || 'Flexible'}</span>
                  </div>

                  <Link
                    to={`/repair/requests/${r.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#221b16] hover:underline"
                  >
                    View Details & Quotes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
