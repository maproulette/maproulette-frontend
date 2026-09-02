import { FilePlus2, PencilLine, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import type { EditKind, EntityEdit } from '@/lib/idChanges'
import type { TagChange } from '@/lib/tagDiff'
import { cn } from '@/lib/utils'

const KIND_ICON: Record<EditKind, typeof PencilLine> = {
  created: FilePlus2,
  modified: PencilLine,
  deleted: Trash2,
}

const KIND_STYLE: Record<EditKind, string> = {
  created: 'text-green-600 dark:text-green-400',
  modified: 'text-amber-600 dark:text-amber-400',
  deleted: 'text-red-600 dark:text-red-400',
}

const TAG_STYLE: Record<TagChange['status'], string> = {
  added: 'border-green-500/40 bg-green-500/10',
  changed: 'border-amber-500/40 bg-amber-500/10',
  removed: 'border-red-500/40 bg-red-500/10',
}

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

  const kindLabel: Record<EditKind, string> = {
    created: t('taskEditPage.pendingEdits.created', undefined, 'Created'),
    modified: t('taskEditPage.pendingEdits.modified', undefined, 'Modified'),
    deleted: t('taskEditPage.pendingEdits.deleted', undefined, 'Deleted'),
  }

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
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
            {edits.map((edit) => {
              const Icon = KIND_ICON[edit.kind]
              return (
                <li key={`${edit.kind}-${edit.id}`} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('size-4 shrink-0', KIND_STYLE[edit.kind])} />
                    <span className={cn('font-medium text-sm', KIND_STYLE[edit.kind])}>
                      {kindLabel[edit.kind]}
                    </span>
                    <code className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {edit.type ? `${edit.type} ` : ''}
                      {edit.id}
                    </code>
                  </div>

                  {edit.geometryOnly ? (
                    <p className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
                      {t(
                        'taskEditPage.pendingEdits.geometryOnly',
                        undefined,
                        'Geometry changed; no tags were altered.'
                      )}
                    </p>
                  ) : (
                    <ul className="space-y-1 pl-6">
                      {edit.tags.map((tag) => (
                        <li
                          key={`${tag.key}-${tag.status}`}
                          className={cn(
                            'flex flex-wrap items-baseline gap-x-2 rounded border px-2 py-1',
                            TAG_STYLE[tag.status]
                          )}
                        >
                          <code className="font-mono text-xs">{tag.key}</code>
                          {tag.from !== null && (
                            <code className="font-mono text-xs text-zinc-500 line-through dark:text-zinc-400">
                              {tag.from}
                            </code>
                          )}
                          {tag.to !== null && (
                            <code className="font-mono text-green-700 text-xs dark:text-green-400">
                              {tag.to}
                            </code>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
