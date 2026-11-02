import { useMemo } from 'react'
import { ProjectPickerModal } from '@/components/shared/ProjectPickerModal'
import { useMoveChallengeContext } from '@/contexts/MoveChallengeContext'
import { useIntl } from '@/i18n'
import type { Project } from '@/types/Project'

export const MoveChallengeModal = () => {
  const { t } = useIntl()
  const {
    challenge,
    currentProjectId,
    isOpen,
    closeMoveModal,
    moveChallengeTo,
    isPending,
    isError,
  } = useMoveChallengeContext()
  const excludeProjectIds = useMemo(() => [currentProjectId], [currentProjectId])

  const handleSelectProject = (project: Project) => {
    if (project.id == null) return
    moveChallengeTo(project.id)
  }

  return (
    <ProjectPickerModal
      open={isOpen}
      onOpenChange={(open) => !open && closeMoveModal()}
      title={t({ id: 'moveChallengeModal.title', defaultMessage: 'Move Challenge' })}
      description={t({ id: 'moveChallengeModal.description', defaultMessage: 'Choose a project to move "{challengeName}" to. The challenge will be removed from the current project.' }, { challengeName: challenge?.name ?? '' }
      )}
      excludeProjectIds={excludeProjectIds}
      onSelectProject={handleSelectProject}
      closeOnSelect={false}
      disabled={isPending}
    >
      {isError && (
        <p className="text-red-600 text-sm dark:text-red-400">
          {t({ id: 'moveChallengeModal.moveError', defaultMessage: 'Failed to move challenge. You may not have permission to move to that project.' }
          )}
        </p>
      )}
    </ProjectPickerModal>
  )
}
