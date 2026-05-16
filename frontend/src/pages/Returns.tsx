import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { Return as ReturnType, Order } from '@/types'

export default function Returns() {
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [orderItemId, setOrderItemId] = useState('')
  const [reason, setReason] = useState('')

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => api.get<ReturnType[]>('/returns'),
  })

  const { data: adminReturns } = useQuery({
    queryKey: ['returns-admin'],
    queryFn: () => api.get<ReturnType[]>('/returns/admin'),
    enabled: role === 'ADMIN',
  })

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/orders'),
  })

  const createReturn = useMutation({
    mutationFn: (data: { orderItemId: number; reason: string }) => api.post('/returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      setShowForm(false)
      setOrderItemId('')
      setReason('')
      toast.success('Return requested')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const approveReturn = useMutation({
    mutationFn: (id: number) => api.post(`/returns/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-admin'] })
      toast.success('Return approved')
    },
  })

  const rejectReturn = useMutation({
    mutationFn: (id: number) => api.post(`/returns/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-admin'] })
      toast.success('Return rejected')
    },
  })

  const displayReturns = adminReturns || returns

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
        <h1 className="font-display text-3xl text-ink-950">Returns</h1>
        {role !== 'ADMIN' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Request Return'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="font-medium text-ink-950 mb-4">New Return Request</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Order Item ID</label>
              <input className="input" type="number" value={orderItemId} onChange={(e) => setOrderItemId(e.target.value)} placeholder="From your orders" />
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea className="input min-h-[80px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you returning this item?" />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => createReturn.mutate({ orderItemId: Number(orderItemId), reason })}
              disabled={createReturn.isPending || !orderItemId || !reason}
            >
              Submit Return Request
            </button>
          </div>
        </div>
      )}

      {!displayReturns?.length ? (
        <div className="text-center py-20 text-ink-400">
          <p className="text-lg">No returns</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReturns.map((r) => {
            const statusColor = r.status === 'OPEN' ? 'text-yellow-600' : r.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
            return (
              <div key={r.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium uppercase tracking-wider ${statusColor}`}>{r.status}</p>
                    <p className="text-ink-950 mt-2">{r.reason}</p>
                    <p className="text-xs text-ink-400 mt-2">Submitted {new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  {role === 'ADMIN' && r.status === 'OPEN' && (
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => approveReturn.mutate(r.id)} disabled={approveReturn.isPending}>
                        Approve
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => rejectReturn.mutate(r.id)} disabled={rejectReturn.isPending}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
