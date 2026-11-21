import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { challengeOptions } from '@/api/challenge'
import { DrawerPortalProvider } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { useChallengeSubscription } from '@/contexts/WebSocketContext'
import { ChallengeTasksExplorerProvider } from './ChallengeTasksExplorer'
import { ManageChallengeDetailContent } from './ManageChallengeDetailContent'

export const ManageChallengeDetail = () => {
  const { challengeId } = useParams({ from: '/_app/manage/challenge/$challengeId/' })
  useChallengeSubscription(Number(challengeId))

  const { data: challengeData, isLoading: isLoadingChallenge } = useQuery(
    challengeOptions(Number(challengeId))
  )

  return (
    <div className="h-full">
      <ChallengeTasksExplorerProvider
        challengeId={Number(challengeId)}
        challengeName={challengeData?.name}
        enabled={!isLoadingChallenge && !!challengeData?.id}
      >
        <DrawerPortalProvider>
          <ManageChallengeDetailContent />
        </DrawerPortalProvider>
      </ChallengeTasksExplorerProvider>
    </div>
  )
}
