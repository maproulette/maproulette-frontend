import { useNavigate } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { ProjectPickerButton } from '@/components/shared/ProjectPickerButton'
import { ProjectPickerModal } from '@/components/shared/ProjectPickerModal'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

interface CloneChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: number
  challengeName: string
  currentProjectId?: number
}

export const CloneChallengeModal = ({
  open,
  onOpenChange,
  challengeId,
  challengeName,
  currentProjectId,
}: CloneChallengeModalProps) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const nameId = useId()
  const projectId = useId()
  const [newName, setNewName] = useState(`${challengeName} (Copy)`)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(currentProjectId)
  const [pickerOpen, setPickerOpen] = useState(false)

  const cloneMutation = api.challenge.useCloneChallenge()

  const handleClone = () => {
    if (!newName.trim()) {
      toast.error(
        t(
          'browsedChallengePage.challengeModals.cloneModal.nameRequiredError',
          undefined,
          'Please enter a name for the cloned challenge'
        )
      )
      return
    }
    if (!selectedProjectId) {
      toast.error(t('common.pleaseSelectAProject', undefined, 'Please select a project'))
      return
    }
    cloneMutation.mutate(
      { challengeId, newName: newName.trim(), projectId: selectedProjectId },
      {
        onSuccess: async (clonedChallenge) => {
          toast.success(
            t(
              'browsedChallengePage.challengeModals.cloneModal.cloneSuccess',
              undefined,
              'Challenge cloned successfully'
            )
          )
          onOpenChange(false)

          if (clonedChallenge.id) {
            await navigate({
              to: '/manage/challenge/$challengeId',
              params: { challengeId: String(clonedChallenge.id) },
            })
          }
        },
        onError: (error: Error) => {
          logger.error('Error cloning challenge', { error })
          toast.error(
            error.message ||
              t(
                'browsedChallengePage.challengeModals.cloneModal.cloneError',
                undefined,
                'Failed to clone challenge'
              )
          )
        },
      }
    )
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewName(`${challengeName} (Copy)`)
      setSelectedProjectId(currentProjectId)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-5" />
            {t('common.cloneChallenge', undefined, 'Clone Challenge')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'browsedChallengePage.challengeModals.cloneModal.description',
              undefined,
              'Create a copy of this challenge in any project you manage, including this one. The cloned challenge will include all settings but will start with no tasks.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Challenge Name Input */}
          <div className="space-y-2">
            <Label htmlFor={nameId}>
              {t(
                'browsedChallengePage.challengeModals.cloneModal.nameLabel',
                undefined,
                'New Challenge Name'
              )}
            </Label>
            <Input
              id={nameId}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t(
                'browsedChallengePage.challengeModals.cloneModal.namePlaceholder',
                undefined,
                'Enter name for cloned challenge'
              )}
              maxLength={255}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor={projectId}>
              {t(
                'browsedChallengePage.challengeModals.cloneModal.projectLabel',
                undefined,
                'Select Project'
              )}
            </Label>
            <ProjectPickerButton
              id={projectId}
              projectId={selectedProjectId}
              onClick={() => setPickerOpen(true)}
            />
            <ProjectPickerModal
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              selectedProjectId={selectedProjectId}
              onSelectProject={(project) => {
                if (project.id != null) setSelectedProjectId(project.id)
              }}
              description={t(
                'browsedChallengePage.challengeModals.cloneModal.projectPickerDescription',
                undefined,
                'Choose the project the cloned challenge will be created in. Any project you manage works, including this one.'
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={cloneMutation.isPending}
          >
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
          <Button
            onClick={handleClone}
            disabled={!newName.trim() || !selectedProjectId || cloneMutation.isPending}
          >
            {cloneMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                {t(
                  'browsedChallengePage.challengeModals.cloneModal.cloning',
                  undefined,
                  'Cloning...'
                )}
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                {t('common.cloneChallenge', undefined, 'Clone Challenge')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
