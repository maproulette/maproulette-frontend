import { ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import { UserSettingsForm } from './UserSettingsForm'

export const SettingsPage = () => {
  const { user } = useAuthContext()

  return (
    <ManageFormLayout className="px-4">{user && <UserSettingsForm user={user} />}</ManageFormLayout>
  )
}
