/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

export default function RepairRequestsPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const shouldOpenForm = searchParams.get('open') === 'true'
  const techId = searchParams.get('techId')
  const techName = searchParams.get('techName')

  const [showForm, setShowForm] = useState(shouldOpenForm)
  const [step, setStep] = useState(1)
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowForm(true)
      setStep(1)
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
      setStep(1)
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

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.title.trim()) {
        toast.error('Please enter an issue title')
        return
      }
      if (!form.deviceType.trim()) {
        toast.error('Please enter the device type')
        return
      }
      if (!form.description.trim()) {
        toast.error('Please enter a detailed description')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (!form.contactNumber.trim()) {
        toast.error('Please enter your contact number')
        return
      }
      setStep(4)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'QUOTED': return 'bg-amber-100 text-amber-800'
      case 'BOOKED': return 'bg-indigo-100 text-indigo-800'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-surface-container-low text-on-surface-variant'
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop py-20 text-center bg-background">
        <p className="text-on-surface-variant text-body-lg">Sign in to manage your repair requests.</p>
        <Link to="/auth/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background text-on-surface px-margin-mobile md:px-margin-desktop pb-28 pt-10`}>
      <div className="mx-auto max-w-3xl">
        
        {/* Role upgrade callout */}
        {!hasRole('TECHNICIAN') && !showForm && (
          <div className="mb-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[28px]">handyman</span>
                </div>
                <div>
                  <p className="text-label-sm font-bold uppercase tracking-[0.1em] text-primary">Become a provider</p>
                  <p className="mt-1 text-body-md font-semibold text-on-surface">Join the Craftsmen Team</p>
                  <p className="mt-1 text-label-md text-on-surface-variant">Offer your repair services, bid on open listings, and manage bookings.</p>
                </div>
              </div>
              <Link to="/profile#role-upgrade" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95">
                Apply in Profile <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">My Repair Requests</h1>
            <p className="text-label-md text-on-surface-variant">Track diagnoses, compare quotes, and monitor active repairs</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setStep(1); }}
              className="rounded-xl bg-primary px-5 py-2.5 text-label-md font-bold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95"
            >
              + Create Request
            </button>
          )}
        </div>

        {/* Upgraded Multi-Step Repair Request Form */}
        {showForm && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Step indicators */}
            <section className="mb-10">
              <div className="flex items-center justify-between relative px-2 max-w-md mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -z-10 -translate-y-1/2"></div>
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md transition-all ${
                    step === 1 ? 'active-step-circle' : step > 1 ? 'completed-step-circle' : 'inactive-step-circle'
                  }`}>
                    {step > 1 ? <span className="material-symbols-outlined text-[20px]">check</span> : '1'}
                  </div>
                  <span className={`text-label-sm ${step === 1 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>Describe</span>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md transition-all ${
                    step === 2 ? 'active-step-circle' : step > 2 ? 'completed-step-circle' : 'inactive-step-circle'
                  }`}>
                    {step > 2 ? <span className="material-symbols-outlined text-[20px]">check</span> : '2'}
                  </div>
                  <span className={`text-label-sm ${step === 2 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>Media</span>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md transition-all ${
                    step === 3 ? 'active-step-circle' : step > 3 ? 'completed-step-circle' : 'inactive-step-circle'
                  }`}>
                    {step > 3 ? <span className="material-symbols-outlined text-[20px]">check</span> : '3'}
                  </div>
                  <span className={`text-label-sm ${step === 3 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>Service</span>
                </div>
                {/* Step 4 */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md transition-all ${
                    step === 4 ? 'active-step-circle' : 'inactive-step-circle'
                  }`}>
                    4
                  </div>
                  <span className={`text-label-sm ${step === 4 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>Schedule</span>
                </div>
              </div>
            </section>

            {/* Form Canvas */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 md:p-10 shadow-sm min-h-[400px]">
              
              {/* Step 1: Describe */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface text-lg">Describe your repair needs</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">Provide technical details about your device and the symptoms you're experiencing.</p>
                    {techName && (
                      <p className="mt-3 text-label-sm text-emerald-800 font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                        Direct request for technician: {techName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Issue Title</label>
                      <input
                        placeholder="e.g. Samsung Refrigerator compressor not cooling"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Device Type</label>
                        <input
                          placeholder="e.g. Refrigerator, Smart TV, Laptop"
                          value={form.deviceType}
                          onChange={e => setForm({ ...form, deviceType: e.target.value })}
                          className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Category Specialist</label>
                        <select
                          value={form.categoryId}
                          onChange={e => setForm({ ...form, categoryId: e.target.value })}
                          className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        >
                          <option value="">Select Category</option>
                          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Brand</label>
                        <input
                          placeholder="e.g. LG, Samsung, Sony"
                          value={form.brand}
                          onChange={e => setForm({ ...form, brand: e.target.value })}
                          className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Device Model (Optional)</label>
                        <input
                          placeholder="e.g. RT42K5038S8 / iPhone 15 Pro"
                          value={form.deviceModel}
                          onChange={e => setForm({ ...form, deviceModel: e.target.value })}
                          className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Detailed Description</label>
                      <textarea
                        placeholder="Explain when the problem started, symptoms, any error codes displayed, and diagnostic clues..."
                        value={form.description}
                        rows={5}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Media */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface text-lg">Upload visual context</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">Clear photos or videos of the issue help technicians provide more accurate quotes.</p>
                  </div>

                  <div className="pt-4">
                    <MediaUploader
                      folder="repairs"
                      label="Photos & Videos of the issue (up to 6)"
                      maxFiles={6}
                      maxSizeMB={25}
                      allowVideo={true}
                      onUpload={setMediaUrls}
                    />
                  </div>
                  
                  {mediaUrls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-label-sm font-semibold text-on-surface-variant mb-2">Uploaded Images:</p>
                      <div className="flex flex-wrap gap-2">
                        {mediaUrls.map((url, idx) => (
                          <div key={idx} className="h-16 w-16 rounded-lg border border-outline-variant overflow-hidden bg-surface-container-low shadow-sm">
                            <img src={url} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Service Preference */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface text-lg">Select service preferences</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">Choose how you want to conduct the diagnostic and repair service.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Home Visit */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, serviceLocation: 'HOME_VISIT' })}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                        form.serviceLocation === 'HOME_VISIT'
                          ? 'border-primary bg-primary-container/10 ring-1 ring-primary'
                          : 'border-outline-variant bg-surface-bright hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        form.serviceLocation === 'HOME_VISIT' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">home</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-body-md text-on-surface">Home Visit Diagnosis</h4>
                        <p className="text-label-md text-on-surface-variant">Technician travels to your home or office location.</p>
                      </div>
                      <span className={`material-symbols-outlined ${form.serviceLocation === 'HOME_VISIT' ? 'text-primary icon-fill' : 'text-outline-variant'}`}>
                        {form.serviceLocation === 'HOME_VISIT' ? 'check_circle' : 'circle'}
                      </span>
                    </button>

                    {/* Workshop Drop-off */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, serviceLocation: 'WORKSHOP' })}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                        form.serviceLocation === 'WORKSHOP'
                          ? 'border-primary bg-primary-container/10 ring-1 ring-primary'
                          : 'border-outline-variant bg-surface-bright hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        form.serviceLocation === 'WORKSHOP' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">storefront</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-body-md text-on-surface">Workshop Drop-off</h4>
                        <p className="text-label-md text-on-surface-variant">Drop your device off directly at the technician's workspace.</p>
                      </div>
                      <span className={`material-symbols-outlined ${form.serviceLocation === 'WORKSHOP' ? 'text-primary icon-fill' : 'text-outline-variant'}`}>
                        {form.serviceLocation === 'WORKSHOP' ? 'check_circle' : 'circle'}
                      </span>
                    </button>

                    {/* Pickup needed */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, serviceLocation: 'PICKUP' })}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                        form.serviceLocation === 'PICKUP'
                          ? 'border-primary bg-primary-container/10 ring-1 ring-primary'
                          : 'border-outline-variant bg-surface-bright hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        form.serviceLocation === 'PICKUP' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-body-md text-on-surface">Technician Pickup Needed</h4>
                        <p className="text-label-md text-on-surface-variant">The technician picks up the item and returns it once repaired.</p>
                      </div>
                      <span className={`material-symbols-outlined ${form.serviceLocation === 'PICKUP' ? 'text-primary icon-fill' : 'text-outline-variant'}`}>
                        {form.serviceLocation === 'PICKUP' ? 'check_circle' : 'circle'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Contact Number</label>
                      <input
                        placeholder="e.g. +88017XXXXXXXX"
                        value={form.contactNumber}
                        onChange={e => setForm({ ...form, contactNumber: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Landmark / Address</label>
                      <input
                        placeholder="e.g. Near Dhanmondi Lake, Dhaka"
                        value={form.landmark}
                        onChange={e => setForm({ ...form, landmark: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Schedule */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface text-lg">Scheduling & Urgency</h2>
                    <p className="text-label-md text-on-surface-variant mt-1">Select your preferred window and the urgency level for this order.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Preferred Date</label>
                      <input
                        type="date"
                        value={form.preferredDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm({ ...form, preferredDate: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-semibold text-on-surface-variant mb-2">Time Slot</label>
                      <select
                        value={form.preferredTimeSlot}
                        onChange={e => setForm({ ...form, preferredTimeSlot: e.target.value })}
                        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      >
                        <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                        <option value="12:00 PM - 03:00 PM">Midday (12:00 PM - 03:00 PM)</option>
                        <option value="03:00 PM - 06:00 PM">Afternoon (03:00 PM - 06:00 PM)</option>
                        <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                    <label className="block text-label-sm font-semibold text-on-surface-variant">Urgency Level</label>
                    <div className="flex flex-wrap gap-4">
                      {['NORMAL', 'URGENT', 'EMERGENCY'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setForm({ ...form, urgencyLevel: level, emergency: level === 'EMERGENCY' })}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                            form.urgencyLevel === level
                              ? level === 'EMERGENCY'
                                ? 'bg-red-50 text-red-700 border-red-500 font-bold ring-1 ring-red-500'
                                : 'bg-primary-container/10 text-primary border-primary font-bold ring-1 ring-primary'
                              : 'border-outline-variant bg-surface-bright text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {level === 'EMERGENCY' ? 'warning' : level === 'URGENT' ? 'bolt' : 'schedule'}
                          </span>
                          {level}
                        </button>
                      ))}
                    </div>

                    {form.urgencyLevel === 'EMERGENCY' && (
                      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-label-md text-red-800 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-red-700 animate-pulse flex-shrink-0">warning</span>
                        <p><strong>Emergency Selected:</strong> Technicians will prioritize diagnostic bids immediately. Fast response fees may apply.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Trust Badges section for Form page */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-[24px]">engineering</span>
                <span className="text-label-md font-semibold text-on-surface">Certified Technicians</span>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <span className="text-label-md font-semibold text-on-surface">90-Day Warranty</span>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-[24px]">shield</span>
                <span className="text-label-md font-semibold text-on-surface">Secure Payment</span>
              </div>
            </section>

            {/* Fixed bottom step navigation bar */}
            <footer className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant z-50">
              <div className="max-w-container-max mx-auto h-24 px-margin-mobile md:px-margin-desktop flex items-center justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={step === 1}
                  className={`flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-bold px-6 py-3.5 rounded-xl border border-outline-variant ${
                    step === 1 ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  Back
                </button>
                <div className="flex items-center gap-6">
                  <p className="hidden md:block text-on-surface-variant text-label-sm">All diagnostic data is encrypted and secure.</p>
                  
                  {step < 4 ? (
                    <button
                      onClick={handleNextStep}
                      className="bg-primary text-on-primary font-bold px-8 py-3.5 rounded-xl flex items-center gap-1 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                      Next Step
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => createMutation.mutate()}
                      disabled={createMutation.isPending}
                      className="bg-primary text-on-primary font-bold px-8 py-3.5 rounded-xl flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* Requests List */}
        {!showForm && (
          <div className="animate-fadeIn">
            {isLoading ? (
              <div className="mt-16 text-center text-body-md text-on-surface-variant">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading your active requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-primary mb-4 block">engineering</span>
                <p className="text-body-md font-bold text-on-surface">No repair requests posted yet</p>
                <p className="text-label-md text-on-surface-variant mt-1 mb-6">Describe your repair, upload photos, and compare quotes from local experts.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-primary px-6 py-3 text-label-md font-bold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95"
                >
                  Post a Repair Request
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {requests.map((r: any) => (
                  <div key={r.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between hover:border-primary-container transition duration-300 hover:shadow-sm">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-on-surface text-body-md">{r.title || `Request #${r.id}`}</h3>
                          <p className="text-label-sm text-on-surface-variant mt-1">{r.deviceType} · {r.brand} {r.deviceModel}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-label-sm uppercase font-bold tracking-wider ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </div>

                      <p className="mt-4 text-body-md text-on-surface-variant leading-relaxed line-clamp-2">{r.description}</p>
                      
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
                              className="h-14 w-14 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm"
                            >
                              <img src={m.mediaUrl} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                      <div className="flex gap-4 text-label-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                          {r.serviceLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          Date: {r.preferredDate || 'Flexible'}
                        </span>
                      </div>

                      <Link
                        to={`/repair/requests/${r.id}`}
                        className="inline-flex items-center gap-1 text-label-md font-bold text-primary hover:underline hover:gap-2 transition-all duration-300"
                      >
                        View Details & Quotes <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

