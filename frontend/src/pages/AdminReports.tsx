import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

interface Report {
  id: number
  reporter: { id: number; displayName: string } | number
  reported: { id: number; displayName: string } | number
  reason: string
  status: 'OPEN' | 'REVIEWED' | 'RESOLVED'
  createdAt: string
  resolvedAt: string | null
}

export default function AdminReports() {
  const queryClient = useQueryClient()

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports-admin'],
    queryFn: () => api.get<Report[]>('/reports/admin'),
  })

  const resolve = useMutation({
    mutationFn: (id: number) => api.post(`/reports/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-admin'] })
      toast.success('Report resolved')
    },
    onError: () => toast.error('Failed to resolve'),
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
      <h1 className="font-display text-3xl text-ink-950 mb-8">User Reports</h1>
      {!reports?.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wider ${r.status === 'OPEN' ? 'text-red-600' : 'text-green-600'}`}>
                    {r.status}
                  </p>
                  <p className="text-ink-950 mt-2 font-medium">
                    Report #{r.id}
                  </p>
                  <p className="text-sm text-ink-600 mt-1">{r.reason}</p>
                  <p className="text-xs text-ink-400 mt-1">
                    Reported user ID: {typeof r.reported === 'object' ? r.reported.id : r.reported}
                    {' | '}Reporter: {typeof r.reporter === 'object' ? r.reporter.displayName : `User #${r.reporter}`}
                  </p>
                  <p className="text-xs text-ink-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                {r.status === 'OPEN' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => resolve.mutate(r.id)} disabled={resolve.isPending}>
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
