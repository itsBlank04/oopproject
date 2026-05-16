import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { UsedListing } from '@/types'

interface Badge {
  name: string
  icon: string
  color: string
}

export default function UsedListingDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const { data: listing, isLoading } = useQuery({
    queryKey: ['used-listing', id],
    queryFn: () => api.get<UsedListing>(`/used-listings/${id}`),
    enabled: !!id,
  })

  const { data: sellerBadges } = useQuery({
    queryKey: ['seller-badges', listing?.sellerId],
    queryFn: () => api.get<Badge[]>(`/badges/${listing!.sellerId}`),
    enabled: !!listing?.sellerId,
  })

  const isOwner = !!user && !!listing && user.id === listing.sellerId

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => api.put(`/used-listings/${id}`, data),
    onSuccess: () => {
      toast.success('Listing updated')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['used-listing', id] })
      queryClient.invalidateQueries({ queryKey: ['used-listings'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/used-listings/${id}`),
    onSuccess: () => {
      toast.success('Listing removed')
      queryClient.invalidateQueries({ queryKey: ['used-listings'] })
      navigate('/used')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-ink-400">Listing not found</p>
        <Link to="/used" className="btn btn-secondary mt-4">Back to listings</Link>
      </div>
    )
  }

  const imageUrl = listing.images?.[0]?.url
  const badgeColorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/used" className="text-sm text-teal-600 hover:underline mb-6 inline-block">
        &larr; Back to used listings
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[4/3] bg-cream-100 rounded-xl flex items-center justify-center text-ink-300 text-6xl overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              '↻'
            )}
          </div>
          {/* Image gallery */}
          {listing.images && listing.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {listing.images.slice(1).map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-cream-100">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {editing ? (
            <div className="space-y-4">
              <h1 className="font-display text-3xl text-ink-950">Edit Listing</h1>
              <div>
                <label className="label">Title</label>
                <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div>
                <label className="label">Price (৳)</label>
                <input className="input" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} min="0" step="0.01" />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => updateMutation.mutate({ title: editTitle, description: editDesc || null, priceBdt: Number(editPrice), categoryId: listing.categoryId, conditionId: listing.conditionId, warrantyFlag: listing.warrantyFlag })} disabled={updateMutation.isPending}>
                  Save
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl text-ink-950">{listing.title}</h1>

              {/* Seller info + trust badges */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {listing.sellerName && (
                  <span className="text-sm text-ink-500">Sold by {listing.sellerName}</span>
                )}
                {sellerBadges?.map((b) => {
                  const cls = badgeColorClasses[b.color] || 'bg-gray-50 text-gray-700 border-gray-200'
                  return (
                    <span key={b.name} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
                      {b.icon} {b.name}
                    </span>
                  )
                })}
              </div>

              <p className="mt-3 text-3xl font-bold text-teal-700">৳{Number(listing.priceBdt).toLocaleString()}</p>

              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-100 text-ink-600">{listing.conditionLabel}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listing.warrantyFlag === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {listing.warrantyFlag === 'YES' ? '✓ Warranty' : '✗ No Warranty'}
                </span>
              </div>

              {listing.description && (
                <p className="mt-4 text-ink-600 leading-relaxed">{listing.description}</p>
              )}

              {/* Digital Product Passport */}
              {listing.history && (
                <div className="mt-6 card p-5 border-l-4 border-teal-500">
                  <h3 className="font-display text-sm text-ink-950 uppercase tracking-wider mb-3">📋 Digital Product Passport</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-cream-50">
                      <p className="text-xs text-ink-400 uppercase tracking-wider">Previous Owners</p>
                      <p className="text-lg font-bold text-ink-950">{listing.history.ownerCount}</p>
                    </div>
                    {listing.history.usageDurationMonths != null && (
                      <div className="p-3 rounded-lg bg-cream-50">
                        <p className="text-xs text-ink-400 uppercase tracking-wider">Usage Duration</p>
                        <p className="text-lg font-bold text-ink-950">{listing.history.usageDurationMonths} months</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="mt-6 flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditTitle(listing.title); setEditDesc(listing.description || ''); setEditPrice(String(listing.priceBdt)); setEditing(true) }}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm('Remove this listing?')) deleteMutation.mutate() }} disabled={deleteMutation.isPending}>
                    Remove
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
