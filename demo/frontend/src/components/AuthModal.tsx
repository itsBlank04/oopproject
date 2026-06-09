import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  displayName: z.string().min(1, 'Full name is required').max(120),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function AuthModal() {
  const { open, tab, setTab, closeModal } = useAuthModal()
  const { login, register: registerUser } = useAuth()
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeModal])

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const handleLogin = async (data: LoginForm) => {
    setLoginLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back')
      closeModal()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Invalid credentials')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (data: RegisterForm) => {
    setRegisterLoading(true)
    try {
      await registerUser(data.email, data.password, data.displayName, [])
      toast.success('Welcome to AtomDrops!')
      closeModal()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registration failed')
    } finally {
      setRegisterLoading(false)
    }
  }

  if (!open) return null

  const isSignin = tab === 'signin'

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative mx-auto flex w-full max-w-[770px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in zoom-in-95 duration-300 md:flex-row">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="hidden md:flex md:w-[42%] flex-col justify-center bg-[#f9f5f0] px-10 py-16 lg:px-12 lg:py-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8c7564]">
            Member Access
          </div>

          <h1
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="mt-5 text-[2rem] font-bold leading-[1.15] tracking-tight text-[#221b16] lg:text-[2.25rem]"
          >
            {isSignin ? 'Welcome\nBack' : 'Join\nAtomDrops'}
          </h1>

          <div className="mt-5 h-px w-10 bg-[#221b16]/20" />

          <p className="mt-5 max-w-[18rem] text-sm leading-relaxed text-[#6c5b4f]">
            {isSignin
              ? 'Access your account to explore our latest collections, track your orders, and enjoy exclusive member benefits.'
              : 'Create an account to start shopping, place bids, sell items, and connect with our marketplace community.'}
          </p>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="relative w-full px-6 pb-8 pt-8 md:w-[58%] md:px-10 md:pb-10 md:pt-10">
          {/* Close */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#8c7564] transition-colors hover:bg-[#f9f5f0] hover:text-[#221b16]"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Mobile brand mark */}
          <div className="mb-4 flex items-center md:hidden">
            <img src="/logo.png" alt="AtomDrops" className="h-auto w-auto max-h-16 max-w-32 object-contain" />
          </div>

          {/* Title */}
          <div className="mb-1">
            <h2 className="text-xl font-bold text-[#221b16] md:text-[1.375rem]">
              {isSignin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="mt-0.5 text-sm text-[#6c5b4f]">
              {isSignin ? 'Access your account and collections' : 'Join our marketplace community'}
            </p>
          </div>

          {/* Tabs */}
          <div className="relative mt-6 flex gap-0 rounded-[10px] bg-[#f9f5f0] p-1">
            <button
              type="button"
              onClick={() => { setShowPassword(false); setTab('signin') }}
              className={`flex-1 rounded-[8px] py-2.5 text-sm font-semibold transition-all duration-200 ${
                isSignin ? 'bg-white text-[#221b16] shadow-sm' : 'text-[#6c5b4f] hover:text-[#221b16]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setShowPassword(false); setTab('register') }}
              className={`flex-1 rounded-[8px] py-2.5 text-sm font-semibold transition-all duration-200 ${
                !isSignin ? 'bg-white text-[#221b16] shadow-sm' : 'text-[#6c5b4f] hover:text-[#221b16]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {isSignin && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-6 space-y-4">
              <Field label="Email ID" error={loginForm.formState.errors.email?.message}>
                <input
                  {...loginForm.register('email')}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`auth-field ${loginForm.formState.errors.email ? 'auth-field--error' : ''}`}
                />
              </Field>

              <Field label="Password" error={loginForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`auth-field pr-11 ${loginForm.formState.errors.password ? 'auth-field--error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7564] hover:text-[#221b16] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="auth-btn"
                >
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    'Sign In to AtomDrops'
                  )}
                </button>
              </div>


            </form>
          )}

          {/* Register Form */}
          {!isSignin && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="mt-6 space-y-4">
              <Field label="Full Name" error={registerForm.formState.errors.displayName?.message}>
                <input
                  {...registerForm.register('displayName')}
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  className={`auth-field ${registerForm.formState.errors.displayName ? 'auth-field--error' : ''}`}
                />
              </Field>

              <Field label="Email ID" error={registerForm.formState.errors.email?.message}>
                <input
                  {...registerForm.register('email')}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`auth-field ${registerForm.formState.errors.email ? 'auth-field--error' : ''}`}
                />
              </Field>

              <Field label="Password" error={registerForm.formState.errors.password?.message}>
                <div className="relative">
                  <input
                    {...registerForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 6 characters)"
                    autoComplete="new-password"
                    className={`auth-field pr-11 ${registerForm.formState.errors.password ? 'auth-field--error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7564] hover:text-[#221b16] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="auth-btn"
                >
                  {registerLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bottom switch */}
          <div className="mt-6 text-center text-sm text-[#6c5b4f]">
            {isSignin ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowPassword(false); setTab('register'); loginForm.reset() }}
                  className="font-semibold text-[#221b16] transition-colors hover:text-[#8c7564]"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowPassword(false); setTab('signin'); registerForm.reset() }}
                  className="font-semibold text-[#221b16] transition-colors hover:text-[#8c7564]"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Field wrapper ─── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6c5b4f]">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-[#dc2626]">{error}</p>
      )}
    </div>
  )
}
