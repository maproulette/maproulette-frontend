import { useParams } from '@tanstack/react-router'
import { api } from '@/api'
import { DrawerPortalProvider } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ChallengeTasksExplorerProvider } from './ChallengeTasksExplorer'
import { ManageChallengeDetailContent } from './ManageChallengeDetailContent'

export const ManageChallengeDetail = () => {
  const { challengeId } = useParams({ from: '/_app/manage/challenge/$challengeId/' })

  const { data: challengeData, isLoading: isLoadingChallenge } = api.challenge.getChallenge(
    Number(challengeId)
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
