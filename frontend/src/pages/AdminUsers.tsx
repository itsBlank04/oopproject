import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { User as UserType } from '@/types'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserType[]>('/admin/users'),
  })

  const ban = useMutation({
    mutationFn: (id: number) => {
      if (!window.confirm('Ban this user? They will lose access to the platform.')) return Promise.reject(new Error('cancelled'))
      return api.post(`/admin/users/${id}/ban`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User banned')
    },
    onError: (err) => { if (err.message !== 'cancelled') toast.error('Failed to ban user') },
  })

  const unban = useMutation({
    mutationFn: (id: number) => api.post(`/admin/users/${id}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User unbanned')
    },
    onError: () => toast.error('Failed to unban user'),
  })

  const filtered = users?.filter((u) =>
    !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">User Management</h1>
      <input
        className="input max-w-xs mb-6"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-ink-500">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((u) => (
              <tr key={u.id} className="border-b border-cream-100 hover:bg-cream-50">
                <td className="py-3 px-4">{u.id}</td>
                <td className="py-3 px-4 font-medium text-ink-950">{u.displayName}</td>
                <td className="py-3 px-4 text-ink-500">{u.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    u.status === 'BANNED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {u.status === 'ACTIVE' ? (
                    <button className="btn btn-secondary btn-sm text-red-600" onClick={() => ban.mutate(u.id)} disabled={ban.isPending}>
                      Ban
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm text-green-600" onClick={() => unban.mutate(u.id)} disabled={unban.isPending}>
                      Unban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
