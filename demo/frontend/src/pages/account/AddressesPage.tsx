import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

export default function AddressesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', addressLine1: '', addressLine2: '', city: '', district: '', postalCode: '', phone: '' })

  const { data: addresses = [], isLoading } = useQuery<any[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/api/addresses').then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 120_000,
    placeholderData: (prev) => prev ?? [],
  })

  const saveMutation = useMutation({
    mutationFn: () => apiClient.post('/api/addresses', form),
    onSuccess: () => {
      toast.success('Address added')
      setShowForm(false)
      setForm({ label: '', addressLine1: '', addressLine2: '', city: '', district: '', postalCode: '', phone: '' })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/addresses/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['addresses'] })
      const prev = queryClient.getQueryData<any[]>(['addresses'])
      if (prev) queryClient.setQueryData(['addresses'], prev.filter(a => a.id !== id))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['addresses'], ctx.prev)
      toast.error('Failed')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
    onSuccess: () => toast.success('Deleted'),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => apiClient.put(`/api/addresses/${id}/default`),
    onSuccess: () => {
      toast.success('Set as default')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">My Addresses</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-[#221b16] px-5 py-2.5 text-sm font-semibold text-[#f9f5f0]">
            {showForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>
        {showForm && (
          <div className="mt-6 space-y-3 rounded-2xl border border-[#e4d6c8] bg-white p-6">
            {(['label', 'addressLine1', 'addressLine2', 'city', 'district', 'postalCode', 'phone'] as const).map(k => (
              <input key={k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                placeholder={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                className="w-full rounded-xl border border-[#d7c7b8] px-4 py-2.5 text-sm outline-none focus:border-[#221b16]" />
            ))}
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
              {saveMutation.isPending ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : addresses.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">No addresses yet</div>
        ) : (
          <div className="mt-8 space-y-4">
            {addresses.map((a: any) => (
              <div key={a.id} className="rounded-2xl border border-[#e4d6c8] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#221b16]">{a.label} {a.isDefault && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Default</span>}</p>
                    <p className="mt-1 text-sm text-[#6c5b4f]">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                    <p className="text-sm text-[#6c5b4f]">{a.city}, {a.district} {a.postalCode}</p>
                    {a.phone && <p className="text-sm text-[#8c7564]">📞 {a.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    {!a.isDefault && <button onClick={() => setDefaultMutation.mutate(a.id)} className="text-xs text-[#221b16] hover:underline">Set Default</button>}
                    <button onClick={() => removeMutation.mutate(a.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
