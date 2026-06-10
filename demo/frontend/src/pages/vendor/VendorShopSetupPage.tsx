import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import MediaUploader from '../../components/MediaUploader'
import { toast } from 'react-hot-toast'
import { Check, ArrowLeft, ArrowRight, Store, MapPin, X } from 'lucide-react'

type Category = {
  id: number
  name: string
  slug: string
}

export default function VendorShopSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [location, setLocation] = useState('')
  const [policies, setPolicies] = useState('')
  const [error, setError] = useState('')

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-list'],
    queryFn: () => apiClient.get('/api/categories').then(r => r.data),
  })

  const createShopMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/shops', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Shop created successfully!')
      navigate('/vendor/shops')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create shop.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Shop name is required'); return }
    createShopMutation.mutate({
      name,
      description,
      location,
      policies,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      primaryCategoryId: category ? Number(category) : null,
    })
  }

  const steps = ['Branding', 'Location & Policies', 'Review']

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/vendor/shops" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4d6c8] bg-white text-[#6c5b4f] hover:bg-[#f9f5f0] transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-[Fraunces] text-2xl font-bold text-[#221b16]">Shop Setup</h1>
              <p className="text-xs text-[#8c7564]">Create your storefront in 3 easy steps</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left: Form */}
          <div className="w-full max-w-lg">
            {/* Stepper */}
            <div className="mb-8 flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    i < step ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-[#221b16] text-white' :
                    'bg-[#e4d6c8] text-[#8c7564]'
                  }`}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${i === step ? 'text-[#221b16]' : 'text-[#8c7564]'}`}>{s}</span>
                  {i < steps.length - 1 && <div className="h-px w-8 bg-[#e4d6c8]" />}
                </div>
              ))}
            </div>

            <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()}>
              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Shop Name</label>
                    <input type="text" required placeholder="e.g. ATOM Gadget Spot"
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
                    <p className="text-[10px] text-[#8c7564]">Must be unique across the platform</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Primary Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Description</label>
                    <textarea rows={3} placeholder="What does your shop sell?"
                      value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full resize-none rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Logo</label>
                    <MediaUploader folder="shops" onUpload={(urls) => setLogoUrl(urls[0] || '')} maxFiles={1} allowVideo={false} />
                    {logoUrl && (
                      <div className="relative mt-2 inline-block">
                        <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover border border-[#e4d6c8]" />
                        <button onClick={() => setLogoUrl('')} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Banner</label>
                    <MediaUploader folder="shops" onUpload={(urls) => setBannerUrl(urls[0] || '')} maxFiles={1} allowVideo={false} />
                    {bannerUrl && (
                      <div className="relative mt-2 inline-block w-full">
                        <img src={bannerUrl} alt="Banner" className="h-24 w-full rounded-xl object-cover border border-[#e4d6c8]" />
                        <button onClick={() => setBannerUrl('')} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Shop Location</label>
                    <input type="text" placeholder="e.g. Dhaka, Bangladesh"
                      value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c7564]">Shop Policies</label>
                    <textarea rows={5} placeholder="Returns policy, warranty terms, shipping details..."
                      value={policies} onChange={e => setPolicies(e.target.value)}
                      className="w-full resize-none rounded-xl border border-[#e4d6c8] bg-white px-4 py-2.5 text-sm text-[#221b16] outline-none transition focus:border-[#221b16]" />
                    <p className="text-[10px] text-[#8c7564]">These will be displayed on your public storefront</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#e4d6c8]/60 bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#221b16] mb-4">Review Your Shop</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-[#8c7564]">Name</span><span className="font-medium text-[#221b16]">{name}</span></div>
                      <div className="flex justify-between"><span className="text-[#8c7564]">Category</span><span className="font-medium text-[#221b16]">{categories.find(c => c.id === Number(category))?.name || 'None'}</span></div>
                      <div className="flex justify-between"><span className="text-[#8c7564]">Location</span><span className="font-medium text-[#221b16]">{location || 'Not set'}</span></div>
                      {logoUrl && <div className="flex justify-between"><span className="text-[#8c7564]">Logo</span><img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /></div>}
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex items-center justify-between">
                <button type="button" onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-[#e4d6c8] bg-white px-5 py-2.5 text-xs font-semibold text-[#6c5b4f] hover:bg-[#f9f5f0] transition disabled:opacity-40">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {step < 2 ? (
                  <button type="button" onClick={() => setStep(step + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#221b16] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3a3028] transition">
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={createShopMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-[#221b16] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#3a3028] transition disabled:opacity-50">
                    {createShopMutation.isPending ? 'Creating...' : 'Create Shop'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="hidden lg:block flex-1">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Storefront Preview</p>
              <div className="overflow-hidden rounded-2xl border border-[#e4d6c8]/60 bg-white shadow-sm">
                {/* Banner preview */}
                <div className="h-32 bg-gradient-to-r from-[#e4d6c8] to-[#f9f5f0]">
                  {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="px-5 pb-5">
                  {/* Logo */}
                  <div className="-mt-10 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#e4d6c8] shadow-sm">
                    {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-[#8c7564]" />}
                  </div>
                  <h3 className="font-[Fraunces] text-lg font-bold text-[#221b16]">{name || 'Your Shop Name'}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#8c7564]">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location || 'Location'}</span>
                    <span>0 Products</span>
                    <span>0 Followers</span>
                  </div>
                  {description && <p className="mt-3 text-xs leading-relaxed text-[#6c5b4f] border-t border-[#e4d6c8]/40 pt-3">{description}</p>}
                </div>
              </div>
              <p className="mt-3 text-[10px] text-[#8c7564] text-center">Your storefront design creates the first impression for customers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
