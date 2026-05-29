import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order placed!')
      navigate('/account/orders')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Checkout failed'),
  })

  if (!user) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-center"><p className="text-[#6c5b4f]">Sign in to checkout</p><Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link></div>
  }

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.product.priceBdt * i.qty, 0)
  const hasPaidShipping = items.some(i => i.product?.shippingType === 'PAID')
  const shippingFee = hasPaidShipping && shippingOption ? (SHIPPING_INFO[shippingOption]?.fee ?? 0) : 0
  const total = subtotal + shippingFee

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f0eb] mb-4">
          <svg className="h-7 w-7 text-[#b8a494]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="font-semibold text-[#1a1512]">Your cart is empty</p>
        <p className="text-sm text-[#8c7564] mt-1">Add items before checking out</p>
        <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1a1512] px-5 py-2.5 text-sm font-semibold text-[#faf6f2] hover:bg-[#2d241e]">
          Browse products
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf6f2]">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeSlideUp 0.4s ease-out both; }
        .anim-fade-1 { animation-delay: 0.05s; }
        .anim-fade-2 { animation-delay: 0.1s; }
      `}</style>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="anim-fade anim-fade-1">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a1512] shadow-sm">
              <svg className="h-5 w-5 text-[#faf6f2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div>
              <h1 className="font-[Fraunces] text-xl sm:text-2xl font-semibold text-[#1a1512] tracking-tight">Checkout</h1>
              <p className="text-xs text-[#8c7564] mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] anim-fade anim-fade-2">
          <div>
            <h2 className="font-semibold text-[#1a1512]">Shipping Address</h2>
            {addresses && addresses.length > 0 ? (
              <div className="mt-3 space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${selectedAddressId === addr.id ? 'border-[#1a1512] bg-[#faf6f2] ring-1 ring-[#1a1512]/10' : 'border-[#e4d6c8]/60 bg-white hover:border-[#b8a494]'}`}>
                    <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-[#1a1512]" />
                    <div>
                      <p className="text-sm font-semibold text-[#1a1512]">{addr.label} {addr.isDefault && <span className="text-[10px] text-[#8c7564] font-normal">(Default)</span>}</p>
                      <p className="text-xs text-[#6c5b4f] mt-0.5">{addr.fullName} — {addr.phone}</p>
                      <p className="text-xs text-[#8c7564]">{addr.addressLine}, {addr.area}, {addr.city} {addr.postalCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#8c7564]">No addresses yet. Add one below.</p>
            )}
            <button onClick={() => setShowAddressForm(!showAddressForm)} className="mt-3 text-sm font-semibold text-[#1a1512] hover:underline">
              {showAddressForm ? 'Cancel' : '+ Add new address'}
            </button>
            {showAddressForm && (
              <div className="mt-3 space-y-3 rounded-xl bg-white p-4 ring-1 ring-[#e4d6c8]/60">
                {['label', 'fullName', 'phone', 'addressLine', 'city', 'area', 'postalCode'].map((f) => (
                  <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={(addressForm as any)[f]} onChange={(e) => setAddressForm({ ...addressForm, [f]: e.target.value })} className="w-full rounded-lg border border-[#d7c7b8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1a1512] transition-colors" />
                ))}
                <button onClick={() => createAddress.mutate(addressForm)} disabled={createAddress.isPending} className="w-full rounded-xl bg-[#1a1512] py-2.5 text-sm font-semibold text-[#faf6f2] hover:bg-[#2d241e] disabled:opacity-50 transition">
                  {createAddress.isPending ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-[#1a1512]">Order Summary</h2>
            <div className="mt-3 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-[#e4d6c8]/40 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.product?.images?.[0]?.imageUrl ? (
                    <img src={item.product.images[0].imageUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f0eb]">
                      <svg className="h-4 w-4 text-[#a28672]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1512] truncate">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-[#8c7564]">×{item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1a1512] shrink-0">৳{(item.product.priceBdt * item.qty).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
              <div className="border-t border-[#e4d6c8]/40 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-[#6c5b4f]">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                </div>
                {hasPaidShipping && shippingOption && (
                  <div className="flex justify-between text-sm text-[#6c5b4f]">
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
                <div className="flex justify-between font-semibold text-[#1a1512] pt-2 border-t border-[#e4d6c8]/40">
                  <span>Total</span>
                  <span className="font-[Fraunces] text-lg">৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button onClick={() => selectedAddressId && checkout.mutate(selectedAddressId)} disabled={!selectedAddressId || checkout.isPending} className="w-full rounded-xl bg-[#1a1512] py-3 text-sm font-semibold text-[#faf6f2] hover:bg-[#2d241e] disabled:opacity-40 transition active:scale-[0.98]">
                {checkout.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Placing order...
                  </span>
                ) : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
