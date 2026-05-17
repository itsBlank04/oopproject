import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../lib/apiClient'

type Auction = {
  id: number; title: string; type: string; status: string;
  startTime: string; endTime: string;
  vendor: { displayName: string } | null
  lots: { id: number; title: string; currentBidBdt: number; startingPriceBdt: number; status: string }[]
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>('ACTIVE')

  useEffect(() => {
    apiClient.get('/api/auctions', { params: { status: tab } })
      .then(r => setAuctions(Array.isArray(r.data) ? r.data : r.data.content || []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false))
  }, [tab])

  const tabs = ['ACTIVE', 'COMPLETED', 'APPROVED', 'CREATED']

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Live Auctions</h1>
        <p className="mt-2 text-sm text-[#8c7564]">Bid on unique items in real-time</p>
        <div className="mt-6 flex gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => { setTab(t); setLoading(true) }}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-[#221b16] text-[#f9f5f0]' : 'border border-[#d7c7b8] text-[#221b16] hover:bg-white'}`}>
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading auctions...</div>
        ) : auctions.length === 0 ? (
          <div className="mt-12 text-center text-[#8c7564]">No {tab.toLowerCase()} auctions found.</div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map(a => (
              <Link key={a.id} to={`/auctions/${a.id}`}
                className="group rounded-2xl border border-[#e4d6c8] bg-white p-5 transition hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                  <span className="rounded-full border border-[#d7c7b8] px-3 py-1 text-xs text-[#8c7564]">{a.type}</span>
                </div>
                <h3 className="mt-4 font-[Fraunces] text-xl text-[#221b16] group-hover:underline">{a.title}</h3>
                <p className="mt-1 text-xs text-[#8c7564]">by {a.vendor?.displayName}</p>
                <div className="mt-4 text-xs text-[#6c5b4f]">
                  <p>{a.lots?.length || 0} lot(s)</p>
                  <p className="mt-1">Ends: {new Date(a.endTime).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
