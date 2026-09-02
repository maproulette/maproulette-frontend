import { useState } from 'react'
import { DocsLink } from '@/components/shared/DocsLink'
import { TagInput } from '@/components/shared/TaskTags/TagInput'
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
  onConfirm: (tags: string[]) => void
}

export const BulkTagDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const { t } = useIntl()
  const [tags, setTags] = useState<string[]>([])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {t(
              'managementPages.bulkActionsToolbar.tagDialog.title',
              undefined,
              'Add tags to selected tasks'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'managementPages.bulkActionsToolbar.tagDialog.description',
              undefined,
              'Applies the entered tags to every selected task.'
            )}{' '}
            <DocsLink page="maprouletteTags" icon={null}>
              {t(
                'managementPages.bulkActionsToolbar.tagDialog.docsLink',
                undefined,
                'How MapRoulette tags are used'
              )}
            </DocsLink>
          </DialogDescription>
        </DialogHeader>
        <TagInput value={tags} onChange={setTags} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={() => onConfirm(tags)} disabled={tags.length === 0}>
            {t('managementPages.bulkActionsToolbar.apply', undefined, 'Apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
