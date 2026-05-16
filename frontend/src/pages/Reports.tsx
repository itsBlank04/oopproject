import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'

export default function Reports() {
  const queryClient = useQueryClient()
  const [reportedId, setReportedId] = useState('')
  const [reason, setReason] = useState('')

  const createReport = useMutation({
    mutationFn: (data: { reportedId: number; reason: string }) => api.post('/reports', data),
    onSuccess: () => {
      toast.success('Report submitted. Admin will review it.')
      setReportedId('')
      setReason('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-ink-950 mb-8">Report a User</h1>
      <div className="card p-6 space-y-4">
        <p className="text-sm text-ink-500">Use this form to report suspicious or abusive behavior. An admin will review your report.</p>
        <div>
          <label className="label">User ID to Report</label>
          <input className="input" type="number" value={reportedId} onChange={(e) => setReportedId(e.target.value)} placeholder="Enter the user's ID" required />
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input min-h-[100px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe why you're reporting this user..." required />
        </div>
        <button
          className="btn btn-primary w-full"
          onClick={() => createReport.mutate({ reportedId: Number(reportedId), reason })}
          disabled={createReport.isPending || !reportedId || !reason}
        >
          {createReport.isPending ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
