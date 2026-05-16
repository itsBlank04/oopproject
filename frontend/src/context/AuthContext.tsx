import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '@/api/client'
import type { User, RegisterPayload, LoginPayload } from '@/types'

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'TECHNICIAN' | 'ADMIN'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })

  const checkSession = useCallback(async () => {
    try {
      const data = await api.get<{ user: User; role: string }>('/auth/me')
      setState({ user: data.user, role: data.role as UserRole, loading: false })
    } catch {
      setState({ user: null, role: null, loading: false })
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.post<{ user: User; role: string }>('/auth/login', payload)
    setState({ user: data.user, role: data.role as UserRole, loading: false })
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<{ user: User; role: string }>('/auth/register', payload)
    setState({ user: data.user, role: data.role as UserRole, loading: false })
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setState({ user: null, role: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, role, loading } = useAuth()
  const isAuthenticated = !!user
  const hasRole = requiredRole ? role === requiredRole : true
  const canAccess = isAuthenticated && hasRole

  return { user, role, loading, isAuthenticated, hasRole, canAccess }
}
