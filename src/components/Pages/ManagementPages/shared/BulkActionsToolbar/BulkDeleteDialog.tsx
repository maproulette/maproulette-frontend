import { TriangleAlert } from 'lucide-react'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  count: number
  busy?: boolean
}

export const BulkDeleteDialog = ({ open, onOpenChange, onConfirm, count, busy }: Props) => {
  const { t } = useIntl()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-red-500" aria-hidden="true" />
            {t({ id: 'managementPages.bulkActionsToolbar.deleteDialog.title', defaultMessage: '{count, plural, one {Delete # task?} other {Delete # tasks?}}' }, { count }
            )}
          </DialogTitle>
          <DialogDescription>
            {t({ id: 'managementPages.bulkActionsToolbar.deleteDialog.description', defaultMessage: 'This cannot be undone. Tasks and their comments, reviews, and tags are permanently removed.' }
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy
              ? t({ id: 'managementPages.bulkActionsToolbar.deleteDialog.deleting', defaultMessage: 'Deleting…' }
                )
              : t({ id: 'common.delete', defaultMessage: 'Delete' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
