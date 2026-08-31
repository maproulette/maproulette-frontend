import { Navigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import type { User } from '@/types/User'

interface SuperAdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Check if user has super admin privileges
 * Super users have a grant with role = -1 (ROLE_SUPER_USER)
 */
export const isSuperUser = (user: User | null | undefined): boolean => {
  if (!user) return false
  return user.grants?.some((grant) => grant.role === -1) ?? false
}

/**
 * Determine a user's coarse role for display purposes: super_admin takes
 * precedence over an admin grant (role = 1), which takes precedence over the
 * default "user" role.
 */
export const getUserRole = (user: User): string => {
  if (isSuperUser(user)) return 'super_admin'

  const hasAdminGrant = user.grants?.some((grant) => grant.role === 1) ?? false
  if (hasAdminGrant) return 'admin'

  return 'user'
}

/**
 * Tailwind color classes for a role badge, keyed by the role strings
 * returned from `getUserRole`.
 */
export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-slate-800 dark:text-zinc-200'
  }
}

export const SuperAdminGuard = ({ children, fallback }: SuperAdminGuardProps) => {
  const { user } = useAuthContext()
  const { t } = useIntl()

  if (!user) {
    return <Navigate to="/" />
  }

  if (!isSuperUser(user)) {
    return (
      fallback || (
        <div className="mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 font-bold text-3xl text-zinc-900 dark:text-zinc-50">
            {t('superAdminGuard.accessDenied.title', undefined, 'Access Denied')}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t(
              'superAdminGuard.accessDenied.message',
              undefined,
              'You do not have permission to access this area. Super admin privileges are required.'
            )}
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}
