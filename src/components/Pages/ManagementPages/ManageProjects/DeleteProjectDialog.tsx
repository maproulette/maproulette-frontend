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
            {t({ id: 'common.deleteProject2', defaultMessage: 'Delete project?' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              {
                id: 'manageProjects.content.deleteProjectDescription',
                defaultMessage:
                  'This will delete the project "{projectName}" and all its challenges and tasks. This action cannot be undone.',
              },
              { projectName: deleteProjectConfirm?.projectName ?? '' }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteProject}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {t({ id: 'common.delete', defaultMessage: 'Delete' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
