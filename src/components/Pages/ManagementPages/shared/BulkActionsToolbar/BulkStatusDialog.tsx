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
import { getStatusLabel, STATUS_MESSAGES } from '@/lib/taskConstants'

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
            {t({
              id: 'managementPages.bulkActionsToolbar.statusDialog.title',
              defaultMessage: 'Change task status',
            })}
          </DialogTitle>
          <DialogDescription>
            {t({
              id: 'managementPages.bulkActionsToolbar.statusDialog.description',
              defaultMessage: 'Updates every selected task to the chosen status.',
            })}
          </DialogDescription>
        </DialogHeader>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATUS_MESSAGES).map((key) => (
              <SelectItem key={key} value={key}>
                {getStatusLabel(t, Number(key))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button onClick={() => onConfirm(Number(status))}>
            {t({ id: 'common.apply', defaultMessage: 'Apply' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
