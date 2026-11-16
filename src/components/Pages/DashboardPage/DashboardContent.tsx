import { useAuthContext } from '@/contexts/AuthContext'
import { ProfileSummary } from './ProfileSummary'
import { RecentActivitySection } from './RecentActivitySection'
import { SavedChallengesSection } from './SavedChallengesSection'
import { TeamsSection } from './TeamsSection'
import { TopChallengesSection } from './TopChallengesSection'

export const DashboardContent = () => {
  const { user } = useAuthContext()

  if (!user) return null

  // Below lg the sections stack and the page scrolls; at lg and up each
  // column fills the remaining height and scrolls on its own.
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pb-2 lg:overflow-hidden">
      <ProfileSummary user={user} />
      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-1">
        <SavedChallengesSection userId={user.id} />
        <RecentActivitySection userId={user.id} />
        <div className="flex min-h-0 flex-col gap-4">
          <TopChallengesSection userId={user.id} />
          <TeamsSection userId={user.id} />
        </div>
      </div>
    </div>
  )
}
