import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthContext'

interface Props {
  children: ReactNode
  allowedRoles?: string[]
  loginPath?: string
}

function ProtectedRoute({ children, allowedRoles, loginPath = '/admin/login' }: Props) {
  const { loading, userId, role } = useAuth()

  if (loading) return <div className="p-8 text-gray-500">Checking session…</div>

  // Just needs to be logged in
  if (!userId) return <Navigate to={loginPath} replace />

  // Only enforce a role match if this route actually requires one
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute