import { AuthGuard } from '@/lib/AuthGuard'
import { DashboardContent } from './DashboardContent'

export const Dashboard = () => {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
