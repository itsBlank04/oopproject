import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import type { Return as ReturnType } from '@/types'

export default function AdminReturns() {
  const queryClient = useQueryClient()

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns-admin'],
    queryFn: () => api.get<ReturnType[]>('/returns/admin'),
  })

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/returns/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-admin'] })
      toast.success('Return approved')
    },
    onError: () => toast.error('Failed to approve'),
  })

  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/returns/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-admin'] })
      toast.success('Return rejected')
    },
    onError: () => toast.error('Failed to reject'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Return Requests</h1>
      {!returns?.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No return requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <div key={r.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wider ${r.status === 'OPEN' ? 'text-yellow-600' : r.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                    {r.status}
                  </p>
                  <p className="text-ink-950 mt-2">{r.reason}</p>
                  <p className="text-xs text-ink-500 mt-1">
                    Order Item #{typeof r.orderItem === 'object' ? r.orderItem.id : r.orderItem}
                  </p>
                  <p className="text-xs text-ink-400 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                {r.status === 'OPEN' && (
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => approve.mutate(r.id)} disabled={approve.isPending}>
                      Approve
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => reject.mutate(r.id)} disabled={reject.isPending}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
