import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await login(data.email, data.password)
      toast.success('Logged in')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0] px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="font-[Fraunces] text-3xl text-[#221b16]">Welcome back</h1>
          <p className="mt-2 text-sm text-[#6c5b4f]">Sign in to your account</p>
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
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-[#6c5b4f]">
          No account? <Link to="/auth/register" className="font-semibold text-[#221b16]">Register</Link>
        </p>
      </form>
    </div>
  )
}
