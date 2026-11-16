import { SignIn } from '@/components/shared/SignIn'
import { useAuthContext } from '@/contexts/AuthContext'
import { NotificationsPageContent } from './NotificationsPageContent'

export const NotificationsPage = () => {
  const { user } = useAuthContext()
  return user ? <NotificationsPageContent userId={user.id} /> : <SignIn />
}
