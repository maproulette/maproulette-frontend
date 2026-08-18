import { Link } from '@tanstack/react-router'
import { Archive, BookOpen, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/Separator'
import { useIntl } from '@/i18n'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

/** Left-hand panel of the project detail page: project info, quick actions, stats and playbook tips. */
export const ProjectDetailSidebar = () => {
  const { t } = useIntl()
  const {
    projectId,
    project,
    projectData,
    isLoadingProject,
    isLoadingChallenges,
    filteredChallenges,
    challengeSummary,
    handleArchiveProject,
    handleToggleEnabled,
    setDeleteProjectConfirm,
  } = useManageProjectDetailContext()
  const filteredChallengesCount = filteredChallenges.length

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
      {/* Header */}
      <div className="space-y-2.5 px-6 pt-6 pb-4">
        {/* Taxonomy badges */}
        {!isLoadingProject && (project?.featured || project?.isArchived) && (
          <ul className="flex flex-wrap items-center gap-2.5">
            {project?.featured && (
              <li>
                <span className="font-medium text-cyan-500 text-xs uppercase tracking-wide dark:text-cyan-400">
                  {t('common.featured', undefined, 'Featured')}
                </span>
              </li>
            )}
            {project?.isArchived && (
              <li>
                <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
                  {t('common.archived', undefined, 'Archived')}
                </span>
              </li>
            )}
          </ul>
        )}

        {/* Title */}
        <h1 className="line-clamp-2 font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
          {projectData?.displayName || projectData?.name}
        </h1>

        {/* Metadata line */}
        {!isLoadingProject && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0 font-medium text-xs text-zinc-600 dark:text-zinc-400">
            <StatusBadge enabled={projectData?.enabled || false} />
            <span className="text-zinc-400 dark:text-zinc-500">•</span>
            <span className="whitespace-nowrap">
              {t('common.idNumber', { id: projectId }, 'ID {id}')}
            </span>
          </div>
        )}
      </div>

      {projectData?.description && (
        <div className="px-6 py-4">
          <p className="text-pretty text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">
            {projectData.description}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
        <div className="flex flex-col gap-2">
          <Link to="/project/$projectId" params={{ projectId }} className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 rounded-full">
              <Eye className="h-4 w-4" />
              {t('manageProjectDetail.content.viewProjectPage', undefined, 'View project page')}
            </Button>
          </Link>
          <Link to="/manage/project/$projectId/edit" params={{ projectId }} className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 rounded-full">
              <Pencil className="h-4 w-4" />
              {t('common.editProject', undefined, 'Edit project')}
            </Button>
          </Link>
          <Link
            to="/manage/challenge/new"
            search={{ projectId: Number(projectId) }}
            className="block"
          >
            <Button size="sm" className="w-full justify-start gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              {t('manageProjectDetail.content.createChallenge', undefined, 'Create challenge')}
            </Button>
          </Link>
          {!isLoadingProject && projectData?.id != null && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveProject}
                className="w-full justify-start gap-2 rounded-full"
              >
                <Archive className="h-4 w-4" />
                {project?.isArchived
                  ? t('common.unarchiveProject', undefined, 'Unarchive project')
                  : t('common.archiveProject', undefined, 'Archive project')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEnabled}
                className="w-full justify-start gap-2 rounded-full"
              >
                {project?.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {project?.enabled
                  ? t('manageProjectDetail.content.disableProject', undefined, 'Disable project')
                  : t('manageProjectDetail.content.enableProject', undefined, 'Enable project')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteProjectConfirm(true)}
                className="w-full justify-start gap-2 rounded-full text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.deleteProject', undefined, 'Delete project')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
        <div className="space-y-3">
          {!(isLoadingProject || isLoadingChallenges) && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('common.challenges', undefined, 'Challenges')}
                </span>
                <span className="font-semibold tabular-nums">{challengeSummary.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('common.shown', undefined, 'Shown')}
                </span>
                <span className="font-semibold tabular-nums">{filteredChallengesCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('common.discoverable', undefined, 'Discoverable')}
                </span>
                <span className="font-semibold tabular-nums">{challengeSummary.enabled}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {t('common.tasksRemaining', undefined, 'Tasks remaining')}
                </span>
                <span className="font-bold text-base tabular-nums">
                  {challengeSummary.tasksRemaining}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Playbook footer */}
      <div className="mt-auto border-zinc-200/50 border-t bg-zinc-50/50 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <p className="mb-1 font-medium text-sm text-zinc-700 dark:text-zinc-300">
          {t('manageProjectDetail.content.playbookTitle', undefined, 'Project Playbook')}
        </p>
        <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <p>
            {t(
              'manageProjectDetail.content.playbookTip1',
              undefined,
              'Confirm challenge instructions and QA expectations are specific and testable.'
            )}
          </p>
          <p>
            {t(
              'manageProjectDetail.content.playbookTip2',
              undefined,
              'Review challenge ordering so mappers can move from easier to harder tasks.'
            )}
          </p>
          <p>
            {t(
              'manageProjectDetail.content.playbookTip3',
              undefined,
              'Assign at least one co-manager for triage, support, and archival continuity.'
            )}
          </p>
        </div>
        <a
          href="https://learn.maproulette.org/documentation/project-management/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-700 hover:underline dark:text-zinc-200"
        >
          <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
          {t(
            'manageProjectDetail.content.playbookDocsLink',
            undefined,
            'Open project management docs'
          )}
        </a>
      </div>
    </div>
  )
}
