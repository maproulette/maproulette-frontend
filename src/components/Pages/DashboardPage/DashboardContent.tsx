import { useAuthContext } from '@/contexts/AuthContext'
import { ContributionsSection } from './ContributionsSection'
import { SavedChallengesSection } from './SavedChallengesSection'
import { TeamsSection } from './TeamsSection'
import { UserProfileSection } from './UserProfileSection'

export const DashboardContent = () => {
  const { user } = useAuthContext()

  if (!user) return null

  return (
    <div className="h-full w-full overflow-hidden px-4 pb-2">
      <div className="grid h-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3">
        {/* Left Column: Saved Challenges */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <SavedChallengesSection userId={user.id} />
        </div>

        {/* Middle Column: User Profile & Points */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <UserProfileSection user={user} />
        </div>

        {/* Right Column: Contributions + Teams */}
        <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <ContributionsSection userId={user.id} />
          <TeamsSection userId={user.id} />
        </div>
      </div>
    </div>
  )
}
