import { useState, useEffect } from 'react'
import apiClient from '../../lib/apiClient'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/api/notifications')
      .then(r => setNotifications(Array.isArray(r.data) ? r.data : r.data?.content || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id: number) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`)
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#f9f5f0] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Notifications</h1>
        {loading ? (
          <div className="mt-12 text-center text-[#8c7564]">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#e4d6c8] bg-white p-10 text-center text-[#8c7564]">
            No notifications yet
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
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
