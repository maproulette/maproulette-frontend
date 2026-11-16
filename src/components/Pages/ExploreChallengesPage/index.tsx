import { DrawerPortalProvider } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ChallengeResultsContextProvider } from './contexts/ChallengeResultsContext'
import { ExploreChallengesSearchContextProvider } from './contexts/ExploreChallengesSearchContext'
import { ExploreChallengesResults } from './ExploreChallengesResults'
import { FilterBar } from './FilterBar'

export const Challenges = () => {
  return (
    <ExploreChallengesSearchContextProvider>
      <ChallengeResultsContextProvider>
        <DrawerPortalProvider>
          <div className="flex h-full flex-col gap-4 px-4">
            <FilterBar />
            <ExploreChallengesResults />
          </div>
        </DrawerPortalProvider>
      </ChallengeResultsContextProvider>
    </ExploreChallengesSearchContextProvider>
  )
}
