import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminSetup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(searchParams.get('displayName') || '')
  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/setup-admin', { email, password, displayName, phone, role: 'ADMIN' })
      toast.success('Admin account created')
      navigate('/login')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <h1 className="font-display text-2xl text-ink-950">Admin Setup</h1>
          <p className="mt-1 text-sm text-ink-500">Create the platform admin account</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Display Name</label>
              <input type="text" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
