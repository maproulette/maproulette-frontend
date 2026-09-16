import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { ActionsModal } from './ActionsModal'
import { useChallengeModals } from './ChallengeModalsContext'
import { CloneChallengeModal } from './CloneChallengeModal'
import { CommentsModal } from './CommentsModal'
import { OverpassModal } from './OverpassModal'
import { ReportHistoryModal } from './ReportHistoryModal'
import { ReportModal } from './ReportModal'

export const ChallengeModals = () => {
  const { user } = useAuthContext()
  const { challenge, hasOverpass, canClone, projectId } = useBrowsedChallengeContext()
  const { isCloneModalOpen, setCloneOpen } = useChallengeModals()

  return (
    <>
      {user && <ReportModal />}
      {/* Reports are public, so this one is not gated on being signed in. */}
      <ReportHistoryModal />
      <CommentsModal />
      {hasOverpass && <OverpassModal />}
      {canClone && challenge.id && challenge.name && (
        <CloneChallengeModal
          open={isCloneModalOpen}
          onOpenChange={setCloneOpen}
          challengeId={challenge.id}
          challengeName={challenge.name}
          currentProjectId={projectId ?? undefined}
        />
      )}
      <ActionsModal />
    </>
  )
}
