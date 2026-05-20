import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

type CartItem = {
  id: number
  product: { id: number; name: string; priceBdt: number; images: { imageUrl: string }[] }
  qty: number
}

type Cart = {
  id: number
  items: CartItem[]
}

export default function CartPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/api/cart').then((r) => r.data),
    enabled: !!user,
  })

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) =>
      apiClient.put(`/api/cart/items/${id}`, { qty }),
    onMutate: async ({ id, qty }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData<Cart>(['cart'])
      if (previousCart) {
        queryClient.setQueryData<Cart>(['cart'], {
          ...previousCart,
          items: previousCart.items.map((item) =>
            item.id === id ? { ...item, qty } : item
          ),
        })
      }
      return { previousCart }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
        toast.error('Failed to update quantity')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const removeItem = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/cart/items/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData<Cart>(['cart'])
      if (previousCart) {
        queryClient.setQueryData<Cart>(['cart'], {
          ...previousCart,
          items: previousCart.items.filter((item) => item.id !== id),
        })
      }
      return { previousCart }
    },
    onError: (_err, id, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
      toast.error('Failed to remove item')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Your Cart</h1>
        <p className="mt-4 text-[#6c5b4f]">Sign in to view your cart</p>
        <Link to="/auth/login" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Sign in</Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-20"><div className="h-64 animate-pulse rounded-2xl bg-[#e4d6c8]" /></div>
  }

  const items = cart?.items ?? []
  const total = items.reduce((sum, i) => sum + i.product.priceBdt * i.qty, 0)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-[#6c5b4f]">Your cart is empty</p>
          <Link to="/products" className="mt-4 inline-block rounded-full bg-[#221b16] px-6 py-3 text-sm font-semibold text-[#f9f5f0]">Browse products</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-[#e4d6c8] bg-white p-4">
              {item.product.images[0] ? (
                <img src={item.product.images[0].imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#f9f5f0] text-xs text-[#a28672]">No img</div>
              )}
              <div className="flex-1">
                <Link to={`/products/${item.product.id}`} className="font-semibold text-[#221b16] hover:underline">{item.product.name}</Link>
                <p className="text-sm text-[#6c5b4f]">৳{item.product.priceBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty.mutate({ id: item.id, qty: Math.max(1, item.qty - 1) })} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7c7b8] text-sm">-</button>
                <span className="w-8 text-center text-sm">{item.qty}</span>
                <button onClick={() => updateQty.mutate({ id: item.id, qty: item.qty + 1 })} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7c7b8] text-sm">+</button>
              </div>
              <p className="w-24 text-right font-semibold">৳{(item.product.priceBdt * item.qty).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
              <button onClick={() => removeItem.mutate(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
            </div>
          ))}
          <div className="rounded-2xl border border-[#e4d6c8] bg-white p-6">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-[Fraunces] text-2xl">৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="mt-4 w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0]">Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  )
}
