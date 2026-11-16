import { ManageChallengesContent } from './ManageChallengesContent'
import { ManageChallengesProvider } from './ManageChallengesContext'

export const ManageChallenges = () => {
  return (
    <ManageChallengesProvider>
      <ManageChallengesContent />
    </ManageChallengesProvider>
  )
}
