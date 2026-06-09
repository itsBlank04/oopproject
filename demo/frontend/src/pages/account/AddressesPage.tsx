import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

const labelIcons: Record<string, string> = {
  Home: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  Office: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  Other: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
}

function getLabelIcon(label: string) {
  const key = Object.keys(labelIcons).find(k => label.toLowerCase().includes(k.toLowerCase()))
  return labelIcons[key || 'Other']
}

export default function AddressesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', fullName: '', phone: '', addressLine: '', city: '', area: '', postalCode: '' })

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
      setForm({ label: '', fullName: '', phone: '', addressLine: '', city: '', area: '', postalCode: '' })
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['addresses'] })
      const prev = queryClient.getQueryData<any[]>(['addresses'])
      if (prev) {
        queryClient.setQueryData(['addresses'], prev.map(a => ({
          ...a, isDefault: a.id === id
        })))
      }
      return { prev }
    },
    onSuccess: () => toast.success('Default address updated'),
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['addresses'], ctx.prev)
      toast.error('Failed')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const defaultAddress = addresses.find((a: any) => a.isDefault)
  const otherAddresses = addresses.filter((a: any) => !a.isDefault)

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Account</p>
            <h1 className="font-[Fraunces] text-3xl text-[#1e293b]">Addresses</h1>
            <p className="mt-1 text-sm text-[#94A3B8]">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} on file</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              showForm
                ? 'border border-[#cbd5e1] bg-white text-[#1e293b]'
                : 'bg-[#1e293b] text-[#f8fafc] hover:bg-[#4338ca]'
            }`}
          >
            {showForm ? (
              <>Cancel</>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Add Address
              </>
            )}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-2xl border border-[#e0e7ff] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#1e293b]">New Address</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Add a delivery or service address to your account.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {([
                { key: 'label', label: 'Label (Home, Office)', placeholder: 'Home', sm: 'col-span-2' },
                { key: 'fullName', label: 'Full Name', placeholder: 'Your name', sm: 'col-span-2' },
                { key: 'phone', label: 'Phone Number', placeholder: '01XXXXXXXXX', sm: '' },
                { key: 'postalCode', label: 'Postal Code', placeholder: '1205', sm: '' },
                { key: 'addressLine', label: 'Street Address', placeholder: 'House, road, area', sm: 'col-span-2' },
                { key: 'city', label: 'City', placeholder: 'Dhaka', sm: '' },
                { key: 'area', label: 'Area / District', placeholder: 'Dhanmondi', sm: '' },
              ] as const).map(field => (
                <div key={field.key} className={field.sm}>
                  <label className="text-xs font-semibold text-[#1e293b]">{field.label}</label>
                  <input
                    value={form[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5 text-sm outline-none transition focus:border-[#1e293b] focus:bg-white"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[#94A3B8]">This address will be available for checkout and service requests.</p>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="rounded-xl bg-[#1e293b] px-6 py-2.5 text-sm font-semibold text-[#f8fafc] transition hover:bg-[#4338ca] disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-16 text-center text-sm text-[#94A3B8]">Loading addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-[#94A3B8]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <p className="mt-4 font-semibold text-[#1e293b]">No addresses yet</p>
            <p className="mt-1 text-sm text-[#94A3B8]">Add one to get started with faster checkout.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {defaultAddress && (
              <div className="overflow-hidden rounded-2xl border border-[#e0e7ff] bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
                <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-emerald-50/60 px-5 py-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                    <svg viewBox="0 0 16 16" fill="white" className="h-3 w-3">
                      <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Default</span>
                  <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-50/40 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e293b] shadow-inner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-[#f8fafc]">
                          <path strokeLinecap="round" strokeLinejoin="round" d={getLabelIcon(defaultAddress.label)} />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <p className="text-base font-semibold text-[#1e293b]">{defaultAddress.label || 'Address'}</p>
                          <span className="hidden rounded-full bg-[#1e293b]/5 px-2 py-0.5 text-[10px] font-medium text-[#1e293b] sm:inline">Primary</span>
                        </div>
                        {defaultAddress.fullName && <p className="mt-0.5 text-sm font-medium text-[#64748b]">{defaultAddress.fullName}</p>}
                        <div className="mt-2 space-y-0.5">
                          <p className="text-sm leading-relaxed text-[#64748b]">{defaultAddress.addressLine}</p>
                          {(defaultAddress.city || defaultAddress.area || defaultAddress.postalCode) && (
                            <p className="text-sm leading-relaxed text-[#64748b]">
                              {[defaultAddress.city, defaultAddress.area, defaultAddress.postalCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {defaultAddress.phone && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#94A3B8]">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                              </svg>
                              {defaultAddress.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      <button
                        onClick={() => removeMutation.mutate(defaultAddress.id)}
                        className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-500 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:shadow"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-400 transition group-hover/btn:text-red-500">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.53l.67 2.68.67-2.68a.75.75 0 0 1 1.44.422l-1.12 4.48a.75.75 0 0 1-1.44 0l-1.12-4.48a.75.75 0 0 1 .7-.952Z" clipRule="evenodd" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {otherAddresses.map((a: any) => (
              <div key={a.id} className="group/card overflow-hidden rounded-2xl border border-[#e0e7ff] bg-white transition hover:border-[#cbd5e1] hover:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.1)]">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-[#94A3B8]">
                          <path strokeLinecap="round" strokeLinejoin="round" d={getLabelIcon(a.label)} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#1e293b]">{a.label}</p>
                        {a.fullName && <p className="mt-0.5 text-sm font-medium text-[#64748b]">{a.fullName}</p>}
                        <div className="mt-2 space-y-0.5">
                          <p className="text-sm leading-relaxed text-[#64748b]">{a.addressLine}</p>
                          {(a.city || a.area || a.postalCode) && (
                            <p className="text-sm leading-relaxed text-[#64748b]">
                              {[a.city, a.area, a.postalCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {a.phone && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#94A3B8]">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                              </svg>
                              {a.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 opacity-0 transition group-hover/card:opacity-100">
                      <button
                        onClick={() => setDefaultMutation.mutate(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e0e7ff] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#64748b] shadow-sm transition hover:border-[#1e293b] hover:text-[#1e293b] hover:shadow"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 1 .216 1.082l-4.5 6a.75.75 0 0 1-1.079.262l-2.25-1.5a.75.75 0 1 1 .832-1.248l1.654 1.102 4.044-5.392a.75.75 0 0 1 1.083-.306Z" clipRule="evenodd" />
                        </svg>
                        Set Default
                      </button>
                      <button
                        onClick={() => removeMutation.mutate(a.id)}
                        className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-white px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.53l.67 2.68.67-2.68a.75.75 0 0 1 1.44.422l-1.12 4.48a.75.75 0 0 1-1.44 0l-1.12-4.48a.75.75 0 0 1 .7-.952Z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </div>
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
