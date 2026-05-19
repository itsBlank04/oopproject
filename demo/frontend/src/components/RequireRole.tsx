import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

export function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth/login" replace />
  if (!hasRole(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export function BlockVendorOnly({ children }: { children: ReactNode }) {
  const { user, loading, hasRole } = useAuth()
  if (loading) return null
  if (user && hasRole('VENDOR')) return <Navigate to="/" replace />
  return <>{children}</>
}
