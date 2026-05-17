import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

type CartItem = {
  id: number
  product: { id: number; name: string; priceBdt: number; images: { imageUrl: string }[] }
  qty: number
}

type Cart = { id: number; items: CartItem[] }

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
  const queryClient = useQueryClient()
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({ label: '', fullName: '', phone: '', addressLine: '', city: '', area: '', postalCode: '' })

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/api/cart').then((r) => r.data),
    enabled: !!user,
  })

  const { data: addresses, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/api/addresses').then((r) => r.data),
    enabled: !!user,
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
    mutationFn: (addressId: number) => apiClient.post('/api/orders', { shippingAddressId: addressId }),
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
  const total = items.reduce((sum, i) => sum + i.product.priceBdt * i.qty, 0)

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="font-[Fraunces] text-xl text-[#221b16]">Shipping Address</h2>
          {addresses && addresses.length > 0 ? (
            <div className="mt-4 space-y-3">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selectedAddressId === addr.id ? 'border-[#221b16] bg-[#f9f5f0]' : 'border-[#e4d6c8] bg-white'}`}>
                  <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1" />
                  <div>
                    <p className="font-semibold text-[#221b16]">{addr.label} {addr.isDefault && <span className="text-xs text-[#a28672]">(Default)</span>}</p>
                    <p className="text-sm text-[#6c5b4f]">{addr.fullName} — {addr.phone}</p>
                    <p className="text-sm text-[#6c5b4f]">{addr.addressLine}, {addr.area}, {addr.city} {addr.postalCode}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#6c5b4f]">No addresses yet</p>
          )}
          <button onClick={() => setShowAddressForm(!showAddressForm)} className="mt-4 text-sm font-semibold text-[#221b16] underline">
            {showAddressForm ? 'Cancel' : '+ Add new address'}
          </button>
          {showAddressForm && (
            <div className="mt-4 space-y-3 rounded-xl border border-[#e4d6c8] bg-white p-4">
              {['label', 'fullName', 'phone', 'addressLine', 'city', 'area', 'postalCode'].map((f) => (
                <input key={f} placeholder={f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={(addressForm as any)[f]} onChange={(e) => setAddressForm({ ...addressForm, [f]: e.target.value })} className="w-full rounded-lg border border-[#d7c7b8] bg-white px-3 py-2 text-sm outline-none focus:border-[#221b16]" />
              ))}
              <button onClick={() => createAddress.mutate(addressForm)} disabled={createAddress.isPending} className="w-full rounded-lg bg-[#221b16] py-2 text-sm font-semibold text-[#f9f5f0] disabled:opacity-50">Save Address</button>
            </div>
          )}
        </div>
        <div>
          <h2 className="font-[Fraunces] text-xl text-[#221b16]">Order Summary</h2>
          <div className="mt-4 space-y-3 rounded-xl border border-[#e4d6c8] bg-white p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-[#6c5b4f]">{item.product.name} × {item.qty}</span>
                <span>৳{(item.product.priceBdt * item.qty).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="border-t border-[#e4d6c8] pt-3">
              <div className="flex items-center justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="font-[Fraunces]">৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button onClick={() => selectedAddressId && checkout.mutate(selectedAddressId)} disabled={!selectedAddressId || checkout.isPending} className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
              {checkout.isPending ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
