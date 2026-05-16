import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const roles = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Browse, buy, and sell used items' },
  { value: 'VENDOR', label: 'Vendor', desc: 'List products and run auctions' },
  { value: 'TECHNICIAN', label: 'Technician', desc: 'Offer repair services' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    phone: '',
    role: 'CUSTOMER',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (form.role === 'ADMIN') {
        navigate(`/admin/setup?email=${encodeURIComponent(form.email)}&displayName=${encodeURIComponent(form.displayName)}&phone=${encodeURIComponent(form.phone)}`)
        return
      }
      await register(form)
      toast.success('Account created! Welcome to AtomDrops.')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <h1 className="font-display text-2xl text-ink-950">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Join the marketplace</p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" name="email" className="input" value={form.email} onChange={handleChange} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" className="input" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div>
              <label className="label">Display Name</label>
              <input type="text" name="displayName" className="input" value={form.displayName} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input type="text" name="phone" className="input" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">I want to join as</label>
              <select name="role" className="input" value={form.role} onChange={handleChange}>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
