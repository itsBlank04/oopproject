import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import ImageLightbox from '../../components/ImageLightbox'
import toast from 'react-hot-toast'

type PaymentMethod = 'BKASH' | 'NAGAD' | 'CARD'

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { key: 'BKASH', label: 'bKash', icon: '📱', desc: 'Pay with bKash mobile banking' },
  { key: 'NAGAD', label: 'Nagad', icon: '💳', desc: 'Pay with Nagad mobile banking' },
  { key: 'CARD', label: 'Card', icon: '💳', desc: 'Credit / Debit card payment' },
]

type CartItem = {
  id: number
  product: { id: number; name: string; priceBdt: number; shippingType: string; images: { imageUrl: string }[] }
  qty: number
}

type Cart = { id: number; status: string; items: CartItem[] }

const SHIPPING_INFO: Record<string, { label: string; fee: number }> = {
  INSIDE_DHAKA: { label: 'Inside Dhaka', fee: 60 },
  OUTSIDE_DHAKA: { label: 'Outside Dhaka', fee: 100 },
}

type Address = {
  id: number
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  area: string
  postalCode: string
  isDefault: boolean
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shippingOption = searchParams.get('shipping')
  const queryClient = useQueryClient()
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({ label: '', fullName: '', phone: '', addressLine: '', city: '', area: '', postalCode: '' })
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [step, setStep] = useState<'choice' | 'payment' | null>(null)

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/api/cart').then((r) => r.data),
    enabled: !!user,
    placeholderData: (prev) => prev,
  })

  const { data: addresses, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/api/addresses').then((r) => r.data),
    enabled: !!user,
    placeholderData: (prev) => prev,
  })

  // Auto-select default or first address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
      setSelectedAddressId(defaultAddr.id)
    }
  }, [addresses, selectedAddressId])

  const createAddress = useMutation({
    mutationFn: (addr: typeof addressForm) => apiClient.post('/api/addresses', addr),
    onSuccess: () => {
      refetchAddresses()
      setShowAddressForm(false)
      setAddressForm({ label: '', fullName: '', phone: '', addressLine: '', city: '', area: '', postalCode: '' })
      toast.success('Address saved')
    },
  })

  const checkout = useMutation({
    mutationFn: (addressId: number) => {
      const payload: Record<string, any> = { shippingAddressId: addressId }
      if (shippingOption) payload.shippingOption = shippingOption
      return apiClient.post('/api/orders', payload)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setPlacedOrderId(res.data?.id)
      setStep('choice')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Checkout failed'),
  })

  const processPayment = async () => {
    if (!placedOrderId || !paymentMethod) return
    setProcessingPayment(true)
    try {
      await apiClient.post(`/api/payments/order/${placedOrderId}`, { method: paymentMethod })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(`Payment via ${paymentMethod} successful!`)
      setPlacedOrderId(null)
      setStep(null)
      setPaymentMethod(null)
      navigate(`/order-success/${placedOrderId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  const confirmCod = async () => {
    if (!placedOrderId) return
    setProcessingPayment(true)
    try {
      await apiClient.post(`/api/payments/order/${placedOrderId}`, { method: 'COD' })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order confirmed with Cash on Delivery!')
      setPlacedOrderId(null)
      setStep(null)
      navigate(`/order-success/${placedOrderId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm order')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (!user) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-center"><p className="text-[#64748b]">Sign in to checkout</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#1e293b] px-6 py-3 text-sm font-semibold text-[#f8fafc]">Sign in</Link></div>
  }

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.product.priceBdt * i.qty, 0)
  const hasPaidShipping = items.some(i => i.product?.shippingType === 'PAID')
  const shippingFee = hasPaidShipping && shippingOption ? (SHIPPING_INFO[shippingOption]?.fee ?? 0) : 0
  const total = subtotal + shippingFee
  const needsShippingOption = hasPaidShipping && !shippingOption
  const hasAddresses = addresses && addresses.length > 0
  const canPlace = !!selectedAddressId && !needsShippingOption

  let buttonLabel: string
  let buttonHint: string
  if (checkout.isPending) {
    buttonLabel = 'Placing order...'
    buttonHint = ''
  } else if (needsShippingOption) {
    buttonLabel = 'Select shipping option'
    buttonHint = 'Choose Inside Dhaka or Outside Dhaka shipping to continue'
  } else if (!hasAddresses) {
    buttonLabel = 'Add a shipping address'
    buttonHint = 'You need a shipping address before placing an order'
  } else if (!selectedAddressId) {
    buttonLabel = 'Select a shipping address'
    buttonHint = 'Choose one of your saved addresses to continue'
  } else {
    buttonLabel = 'Place Order'
    buttonHint = ''
  }

  const mainContent = items.length === 0 ? (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8fafc] mb-4">
        <svg className="h-7 w-7 text-[#cbd5e1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <p className="font-semibold text-[#1e293b]">Your cart is empty</p>
      <p className="text-sm text-[#94A3B8] mt-1">Add items before checking out</p>
      <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1e293b] px-5 py-2.5 text-sm font-semibold text-[#f8fafc] hover:bg-[#334155]">
        Browse products
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </Link>
    </div>
  ) : (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="anim-fade anim-fade-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e293b] shadow-sm">
            <svg className="h-5 w-5 text-[#f8fafc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div>
            <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#1e293b] tracking-tight">Checkout</h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] anim-fade anim-fade-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[#1e293b]">Shipping Address</h2>
            {!selectedAddressId && hasAddresses && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Required
              </span>
            )}
            {!hasAddresses && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Required
              </span>
            )}
          </div>
          {addresses && addresses.length > 0 ? (
            <div className="mt-3 space-y-3">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${selectedAddressId === addr.id ? 'border-[#1e293b] bg-[#f8fafc] ring-1 ring-[#1e293b]/10' : 'border-[#e0e7ff]/60 bg-white hover:border-[#cbd5e1]'}`}>
                  <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-[#1e293b]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b]">{addr.label} {addr.isDefault && <span className="text-[10px] text-[#94A3B8] font-normal">(Default)</span>}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{addr.fullName} — {addr.phone}</p>
                    <p className="text-xs text-[#94A3B8]">{addr.addressLine}, {addr.area}, {addr.city} {addr.postalCode}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#94A3B8]">No addresses yet. Add one below.</p>
          )}
          <button onClick={() => setShowAddressForm(!showAddressForm)} className="mt-3 text-sm font-semibold text-[#1e293b] hover:underline">
            {showAddressForm ? 'Cancel' : '+ Add new address'}
          </button>
          {showAddressForm && (
            <div className="mt-3 space-y-3 rounded-xl bg-white p-4 ring-1 ring-[#e0e7ff]/60">
              {['label', 'fullName', 'phone', 'addressLine', 'city', 'area', 'postalCode'].map((f) => (
                <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={(addressForm as any)[f]} onChange={(e) => setAddressForm({ ...addressForm, [f]: e.target.value })} className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none focus:border-[#1e293b] transition-colors" />
              ))}
              <button onClick={() => createAddress.mutate(addressForm)} disabled={createAddress.isPending} className="w-full rounded-xl bg-[#1e293b] py-2.5 text-sm font-semibold text-[#f8fafc] hover:bg-[#334155] disabled:opacity-50 transition">
                {createAddress.isPending ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-[#1e293b]">Order Summary</h2>
          <div className="mt-3 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-[#e0e7ff]/40 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <button type="button" onClick={() => { const u = item.product?.images?.[0]?.imageUrl; if (u) setLightboxUrl(u) }}>
                  {item.product?.images?.[0]?.imageUrl ? (
                    <img src={item.product.images[0].imageUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                      <svg className="h-4 w-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1e293b] truncate">{item.product?.name || 'Product'}</p>
                  <p className="text-xs text-[#94A3B8]">×{item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#1e293b] shrink-0">৳{(item.product.priceBdt * item.qty).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
            <div className="border-t border-[#e0e7ff]/40 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-[#64748b]">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
              {hasPaidShipping && shippingOption && (
                <div className="flex justify-between text-sm text-[#64748b]">
                  <span>Shipping ({SHIPPING_INFO[shippingOption]?.label})</span>
                  <span>৳{shippingFee.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {!hasPaidShipping && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[#1e293b] pt-2 border-t border-[#e0e7ff]/40">
                <span>Total</span>
                <span className="font-[Fraunces] text-lg">৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button onClick={() => canPlace && checkout.mutate(selectedAddressId!)} disabled={!canPlace || checkout.isPending}
              className={`w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98] ${
                canPlace && !checkout.isPending
                  ? 'bg-[#1e293b] text-[#f8fafc] hover:bg-[#334155]'
                  : 'bg-[#e0e7ff] text-[#94A3B8] cursor-not-allowed'
              }`}>
              {checkout.isPending ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Placing order...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  {!canPlace && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  )}
                  {buttonLabel}
                </span>
              )}
            </button>
            {buttonHint && (
              <p className="mt-2 text-center text-xs text-[#94A3B8]">{buttonHint}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeSlideUp 0.4s ease-out both; }
        .anim-fade-1 { animation-delay: 0.05s; }
        .anim-fade-2 { animation-delay: 0.1s; }
      `}</style>
      {mainContent}
      {/* Payment choice overlay */}
      {step === 'choice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <div className="px-6 py-5 text-center border-b border-[#e0e7ff]/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-semibold text-[#1e293b] text-lg">Order placed!</h2>
              <p className="text-sm text-[#64748b] mt-1">Order #{placedOrderId} has been placed successfully</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm font-medium text-[#1e293b]">Choose payment method</p>
              <button onClick={() => setStep('payment')}
                className="w-full flex items-center gap-4 rounded-xl border-2 border-[#1e293b] bg-[#f8fafc] p-4 text-left transition-all hover:bg-[#eef2ff]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e293b]">
                  <svg className="h-5 w-5 text-[#f8fafc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1e293b]">Pay Now</p>
                  <p className="text-xs text-[#94A3B8]">Pay with bKash, Nagad, or Card</p>
                </div>
                <svg className="h-5 w-5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button onClick={confirmCod} disabled={processingPayment}
                className="w-full flex items-center gap-4 rounded-xl border-2 border-[#e0e7ff]/60 bg-white p-4 text-left transition-all hover:border-[#cbd5e1] disabled:opacity-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8fafc]">
                  <svg className="h-5 w-5 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1e293b]">Cash on Delivery</p>
                  <p className="text-xs text-[#94A3B8]">Pay when you receive your order</p>
                </div>
                {processingPayment ? (
                  <svg className="h-5 w-5 animate-spin text-[#94A3B8]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment method selection overlay */}
      {step === 'payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setStep('choice'); setPaymentMethod(null) }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e0e7ff]/40 px-6 py-4">
              <h2 className="font-semibold text-[#1e293b]">Select Payment Method</h2>
              <button onClick={() => { setStep('choice'); setPaymentMethod(null) }} className="text-[#94A3B8] hover:text-[#1e293b]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 px-6 py-4">
              {PAYMENT_METHODS.map(m => (
                <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                  className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === m.key
                      ? 'border-[#1e293b] bg-[#f8fafc]'
                      : 'border-[#e0e7ff]/60 hover:border-[#cbd5e1]'
                  }`}>
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1e293b]">{m.label}</p>
                    <p className="text-xs text-[#94A3B8]">{m.desc}</p>
                  </div>
                  {paymentMethod === m.key && (
                    <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-[#e0e7ff]/40 px-6 py-4">
              <button onClick={() => { setStep('choice'); setPaymentMethod(null) }}
                className="flex-1 rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                Back
              </button>
              <button onClick={processPayment} disabled={!paymentMethod || processingPayment}
                className="flex-1 rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-[#f8fafc] transition hover:bg-[#334155] disabled:opacity-40">
                {processingPayment ? (
                  <span className="inline-flex items-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</span>
                ) : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <ImageLightbox
          images={[{ url: lightboxUrl }]}
          initialIndex={0}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  )
}
