import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { useIntl } from '@/i18n'

export const ClearBundleDialog = () => {
  const { showDeleteDialog, setShowDeleteDialog, handleClearBundle, activeBundle } =
    useTaskBundleContext()
  const { t } = useIntl()
  const taskCount = activeBundle?.taskIds.length ?? 0

  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t({ id: 'taskMap.clearBundleDialog.title', defaultMessage: 'Clear Task Bundle?' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t({ id: 'taskMap.clearBundleDialog.description', defaultMessage: 'This will unbundle all {taskCount, plural, one {# task} other {# tasks}}. The tasks themselves will not be deleted, only separated. This action cannot be undone.' }, { taskCount }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t({ id: 'common.cancel', defaultMessage: 'Cancel' })}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearBundle}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
          >
            {t({ id: 'taskMap.clearBundleDialog.confirm', defaultMessage: 'Clear Bundle' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
