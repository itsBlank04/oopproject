import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

interface FraudFlag {
  id: number
  userId: number
  userName: string
  reason: string
  createdAt: string
}

export default function FraudAlerts() {
  const queryClient = useQueryClient()

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-fraud'],
    queryFn: () => api.get<FraudFlag[]>('/admin/fraud'),
  })

  const resolve = useMutation({
    mutationFn: (id: number) => {
      if (!window.confirm('Resolve this fraud flag?')) return Promise.reject(new Error('cancelled'))
      return api.post(`/admin/fraud/${id}/resolve`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud'] })
      toast.success('Flag resolved')
    },
    onError: (err) => { if (err.message !== 'cancelled') toast.error('Failed to resolve flag') },
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
      <h1 className="font-display text-3xl text-ink-950 mb-8">Fraud Alerts</h1>

      {!flags?.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No open fraud alerts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((f) => (
            <div key={f.id} className="card p-6 border-l-4 border-red-400">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium uppercase tracking-wider">Flag #{f.id}</p>
                  <p className="font-medium text-ink-950 mt-1">{f.reason}</p>
                  <p className="text-sm text-ink-500 mt-1">User: {f.userName}</p>
                  <p className="text-xs text-ink-400 mt-1">{new Date(f.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => resolve.mutate(f.id)} className="btn btn-secondary btn-sm" disabled={resolve.isPending}>
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
