import { Lock } from 'lucide-react'
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
import type { LockConflict } from '@/lib/apiError'

interface LockConflictModalProps {
  conflict: LockConflict | null
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

/**
 * Shown when the user tries to lock a task while already holding a lock on a different one
 * (a user may only hold one active edit lock at a time). Lets them release the held lock and
 * take the new one instead, or cancel and keep working on what they already have locked.
 */
export const LockConflictModal = ({
  conflict,
  onConfirm,
  onCancel,
  busy,
}: LockConflictModalProps) => {
  const { t } = useIntl()
  const bundledCount = conflict?.bundledTasks.length ?? 0

  return (
    <Dialog open={conflict != null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-amber-500" aria-hidden="true" />
            {t({ id: 'taskEditPage.lockConflictModal.title', defaultMessage: 'You already have a task locked' })}
          </DialogTitle>
          <DialogDescription>
            {conflict?.parentName
              ? t({ id: 'taskEditPage.lockConflictModal.descriptionWithParent', defaultMessage: 'You currently have a task locked in "{parentName}". Unlock it and lock this task instead?' }, { parentName: conflict.parentName }
                )
              : t({ id: 'taskEditPage.lockConflictModal.description', defaultMessage: 'You currently have another task locked. Unlock it and lock this task instead?' }
                )}
            {bundledCount > 0 &&
              ' ' +
                t({ id: 'taskEditPage.lockConflictModal.bundleNote', defaultMessage: '{count, plural, one {This will also release # bundled task.} other {This will also release # bundled tasks.}}' }, { count: bundledCount }
                )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy
              ? t({ id: 'taskEditPage.lockConflictModal.unlocking', defaultMessage: 'Unlocking…' })
              : t({ id: 'taskEditPage.lockConflictModal.confirm', defaultMessage: 'Unlock and continue' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
