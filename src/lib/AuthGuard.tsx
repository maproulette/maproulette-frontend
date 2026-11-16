import type { ReactNode } from 'react'
import { SignIn } from '@/components/shared/SignIn'
import { useAuthContext } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { user } = useAuthContext()

  if (!user) {
    return fallback || <SignIn />
  }

  return <>{children}</>
}
