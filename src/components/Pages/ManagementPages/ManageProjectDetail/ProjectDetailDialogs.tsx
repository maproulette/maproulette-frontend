import { CloneChallengeModal } from '@/components/Pages/BrowsedChallengePage/ChallengePanel/ChallengeModals/CloneChallengeModal'
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
import { useIntl } from '@/i18n'
import { MoveChallengeModal } from '../MoveChallengeModal'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

/** Modals and confirmation dialogs used by the project detail page (move/clone/rebuild/delete). */
export const ProjectDetailDialogs = () => {
  const { t } = useIntl()
  const {
    projectId,
    cloneModalChallenge,
    setCloneModalChallenge,
    rebuildModalChallenge,
    setRebuildModalChallenge,
    deleteChallengeId,
    setDeleteChallengeId,
    confirmDeleteChallenge,
    deleteProjectConfirm,
    setDeleteProjectConfirm,
    confirmDeleteProject,
  } = useManageProjectDetailContext()

  return (
    <>
      <MoveChallengeModal />

      {cloneModalChallenge && (
        <CloneChallengeModal
          open={!!cloneModalChallenge}
          onOpenChange={(open) => !open && setCloneModalChallenge(null)}
          challengeId={cloneModalChallenge.id}
          challengeName={cloneModalChallenge.name}
          currentProjectId={Number(projectId)}
        />
      )}

      {rebuildModalChallenge?.id != null && (
        <RebuildTasksDialog
          open={!!rebuildModalChallenge}
          onOpenChange={(open) => !open && setRebuildModalChallenge(null)}
          challengeId={rebuildModalChallenge.id}
          sourceType={getChallengeSourceType(rebuildModalChallenge)}
        />
      )}

      <AlertDialog
        open={deleteChallengeId != null}
        onOpenChange={(open) => !open && setDeleteChallengeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.deleteChallenge2', undefined, 'Delete challenge?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'common.deleteChallengeWarning',
                undefined,
                'This will delete this challenge and all its tasks. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChallenge}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectConfirm} onOpenChange={setDeleteProjectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.deleteProject2', undefined, 'Delete project?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'manageProjectDetail.content.deleteProjectDescription',
                undefined,
                'This will delete this project and all its challenges and tasks. This action cannot be undone.'
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
    </>
  )
}
