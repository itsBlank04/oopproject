import { useState, useEffect } from 'react'
import apiClient from '../../lib/apiClient'
import toast from 'react-hot-toast'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', addressLine1: '', addressLine2: '', city: '', district: '', postalCode: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    apiClient.get('/api/addresses')
      .then(r => setAddresses(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.post('/api/addresses', form)
      toast.success('Address added')
      setShowForm(false)
      setForm({ label: '', addressLine1: '', addressLine2: '', city: '', district: '', postalCode: '', phone: '' })
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await apiClient.delete(`/api/addresses/${id}`)
      setAddresses(addresses.filter(a => a.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }

  const setDefault = async (id: number) => {
    try {
      await apiClient.put(`/api/addresses/${id}/default`)
      toast.success('Set as default')
      load()
    } catch { toast.error('Failed') }
  }

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
            <button onClick={save} disabled={saving} className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        )}
        {loading ? (
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
                    {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-xs text-[#221b16] hover:underline">Set Default</button>}
                    <button onClick={() => remove(a.id)} className="text-xs text-red-600 hover:underline">Delete</button>
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
