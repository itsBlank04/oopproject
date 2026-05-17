import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email'),
  displayName: z.string().min(1, 'Name is required').max(120),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormData = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Buy products, bid on auctions, request repairs' },
  { value: 'VENDOR', label: 'Vendor', desc: 'Sell products, run auctions, manage a shop' },
  { value: 'TECHNICIAN', label: 'Technician', desc: 'Offer repair services, accept bookings' },
] as const

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('CUSTOMER')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const roles = selectedRole === 'CUSTOMER' ? ['CUSTOMER'] : ['CUSTOMER', selectedRole]
      await registerUser(data.email, data.password, data.displayName, roles)
      toast.success('Account created')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Create account</h1>
          <p className="mt-2 text-sm text-[#6c5b4f]">Join AtomDrops marketplace</p>
        </div>

        {/* Role selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#221b16]">I want to join as:</p>
          <div className="grid gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedRole === role.value
                    ? 'border-[#221b16] bg-[#221b16] text-[#f9f5f0]'
                    : 'border-[#d7c7b8] bg-white text-[#221b16] hover:border-[#221b16]'
                }`}
              >
                <p className="text-sm font-semibold">{role.label}</p>
                <p className={`text-xs ${selectedRole === role.value ? 'text-[#c9b8a8]' : 'text-[#8c7564]'}`}>
                  {role.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <input {...register('displayName')} placeholder="Full name" className="w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-3 text-sm outline-none focus:border-[#221b16]" />
          {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>}
        </div>
        <div>
          <input {...register('email')} placeholder="Email" className="w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-3 text-sm outline-none focus:border-[#221b16]" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register('password')} type="password" placeholder="Password" className="w-full rounded-xl border border-[#d7c7b8] bg-white px-4 py-3 text-sm outline-none focus:border-[#221b16]" />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <button disabled={submitting} className="w-full rounded-xl bg-[#221b16] py-3 font-semibold text-[#f9f5f0] disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-[#6c5b4f]">
          Have an account? <Link to="/auth/login" className="font-semibold text-[#221b16]">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
