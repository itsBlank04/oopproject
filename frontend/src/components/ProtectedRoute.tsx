import { Navigate } from 'react-router-dom'
import { useRequireAuth, type UserRole } from '@/context/AuthContext'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  role?: UserRole
  fallback?: string
}

export function ProtectedRoute({ children, role, fallback = '/login' }: Props) {
  const { loading, canAccess, isAuthenticated } = useRequireAuth(role)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={fallback} replace />
  }

  if (role && !canAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
