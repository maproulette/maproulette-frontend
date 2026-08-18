import { useNavigate } from '@tanstack/react-router'
import { Copy, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
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
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId != null ? String(currentProjectId) : ''
  )

  // Every project the user manages is a valid destination, including the challenge's
  // own: challenge names only need to be unique within a project, so a renamed clone
  // can stay where it is.
  const { data: availableProjects = [], isLoading: isLoadingProjects } =
    api.project.getManagedProjects({
      limit: 100,
      page: 0,
      onlyEnabled: false,
      onlyOwned: false,
      searchString: '',
    })

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
      { challengeId, newName: newName.trim(), projectId: Number(selectedProjectId) },
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
          logger.error('Error cloning challenge', { error: String(error) })
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
      setSelectedProjectId(currentProjectId != null ? String(currentProjectId) : '')
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
            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-zinc-400" />
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {t(
                  'browsedChallengePage.challengeModals.cloneModal.noProjects',
                  undefined,
                  'No projects available. You need to be a manager of at least one project to clone challenges.'
                )}
              </div>
            ) : (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id={projectId} className="w-full">
                  <SelectValue
                    placeholder={t(
                      'browsedChallengePage.challengeModals.cloneModal.projectPlaceholder',
                      undefined,
                      'Choose a project...'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="max-h-60">
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.displayName || project.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
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
            disabled={
              !newName.trim() || !selectedProjectId || cloneMutation.isPending || isLoadingProjects
            }
          >
            {cloneMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
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
