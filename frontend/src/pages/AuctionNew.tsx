import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

export default function AuctionNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('STANDARD')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reservePriceBdt, setReservePriceBdt] = useState('')
  const [lotTitle, setLotTitle] = useState('')
  const [lotDesc, setLotDesc] = useState('')
  const [lotPrice, setLotPrice] = useState('')

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/auctions', data),
    onSuccess: () => {
      toast.success('Auction created! Awaiting admin approval.')
      navigate('/auctions')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const fmtLocal = (s: string) => {
    const d = new Date(s)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error('End time must be after start time')
      return
    }
    mutation.mutate({
      title,
      type,
      startTime: fmtLocal(startTime),
      endTime: fmtLocal(endTime),
      reservePriceBdt: reservePriceBdt ? Number(reservePriceBdt) : null,
      lots: [{
        title: lotTitle,
        description: lotDesc || null,
        startingPriceBdt: Number(lotPrice),
        imageUrls: [],
      }],
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-2xl text-ink-950 mb-8">New Auction</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Auction Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="STANDARD">Standard</option>
            <option value="FLASH">Flash</option>
            <option value="REVERSE">Reverse</option>
            <option value="RESERVE">Reserve Price</option>
          </select>
        </div>
        <div>
          <label className="label">Start Time</label>
          <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div>
          <label className="label">End Time</label>
          <input className="input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
        <div>
          <label className="label">Reserve Price (৳, optional)</label>
          <input className="input" type="number" value={reservePriceBdt} onChange={(e) => setReservePriceBdt(e.target.value)} min="0" />
        </div>

        <hr className="border-cream-200" />
        <p className="font-medium text-ink-950">First Lot</p>
        <div>
          <label className="label">Lot Title</label>
          <input className="input" value={lotTitle} onChange={(e) => setLotTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[60px]" value={lotDesc} onChange={(e) => setLotDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Starting Price (৳)</label>
          <input className="input" type="number" value={lotPrice} onChange={(e) => setLotPrice(e.target.value)} required min="0" />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Auction'}
        </button>
      </form>
    </div>
  )
}
