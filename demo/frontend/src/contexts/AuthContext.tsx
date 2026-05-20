import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const res = await apiClient.get('/api/auth/me')
      return res.data?.id ? res.data : null
    },
    staleTime: 300_000,
    retry: false,
    placeholderData: (prev) => prev,
  })

  const clearOtherCaches = () => {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth-user',
    })
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { email, password })
    queryClient.setQueryData(['auth-user'], res.data)
    clearOtherCaches()
  }, [queryClient])

  const register = useCallback(async (email: string, password: string, displayName: string, roles?: string[]) => {
    const res = await apiClient.post('/api/auth/register', { email, password, displayName, roles })
    queryClient.setQueryData(['auth-user'], res.data)
    clearOtherCaches()
  }, [queryClient])

  const logout = useCallback(async () => {
    await apiClient.post('/api/auth/logout')
    queryClient.setQueryData(['auth-user'], null)
    clearOtherCaches()
  }, [queryClient])

  const hasRole = useCallback((role: string) => {
    return user?.roles?.includes(role) ?? false
  }, [user])

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth-user'] })
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, login, register, logout, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
