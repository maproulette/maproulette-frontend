import { Archive, ArchiveRestore, ChevronDown, LockOpen, Trash2, UserCog, X } from 'lucide-react'
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
import { BulkClearLockDialog } from './BulkClearLockDialog'
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
  const [clearLockOpen, setClearLockOpen] = useState(false)
  const bulkStatus = api.task.useBulkUpdateStatus()
  const bulkDelete = api.task.useBulkDelete()
  const bulkArchive = api.task.useBulkArchive()
  const bulkReassign = api.task.useBulkReassign()
  const bulkClearLock = api.task.useBulkClearLock()

  if (selectedIds.length === 0) return null

  const handleStatus = async (status: number) => {
    try {
      await bulkStatus.mutateAsync({ taskIds: selectedIds, status })
      toast.success(
        t(
          'managementPages.bulkActionsToolbar.updatedToast',
          { count: selectedIds.length },
          '{count, plural, one {Updated # task} other {Updated # tasks}}'
        )
      )
      onClearSelection()
    } catch (error) {
      logger.error('Bulk status failed', { error })
      toast.error(
        t('managementPages.bulkActionsToolbar.updateError', undefined, 'Could not update tasks')
      )
    }
  }

  const handleDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(selectedIds)
      if (result.denied.length > 0) {
        toast.warning(
          t(
            'managementPages.bulkActionsToolbar.deleteWarning',
            { deleted: result.deleted, denied: result.denied.length },
            'Deleted {deleted} tasks; {denied} could not be deleted'
          )
        )
      } else {
        toast.success(
          t(
            'managementPages.bulkActionsToolbar.deleteSuccess',
            { count: result.deleted },
            '{count, plural, one {Deleted # task} other {Deleted # tasks}}'
          )
        )
      }
      setDeleteOpen(false)
      onClearSelection()
    } catch (error) {
      logger.error('Bulk delete failed', { error })
      toast.error(
        t('managementPages.bulkActionsToolbar.deleteError', undefined, 'Could not delete tasks')
      )
    }
  }

  const handleArchive = async (archived: boolean) => {
    try {
      await bulkArchive.mutateAsync({ taskIds: selectedIds, archived })
      toast.success(
        archived
          ? t(
              'managementPages.bulkActionsToolbar.archivedToast',
              { count: selectedIds.length },
              '{count, plural, one {Archived # task} other {Archived # tasks}}'
            )
          : t(
              'managementPages.bulkActionsToolbar.unarchivedToast',
              { count: selectedIds.length },
              '{count, plural, one {Unarchived # task} other {Unarchived # tasks}}'
            )
      )
      onClearSelection()
    } catch (error) {
      logger.error('Bulk archive failed', { error })
      toast.error(
        t('managementPages.bulkActionsToolbar.archiveError', undefined, 'Could not archive tasks')
      )
    }
  }

  const handleReassign = async (userId: number) => {
    try {
      const result = await bulkReassign.mutateAsync({ taskIds: selectedIds, userId })
      toast.success(
        t(
          'managementPages.bulkActionsToolbar.reassignSuccess',
          { updated: result.updated, requested: result.requested },
          'Reassigned {updated} of {requested} tasks'
        )
      )
      setReassignOpen(false)
      onClearSelection()
    } catch (error) {
      logger.error('Bulk reassign failed', { error })
      toast.error(
        t('managementPages.bulkActionsToolbar.reassignError', undefined, 'Could not reassign tasks')
      )
    }
  }

  const handleClearLock = async () => {
    try {
      await bulkClearLock.mutateAsync(selectedIds)
      toast.success(
        t(
          'managementPages.bulkActionsToolbar.clearLockSuccess',
          { count: selectedIds.length },
          '{count, plural, one {Cleared lock on # task} other {Cleared lock on # tasks}}'
        )
      )
      setClearLockOpen(false)
      onClearSelection()
    } catch (error) {
      logger.error('Bulk clear lock failed', { error })
      toast.error(
        t('managementPages.bulkActionsToolbar.clearLockError', undefined, 'Could not clear locks')
      )
    }
  }

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <span className="font-medium text-sm">
        {t(
          'managementPages.bulkActionsToolbar.selectedCount',
          { count: selectedIds.length },
          '{count} selected'
        )}
      </span>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t('managementPages.bulkActionsToolbar.changeStatus', undefined, 'Change status')}{' '}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusOpen(true)}>
              {t('managementPages.bulkActionsToolbar.pickStatus', undefined, 'Pick a status…')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Archive className="size-3.5" aria-hidden="true" />{' '}
              {t('managementPages.bulkActionsToolbar.archive', undefined, 'Archive')}{' '}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleArchive(true)}>
              <Archive className="size-3.5" aria-hidden="true" />{' '}
              {t('managementPages.bulkActionsToolbar.archive', undefined, 'Archive')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleArchive(false)}>
              <ArchiveRestore className="size-3.5" aria-hidden="true" />{' '}
              {t('managementPages.bulkActionsToolbar.unarchive', undefined, 'Unarchive')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={() => setReassignOpen(true)}>
          <UserCog className="size-3.5" aria-hidden="true" />{' '}
          {t('managementPages.bulkActionsToolbar.reassign', undefined, 'Reassign')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setClearLockOpen(true)}>
          <LockOpen className="size-3.5" aria-hidden="true" />{' '}
          {t('managementPages.bulkActionsToolbar.clearLock', undefined, 'Clear lock')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-3.5" aria-hidden="true" />{' '}
          {t('common.delete', undefined, 'Delete')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="size-3.5" aria-hidden="true" /> {t('common.clear', undefined, 'Clear')}
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
      <BulkClearLockDialog
        open={clearLockOpen}
        onOpenChange={setClearLockOpen}
        onConfirm={handleClearLock}
        count={selectedIds.length}
        busy={bulkClearLock.isPending}
      />
    </div>
  )
}
