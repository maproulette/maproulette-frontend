import {
  getChallengeSourceType,
  RebuildTasksDialog,
} from '@/components/Pages/ManagementPages/shared/RebuildTasksDialog'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { MoveChallengeModal } from '../MoveChallengeModal'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'
import { ProjectManagersPanel } from './ProjectManagersPanel'

/** Modals and confirmation dialogs used by the project detail page (move/rebuild/delete). */
export const ProjectDetailDialogs = () => {
  const { t } = useIntl()
  const {
    rebuildModalChallenge,
    setRebuildModalChallenge,
    deleteChallengeId,
    setDeleteChallengeId,
    confirmDeleteChallenge,
    deleteProjectConfirm,
    setDeleteProjectConfirm,
    confirmDeleteProject,
    managersModalOpen,
    setManagersModalOpen,
  } = useManageProjectDetailContext()

  return (
    <>
      <MoveChallengeModal />

      <Dialog open={managersModalOpen} onOpenChange={setManagersModalOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {t({ id: 'manageProjectDetail.managers.modalTitle', defaultMessage: 'Managers and teams' })}
            </DialogTitle>
            <DialogDescription>
              {t({ id: 'manageProjectDetail.managers.modalDescription', defaultMessage: 'Who can manage this project, and at what level.' }
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <ProjectManagersPanel />
          </div>
        </DialogContent>
      </Dialog>

      {rebuildModalChallenge?.id != null && (
        <RebuildTasksDialog
          open={!!rebuildModalChallenge}
          onOpenChange={(open) => !open && setRebuildModalChallenge(null)}
          challengeId={rebuildModalChallenge.id}
          sourceType={getChallengeSourceType(rebuildModalChallenge)}
          taskBundleIdProperty={rebuildModalChallenge.taskBundleIdProperty}
        />
      )}

      <AlertDialog
        open={deleteChallengeId != null}
        onOpenChange={(open) => !open && setDeleteChallengeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ id: 'common.deleteChallenge2', defaultMessage: 'Delete challenge?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({ id: 'common.deleteChallengeWarning', defaultMessage: 'This will delete this challenge and all its tasks. This action cannot be undone.' }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t({ id: 'common.cancel', defaultMessage: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChallenge}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t({ id: 'common.delete', defaultMessage: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectConfirm} onOpenChange={setDeleteProjectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ id: 'common.deleteProject2', defaultMessage: 'Delete project?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({ id: 'manageProjectDetail.content.deleteProjectDescription', defaultMessage: 'This will delete this project and all its challenges and tasks. This action cannot be undone.' }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t({ id: 'common.cancel', defaultMessage: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t({ id: 'common.delete', defaultMessage: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
