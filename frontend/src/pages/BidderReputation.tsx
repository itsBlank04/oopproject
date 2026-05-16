import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

interface BidderReputation {
  id: number
  winRate: number
  totalBids: number
  totalWins: number
  paymentSuccessRate: number
  cancellationRate: number
}

export default function BidderReputation() {
  const [userId, setUserId] = useState('')

  const { data: rep, isLoading } = useQuery({
    queryKey: ['bidder-reputation', userId],
    queryFn: () => api.get<BidderReputation>(`/bidder-reputation/${userId}`),
    enabled: !!userId,
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Bidder Reputation</h1>
      <div className="card p-6 space-y-4">
        <div>
          <label className="label">User ID</label>
          <input className="input" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter user ID" />
        </div>
        {isLoading && <p className="text-sm text-ink-400">Loading...</p>}
        {rep && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-cream-50">
              <p className="text-xs text-ink-500 uppercase tracking-wider">Win Rate</p>
              <p className="text-xl font-bold text-ink-950">{rep.winRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-cream-50">
              <p className="text-xs text-ink-500 uppercase tracking-wider">Total Bids</p>
              <p className="text-xl font-bold text-ink-950">{rep.totalBids}</p>
            </div>
            <div className="p-3 rounded-lg bg-cream-50">
              <p className="text-xs text-ink-500 uppercase tracking-wider">Total Wins</p>
              <p className="text-xl font-bold text-ink-950">{rep.totalWins}</p>
            </div>
            <div className="p-3 rounded-lg bg-cream-50">
              <p className="text-xs text-ink-500 uppercase tracking-wider">Payment Success</p>
              <p className="text-xl font-bold text-ink-950">{rep.paymentSuccessRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-cream-50">
              <p className="text-xs text-ink-500 uppercase tracking-wider">Cancellation Rate</p>
              <p className="text-xl font-bold text-ink-950">{rep.cancellationRate}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
