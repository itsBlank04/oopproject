import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import apiClient from '../lib/apiClient'

type User = {
  id: number
  email: string
  displayName: string
  phone: string | null
  avatarUrl: string | null
  status: string
  roles: string[]
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string, roles?: string[]) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/api/auth/me')
      .then((res) => {
        if (res.data && res.data.id) {
          setUser(res.data)
        } else {
          setUser(null)
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { email, password })
    setUser(res.data)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string, roles?: string[]) => {
    const res = await apiClient.post('/api/auth/register', { email, password, displayName, roles })
    setUser(res.data)
  }, [])

  const logout = useCallback(async () => {
    await apiClient.post('/api/auth/logout')
    setUser(null)
  }, [])

  const hasRole = useCallback((role: string) => {
    return user?.roles?.includes(role) ?? false
  }, [user])

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/auth/me')
      if (res.data && res.data.id) {
        setUser(res.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
