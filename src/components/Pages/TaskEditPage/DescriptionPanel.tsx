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
    <div className="flex w-full flex-col overflow-hidden md:h-full">
      <div className="shrink-0 rounded-t-lg border-slate-200 border-b bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1.5 gap-1.5 text-zinc-600 dark:text-zinc-300"
          onClick={() => showView('task')}
        >
          <ArrowLeft className="size-4" />
          {t('taskEditPage.descriptionPanel.backToTask', undefined, 'Back to task')}
        </Button>
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isChallenge
                ? t(
                    'taskEditPage.descriptionPanel.challengeTitle',
                    undefined,
                    'About this challenge'
                  )
                : t('taskEditPage.descriptionPanel.projectTitle', undefined, 'About this project')}
            </p>
            <h2 className="truncate font-bold text-base text-zinc-900 leading-tight dark:text-zinc-100">
              {name}
            </h2>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {description ? (
            <MarkdownContent>{description}</MarkdownContent>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-slate-400">
              {isChallenge
                ? t(
                    'taskEditPage.descriptionPanel.noChallengeDescription',
                    undefined,
                    'This challenge has no description.'
                  )
                : t(
                    'taskEditPage.descriptionPanel.noProjectDescription',
                    undefined,
                    'This project has no description.'
                  )}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
