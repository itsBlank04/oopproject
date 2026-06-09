import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { Star, MessageSquare, Calendar, Filter } from 'lucide-react'

type Review = {
  id: number
  rating: number
  comment: string
  createdAt: string
  reviewer: { id: number; displayName: string; avatarUrl?: string }
  product?: { id: number; name: string }
}

export default function VendorReviewsPage() {
  const { user, hasRole } = useAuth()
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['vendor-reviews', user?.id],
    queryFn: () => apiClient.get(`/api/users/${user?.id}/reviews`).then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: trustScore } = useQuery<any>({
    queryKey: ['vendor-trust'],
    queryFn: () => apiClient.get('/api/vendor/trust-score').then(r => r.data),
    enabled: hasRole('VENDOR'),
  })

  const filteredReviews = ratingFilter
    ? reviews.filter(r => r.rating === ratingFilter)
    : reviews

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  if (!user || !hasRole('VENDOR')) return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6f2]">
      <p className="text-sm text-[#8c7564]">Vendor access required.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf6f2] py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="font-[Fraunces] text-4xl font-bold text-[#1a1512]">Reviews & Reputation</h1>
          <p className="text-sm text-[#8c7564] mt-2">Monitor customer feedback across all your shops.</p>
        </div>

        {/* Reputation Summary */}
        <div className="mb-10 grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564] mb-2">Average Rating</p>
            <p className="font-[Fraunces] text-5xl font-bold text-[#1a1512]">{avgRating}</p>
            <div className="mt-2 flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${Number(avgRating) >= s ? 'fill-amber-400 text-amber-400' : 'text-[#e4d6c8]'}`} />
              ))}
            </div>
            <p className="mt-1 text-[10px] text-[#8c7564]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            {trustScore && (
              <div className="mt-4 rounded-xl bg-[#fcfbfa] border border-[#e4d6c8]/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c7564]">Trust Score</p>
                <p className={`font-[Fraunces] text-xl font-bold ${Number(trustScore.score) >= 70 ? 'text-emerald-600' : Number(trustScore.score) >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {trustScore.score}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1a1512] mb-4">Rating Distribution</h3>
            <div className="space-y-2.5">
              {distribution.map(d => (
                <div key={d.star} className="flex items-center gap-3 text-xs">
                  <span className="flex w-6 items-center gap-1 font-semibold text-[#6c5b4f]">
                    {d.star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2.5 flex-1 rounded-full bg-[#e4d6c8]/30 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[10px] text-[#8c7564]">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter & List */}
        <div className="rounded-2xl border border-[#e4d6c8]/60 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e4d6c8]/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#8c7564]" />
              <h2 className="font-[Fraunces] text-lg font-bold text-[#1a1512]">All Reviews</h2>
              <span className="rounded-full bg-[#e4d6c8]/30 px-2 py-0.5 text-[10px] font-semibold text-[#6c5b4f]">{filteredReviews.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#8c7564]" />
              {[null, 5, 4, 3, 2, 1].map(s => (
                <button key={s ?? 'all'} onClick={() => setRatingFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${ratingFilter === s ? 'bg-[#1a1512] text-white' : 'text-[#8c7564] hover:bg-[#f9f5f0]'}`}>
                  {s ?? 'All'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-[10px] text-[#8c7564]">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-[10px] text-[#8c7564]">No reviews yet.</div>
          ) : (
            <div className="divide-y divide-[#e4d6c8]/20">
              {filteredReviews.map(r => (
                <div key={r.id} className="px-6 py-5 hover:bg-[#fcfbfa] transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e4d6c8] text-xs font-bold text-[#6c5b4f]">
                        {r.reviewer?.displayName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1a1512]">{r.reviewer?.displayName || 'Anonymous'}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-[#e4d6c8]'}`} />
                            ))}
                          </div>
                        </div>
                        {r.product && (
                          <p className="mt-0.5 text-[10px] text-[#8c7564]">on <span className="font-semibold">{r.product.name}</span></p>
                        )}
                        {r.comment && <p className="mt-2 text-xs text-[#6c5b4f] leading-relaxed">{r.comment}</p>}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#8c7564] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString('en-BD')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
