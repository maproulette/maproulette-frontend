import { useAuthContext } from '@/contexts/AuthContext'
import { AuthGuard } from '@/lib/AuthGuard'
import { UserSettingsForm } from './UserSettingsForm'

export const SettingsPage = () => {
  const { user } = useAuthContext()

  return (
    <AuthGuard>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        {user && <UserSettingsForm user={user} />}
      </div>
    </AuthGuard>
  )
}
