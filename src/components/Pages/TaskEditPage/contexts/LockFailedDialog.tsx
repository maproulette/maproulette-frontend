import { LockOpen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

export interface LockFailure {
  message?: string
}

interface Props {
  taskId: number
  failure: LockFailure | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
  onBrowseChallenge: () => void
  busy?: boolean
}

export const LockFailedDialog = ({
  taskId,
  failure,
  onOpenChange,
  onRetry,
  onBrowseChallenge,
  busy,
}: Props) => {
  const { t } = useIntl()
  const requestUnlockMutation = api.task.useRequestUnlock()
  const [requestedTaskId, setRequestedTaskId] = useState<number | null>(null)

  const handleRequestUnlock = async () => {
    try {
      await requestUnlockMutation.mutateAsync(taskId)
      setRequestedTaskId(taskId)
    } catch (error) {
      logger.error('Failed to request unlock', { taskId, error })
      toast.error(
        t(
          'taskEditPage.lockFailedDialog.requestUnlockFailed',
          undefined,
          'Could not request unlock'
        )
      )
    }
  }

  return (
    <Dialog open={failure != null} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="size-5 text-amber-500" aria-hidden="true" />
            {t('taskEditPage.lockFailedDialog.title', undefined, 'Unable to Lock Task')}
          </DialogTitle>
          <DialogDescription>
            {failure?.message ??
              t(
                'taskEditPage.lockFailedDialog.genericLockFailure',
                undefined,
                'Task lock could not be acquired'
              )}
            {t(
              'taskEditPage.lockFailedDialog.previewAvailable',
              undefined,
              '. A read-only preview is available.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-wrap sm:gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('taskEditPage.lockFailedDialog.preview', undefined, 'Preview Task')}
          </Button>
          <Button variant="outline" onClick={onRetry} disabled={busy}>
            {t('taskEditPage.lockFailedDialog.retryLock', undefined, 'Retry Lock')}
          </Button>
          <Button variant="outline" onClick={onBrowseChallenge} disabled={busy}>
            {t('taskEditPage.lockFailedDialog.browseChallenge', undefined, 'Browse Challenge')}
          </Button>
          {requestedTaskId === taskId ? (
            <span className="self-center text-sm">
              {t('taskEditPage.lockFailedDialog.requestSent', undefined, 'Request Sent!')}
            </span>
          ) : (
            <Button
              onClick={handleRequestUnlock}
              disabled={busy || requestUnlockMutation.isPending}
            >
              {t('taskEditPage.lockFailedDialog.requestUnlock', undefined, 'Request Unlock')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
