import type React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthToken } from '@/lib/api-client'

export interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * Route guard untuk memproteksi rute privat UMKM.
 * Mengarahkan pengguna tanpa token ke halaman /auth dengan state lokasi sebelumnya.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
