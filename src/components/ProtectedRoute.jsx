import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import usePermissions from '../hooks/usePermissions.js'

/**
 * Guards routes by authentication and optional permission.
 *
 * @param {{ children: import('react').ReactNode, permission?: string }} props
 * @returns {import('react').ReactNode}
 */
export default function ProtectedRoute({ children, permission }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const { can } = usePermissions()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2FB] text-[#1A3263]">
        Checking session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (permission && !can(permission)) {
    return <Navigate to="/403" replace />
  }

  return children
}
