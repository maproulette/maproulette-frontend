import { Archive, ArchiveRestore, ChevronDown, Trash2, UserCog, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { BulkDeleteDialog } from './BulkDeleteDialog'
import { BulkReassignDialog } from './BulkReassignDialog'
import { BulkStatusDialog } from './BulkStatusDialog'

interface Props {
  selectedIds: number[]
  onClearSelection: () => void
}

export const BulkActionsToolbar = ({ selectedIds, onClearSelection }: Props) => {
  const { t } = useIntl()
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const bulkStatus = api.task.useBulkUpdateStatus()
  const bulkDelete = api.task.useBulkDelete()
  const bulkArchive = api.task.useBulkArchive()
  const bulkReassign = api.task.useBulkReassign()

  if (selectedIds.length === 0) return null

  const handleStatus = async (status: number) => {
    try {
      await bulkStatus.mutateAsync({ taskIds: selectedIds, status })
      toast.success(
        t({ id: 'managementPages.bulkActionsToolbar.updatedToast', defaultMessage: '{count, plural, one {Updated # task} other {Updated # tasks}}' }, { count: selectedIds.length }
        )
      )
      onClearSelection()
    } catch (error) {
      logger.error('Bulk status failed', { error })
      toast.error(
        t({ id: 'managementPages.bulkActionsToolbar.updateError', defaultMessage: 'Could not update tasks' })
      )
    }
  }

  const handleDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(selectedIds)
      if (result.deleted < result.requested) {
        toast.warning(
          t({ id: 'managementPages.bulkActionsToolbar.deleteWarning', defaultMessage: 'Deleted {deleted} tasks; {denied} could not be deleted' }, { deleted: result.deleted, denied: result.requested - result.deleted }
          )
        )
      } else {
        toast.success(
          t({ id: 'managementPages.bulkActionsToolbar.deleteSuccess', defaultMessage: '{count, plural, one {Deleted # task} other {Deleted # tasks}}' }, { count: result.deleted }
          )
        )
      }
      setDeleteOpen(false)
      onClearSelection()
    } catch (error) {
      logger.error('Bulk delete failed', { error })
      toast.error(
        t({ id: 'managementPages.bulkActionsToolbar.deleteError', defaultMessage: 'Could not delete tasks' })
      )
    }
  }

  const handleArchive = async (archived: boolean) => {
    try {
      await bulkArchive.mutateAsync({ taskIds: selectedIds, archived })
      toast.success(
        archived
          ? t({ id: 'managementPages.bulkActionsToolbar.archivedToast', defaultMessage: '{count, plural, one {Archived # task} other {Archived # tasks}}' }, { count: selectedIds.length }
            )
          : t({ id: 'managementPages.bulkActionsToolbar.unarchivedToast', defaultMessage: '{count, plural, one {Unarchived # task} other {Unarchived # tasks}}' }, { count: selectedIds.length }
            )
      )
      onClearSelection()
    } catch (error) {
      logger.error('Bulk archive failed', { error })
      toast.error(
        t({ id: 'managementPages.bulkActionsToolbar.archiveError', defaultMessage: 'Could not archive tasks' })
      )
    }
  }

  const handleReassign = async (userId: number) => {
    try {
      const result = await bulkReassign.mutateAsync({ taskIds: selectedIds, userId })
      toast.success(
        t({ id: 'managementPages.bulkActionsToolbar.reassignSuccess', defaultMessage: 'Reassigned {updated} of {requested} tasks' }, { updated: result.updated, requested: result.requested }
        )
      )
      setReassignOpen(false)
      onClearSelection()
    } catch (error) {
      logger.error('Bulk reassign failed', { error })
      toast.error(
        t({ id: 'managementPages.bulkActionsToolbar.reassignError', defaultMessage: 'Could not reassign tasks' })
      )
    }
  }

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <span className="font-medium text-sm">
        {t({ id: 'managementPages.bulkActionsToolbar.selectedCount', defaultMessage: '{count} selected' }, { count: selectedIds.length }
        )}
      </span>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t({ id: 'managementPages.bulkActionsToolbar.changeStatus', defaultMessage: 'Change status' })}{' '}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusOpen(true)}>
              {t({ id: 'managementPages.bulkActionsToolbar.pickStatus', defaultMessage: 'Pick a status…' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Archive className="size-3.5" aria-hidden="true" />{' '}
              {t({ id: 'managementPages.bulkActionsToolbar.archive', defaultMessage: 'Archive' })}{' '}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleArchive(true)}>
              <Archive className="size-3.5" aria-hidden="true" />{' '}
              {t({ id: 'managementPages.bulkActionsToolbar.archive', defaultMessage: 'Archive' })}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleArchive(false)}>
              <ArchiveRestore className="size-3.5" aria-hidden="true" />{' '}
              {t({ id: 'managementPages.bulkActionsToolbar.unarchive', defaultMessage: 'Unarchive' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={() => setReassignOpen(true)}>
          <UserCog className="size-3.5" aria-hidden="true" />{' '}
          {t({ id: 'managementPages.bulkActionsToolbar.reassign', defaultMessage: 'Reassign' })}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-3.5" aria-hidden="true" />{' '}
          {t({ id: 'common.delete', defaultMessage: 'Delete' })}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="size-3.5" aria-hidden="true" /> {t({ id: 'common.clear', defaultMessage: 'Clear' })}
        </Button>
      </div>
      <BulkStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onConfirm={(status) => {
          setStatusOpen(false)
          handleStatus(status)
        }}
      />
      <BulkDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        count={selectedIds.length}
        busy={bulkDelete.isPending}
      />
      <BulkReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        onConfirm={handleReassign}
        count={selectedIds.length}
        busy={bulkReassign.isPending}
      />
    </div>
  )
}
