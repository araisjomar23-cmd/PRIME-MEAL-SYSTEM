import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthContext'

interface Props {
  children: ReactNode
  allowedRoles?: string[]
}

function ProtectedRoute({ children, allowedRoles }: Props) {
  const { loading, userId, role } = useAuth()

  if (loading) {
    return <div className="p-8 text-gray-500">Checking session…</div>
  }

  if (!userId || !role) {
    return <Navigate to="/admin/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute