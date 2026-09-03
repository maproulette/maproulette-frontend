import { EntityEditList } from '@/components/shared/EntityEditList'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import type { EntityEdit } from '@/lib/idChanges'

/**
 * The edits currently sitting unsaved in the iD editor.
 *
 * This reads the editor's own graph, so it shows what the mapper has actually
 * done — including anything MapRoulette applied for them and anything they
 * have since changed or undone. It is not the challenge's proposal, which
 * describes what should happen rather than what has.
 */
export const PendingEditsModal = ({
  open,
  onOpenChange,
  edits,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  edits: EntityEdit[]
}) => {
  const { t } = useIntl()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {t('taskEditPage.pendingEdits.title', undefined, 'Unsaved changes')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'taskEditPage.pendingEdits.description',
              undefined,
              'What is currently pending in the editor. Save from the editor to send it to OpenStreetMap.'
            )}
          </DialogDescription>
        </DialogHeader>

        {edits.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('taskEditPage.pendingEdits.none', undefined, 'Nothing is pending.')}
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <EntityEditList edits={edits} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
