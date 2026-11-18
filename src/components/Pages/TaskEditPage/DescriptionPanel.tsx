import { ArrowLeft, BookOpen, FolderOpen } from 'lucide-react'
import { api } from '@/api'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { useIntl } from '@/i18n'
import { useChallengeContext } from './contexts/ChallengeContext'
import {
  challengeDescriptionText,
  projectDescriptionText,
} from './contexts/descriptionRecommendation'
import { type PanelView, usePanelViewContext } from './contexts/PanelViewContext'

/**
 * The challenge or project description, filling the task panel while it's open. Reached from
 * the breadcrumb in the task header, and left again with the back button.
 */
export const DescriptionPanel = ({ view }: { view: Exclude<PanelView, 'task'> }) => {
  const { t } = useIntl()
  const { challenge } = useChallengeContext()
  const { data: project } = api.project.getProject(challenge?.parent)
  const { showView } = usePanelViewContext()

  const isChallenge = view === 'challengeDescription'
  const Icon = isChallenge ? BookOpen : FolderOpen
  const name = isChallenge ? challenge?.name : (project?.displayName ?? project?.name)
  const description = isChallenge
    ? challengeDescriptionText(challenge)
    : projectDescriptionText(project)

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border-gradient bg-panel md:h-full">
      <div className="shrink-0 border-line-gradient border-b p-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1.5 gap-1.5 text-fg-muted"
          onClick={() => showView('task')}
        >
          <ArrowLeft className="size-4" />
          {t({ id: 'taskEditPage.descriptionPanel.backToTask', defaultMessage: 'Back to task' })}
        </Button>
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-link" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-fg-muted text-xs">
              {isChallenge
                ? t({
                    id: 'taskEditPage.descriptionPanel.challengeTitle',
                    defaultMessage: 'About this challenge',
                  })
                : t({
                    id: 'taskEditPage.descriptionPanel.projectTitle',
                    defaultMessage: 'About this project',
                  })}
            </p>
            <h2 className="truncate font-bold text-base text-fg leading-tight">{name}</h2>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {description ? (
            <MarkdownContent shortCodes={isChallenge}>{description}</MarkdownContent>
          ) : (
            <p className="text-fg-muted text-sm">
              {isChallenge
                ? t({
                    id: 'taskEditPage.descriptionPanel.noChallengeDescription',
                    defaultMessage: 'This challenge has no description.',
                  })
                : t({
                    id: 'taskEditPage.descriptionPanel.noProjectDescription',
                    defaultMessage: 'This project has no description.',
                  })}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
