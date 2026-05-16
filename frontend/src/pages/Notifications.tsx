import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications?.filter((n) => !n.isRead) ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink-950">Notifications</h1>
        {unread.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all as read
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 transition cursor-pointer ${!n.isRead ? 'border-l-4 border-teal-500 bg-teal-50/50' : ''}`}
              onClick={() => { if (!n.isRead) markRead.mutate(n.id) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-ink-950">{n.title}</p>
                  <p className="text-sm text-ink-600 mt-1">{n.body}</p>
                  <p className="text-xs text-ink-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
