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
import { useManageProjectsContext } from './ManageProjectsContext'

export const DeleteProjectDialog = () => {
  const { deleteProjectConfirm, confirmDeleteProject, setDeleteProjectConfirm } =
    useManageProjectsContext()

  const { t } = useIntl()

  return (
    <AlertDialog
      open={!!deleteProjectConfirm}
      onOpenChange={(open) => !open && setDeleteProjectConfirm(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('common.deleteProject2', undefined, 'Delete project?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'manageProjects.content.deleteProjectDescription',
              { projectName: deleteProjectConfirm?.projectName ?? '' },
              'This will delete the project "{projectName}" and all its challenges and tasks. This action cannot be undone.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteProject}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t('common.delete', undefined, 'Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
