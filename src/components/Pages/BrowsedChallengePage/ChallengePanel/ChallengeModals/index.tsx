import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { ActionsModal } from './ActionsModal'
import { CommentsModal } from './CommentsModal'
import { OverpassModal } from './OverpassModal'
import { ReportHistoryModal } from './ReportHistoryModal'
import { ReportModal } from './ReportModal'

export const ChallengeModals = () => {
  const { user } = useAuthContext()
  const { hasOverpass } = useBrowsedChallengeContext()

  return (
    <>
      {user && <ReportModal />}
      {/* Reports are public, so this one is not gated on being signed in. */}
      <ReportHistoryModal />
      <CommentsModal />
      {hasOverpass && <OverpassModal />}
      <ActionsModal />
    </>
  )
}
