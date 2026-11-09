import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { ChallengeComments } from './ChallengeComments'
import { useChallengeModals } from './ChallengeModalsContext'

export const CommentsModal = () => {
  const { t } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const { isCommentsModalOpen, setCommentsOpen } = useChallengeModals()

  if (!challenge.id) return null

  return (
    <Dialog open={isCommentsModalOpen} onOpenChange={setCommentsOpen}>
      <DialogContent size="xl" className="flex h-[80vh] flex-col">
        <DialogHeader>
          <DialogTitle>
            {t({
              id: 'browsedChallengePage.challengeModals.commentsModal.title',
              defaultMessage: 'Challenge Comments',
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChallengeComments />
        </div>
      </DialogContent>
    </Dialog>
  )
}
