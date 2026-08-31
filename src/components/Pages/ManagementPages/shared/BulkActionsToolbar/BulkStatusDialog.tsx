import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { getStatusLabel, STATUS_LABEL_KEYS } from '@/lib/taskConstants'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: number) => void
}

export const BulkStatusDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const { t } = useIntl()
  const [status, setStatus] = useState<string>('1')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {t(
              'managementPages.bulkActionsToolbar.statusDialog.title',
              undefined,
              'Change task status'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'managementPages.bulkActionsToolbar.statusDialog.description',
              undefined,
              'Updates every selected task to the chosen status.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATUS_LABEL_KEYS).map((key) => (
              <SelectItem key={key} value={key}>
                {getStatusLabel(t, Number(key))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={() => onConfirm(Number(status))}>
            {t('managementPages.bulkActionsToolbar.apply', undefined, 'Apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
