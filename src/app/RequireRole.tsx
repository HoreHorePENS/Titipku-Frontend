import type React from 'react'
import { Navigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiErrorState } from '@/components/shared/ApiErrorState'
import { useAccountRole, useCurrentAccount, type AccountRole } from '@/features/auth'

interface RequireRoleProps {
  role: AccountRole
  children: React.ReactNode
}

/**
 * Hanya render halaman (dan query-nya) bila peran akun sudah pasti dan sesuai.
 * Mencegah query penitip berjalan dengan token pemilik toko (dan sebaliknya) → 403.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const account = useCurrentAccount()
  const { role: currentRole, isError } = useAccountRole()

  if (isError) {
    return (
      <ApiErrorState
        error={account.error}
        onRetry={() => account.refetch()}
        title="Data akun belum bisa dimuat"
        size="page"
      />
    )
  }
  if (!currentRole) {
    return (
      <div className="flex flex-col gap-4 p-4" aria-busy="true" aria-label="Memuat akun">
        <Skeleton variant="rect" className="h-10 w-48" />
        <Skeleton variant="rect" className="h-48 w-full rounded-2xl" />
      </div>
    )
  }
  if (currentRole !== role) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
