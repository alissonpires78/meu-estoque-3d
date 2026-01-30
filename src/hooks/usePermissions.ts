import { useAuth } from '../contexts/AuthContext'

export function usePermissions() {
  const { hasRole, isAdmin, canWrite, canRead, appUser } = useAuth()
  return {
    canRead,
    canWrite,
    isAdmin,
    hasRole,
    isApproved: appUser?.approved === true,
    role: appUser?.role ?? null,
  }
}
