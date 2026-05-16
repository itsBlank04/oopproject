import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface PendingAuction {
  id: number
  title: string
  vendorName: string
  type: string
  startTime: string
  endTime: string
}

interface AdminAuction {
  id: number
  title: string
  vendorName: string
  type: string
  status: string
  startTime: string
  endTime: string
}

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-600',
  PREPARING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  EXTENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-purple-100 text-purple-700',
}

export default function AdminAuctions() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'pending' | 'all'>('pending')

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-auctions-pending'],
    queryFn: () => api.get<PendingAuction[]>('/admin/auctions/pending'),
  })

  const { data: allAuctions, isLoading: allLoading } = useQuery({
    queryKey: ['admin-auctions-all'],
    queryFn: () => api.get<AdminAuction[]>('/admin/auctions/all'),
    enabled: tab === 'all',
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-auctions-pending'] })
    queryClient.invalidateQueries({ queryKey: ['admin-auctions-all'] })
  }

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/admin/auctions/${id}/approve`),
    onSuccess: () => { invalidateAll(); toast.success('Auction approved → PREPARING') },
    onError: () => toast.error('Failed to approve auction'),
  })

  const reject = useMutation({
    mutationFn: (id: number) => {
      if (!window.confirm('Reject this auction?')) return Promise.reject(new Error('cancelled'))
      return api.post(`/admin/auctions/${id}/reject`)
    },
    onSuccess: () => { invalidateAll(); toast.success('Auction rejected') },
    onError: (err) => { if (err.message !== 'cancelled') toast.error('Failed to reject auction') },
  })

  const activate = useMutation({
    mutationFn: (id: number) => api.post(`/admin/auctions/${id}/activate`),
    onSuccess: () => { invalidateAll(); toast.success('Auction activated → ACTIVE') },
    onError: () => toast.error('Auction must be in PREPARING status'),
  })

  const close = useMutation({
    mutationFn: (id: number) => api.post(`/admin/auctions/${id}/close`),
    onSuccess: () => { invalidateAll(); toast.success('Auction closed') },
    onError: () => toast.error('Auction must be ACTIVE or EXTENDED'),
  })

  const complete = useMutation({
    mutationFn: (id: number) => api.post(`/admin/auctions/${id}/complete`),
    onSuccess: () => { invalidateAll(); toast.success('Auction completed') },
    onError: () => toast.error('Auction must be CLOSED first'),
  })

  const isLoading = tab === 'pending' ? pendingLoading : allLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const getNextAction = (status: string, id: number) => {
    switch (status) {
      case 'CREATED':
        return (
          <div className="flex gap-2">
            <button onClick={() => approve.mutate(id)} className="btn btn-primary btn-sm" disabled={approve.isPending}>Approve</button>
            <button onClick={() => reject.mutate(id)} className="btn btn-secondary btn-sm" disabled={reject.isPending}>Reject</button>
          </div>
        )
      case 'PREPARING':
        return (
          <button onClick={() => activate.mutate(id)} className="btn btn-primary btn-sm" disabled={activate.isPending}>
            Go Live
          </button>
        )
      case 'ACTIVE':
      case 'EXTENDED':
        return (
          <button onClick={() => close.mutate(id)} className="btn btn-sm border border-red-300 text-red-600 hover:bg-red-50" disabled={close.isPending}>
            Close Auction
          </button>
        )
      case 'CLOSED':
        return (
          <button onClick={() => complete.mutate(id)} className="btn btn-secondary btn-sm" disabled={complete.isPending}>
            Mark Complete
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Auction Management</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('pending')} className={`btn btn-sm ${tab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}>
          Pending Approvals {pending?.length ? `(${pending.length})` : ''}
        </button>
        <button onClick={() => setTab('all')} className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-ghost'}`}>
          All Auctions
        </button>
      </div>

      {/* Lifecycle Legend */}
      <div className="card p-4 mb-6">
        <p className="text-xs text-ink-500 uppercase tracking-wider mb-2">Lifecycle</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {['CREATED', 'PREPARING', 'ACTIVE', 'EXTENDED', 'CLOSED', 'COMPLETED'].map((s) => (
            <span key={s} className={`px-2.5 py-1 rounded-full font-medium ${statusColors[s]}`}>{s}</span>
          ))}
          <span className="text-ink-400 flex items-center gap-1">← → admin-triggered transitions</span>
        </div>
      </div>

      {tab === 'pending' && (
        <>
          {!pending?.length ? (
            <div className="text-center py-20 text-ink-400">
              <p className="text-lg">No pending auctions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => (
                <div key={a.id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-ink-950">{a.title}</h3>
                      <p className="text-sm text-ink-500 mt-1">Vendor: {a.vendorName}</p>
                      <p className="text-sm text-ink-500">Type: {a.type}</p>
                      <p className="text-sm text-ink-500">
                        {new Date(a.startTime).toLocaleString()} → {new Date(a.endTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approve.mutate(a.id)} className="btn btn-primary btn-sm" disabled={approve.isPending}>
                        Approve
                      </button>
                      <button onClick={() => reject.mutate(a.id)} className="btn btn-secondary btn-sm" disabled={reject.isPending}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'all' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-ink-500">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4">Vendor</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Schedule</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAuctions?.map((a) => (
                <tr key={a.id} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="py-3 px-4 text-ink-400">{a.id}</td>
                  <td className="py-3 px-4 font-medium text-ink-950">{a.title}</td>
                  <td className="py-3 px-4 text-ink-500">{a.vendorName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-600 text-xs font-medium">{a.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-ink-400">
                    {new Date(a.startTime).toLocaleDateString()} – {new Date(a.endTime).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {getNextAction(a.status, a.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
