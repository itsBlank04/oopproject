import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications').then(r => Array.isArray(r.data) ? r.data : r.data?.content || []),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiClient.put(`/api/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData<any[]>(['notifications'])
      if (prev) queryClient.setQueryData(['notifications'], prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Notifications</h1>
        {isLoading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
            No notifications yet
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition hover:shadow ${n.isRead ? 'border-[#e4d6c8] bg-white' : 'border-[#221b16] bg-[#fef8f0]'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#221b16]">{n.title}</p>
                    <p className="mt-1 text-sm text-[#6c5b4f]">{n.body}</p>
                  </div>
                  {!n.isRead && <span className="h-2.5 w-2.5 rounded-full bg-[#221b16]" />}
                </div>
                <p className="mt-2 text-xs text-[#8c7564]">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
