import { Link } from '@tanstack/react-router'
import { Archive, BookOpen, Eye, EyeOff, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { DocsLink } from '@/components/shared/DocsLink'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/Separator'
import { useIntl } from '@/i18n'
import { EditSelectedChallengesButton } from './ChallengeSelection'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

/** Left-hand panel of the project detail page: project info, quick actions, stats and a docs link. */
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
    setManagersModalOpen,
  } = useManageProjectDetailContext()
  const filteredChallengesCount = filteredChallenges.length

  return (
    // Scrolls rather than clips: the panel grows with the project's managers and
    // teams, and the docs footer below them would otherwise be cut off.
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border border-line bg-panel">
      {/* Header */}
      <div className="shrink-0 space-y-2.5 px-6 pt-6 pb-4">
        {/* Taxonomy badges */}
        {!isLoadingProject && (project?.featured || project?.isArchived) && (
          <ul className="flex flex-wrap items-center gap-2.5">
            {project?.featured && (
              <li>
                <span className="font-medium text-highlight text-xs uppercase tracking-wide">
                  {t({ id: 'common.featured', defaultMessage: 'Featured' })}
                </span>
              </li>
            )}
            {project?.isArchived && (
              <li>
                <span className="font-medium text-fg-muted text-xs uppercase tracking-wide">
                  {t({ id: 'common.archived', defaultMessage: 'Archived' })}
                </span>
              </li>
            )}
          </ul>
        )}

        {/* Title */}
        <h1 className="line-clamp-2 font-bold text-base text-fg leading-tight tracking-tight">
          {projectData?.displayName || projectData?.name}
        </h1>

        {/* Metadata line */}
        {!isLoadingProject && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0 font-medium text-fg-muted text-xs">
            <StatusBadge enabled={projectData?.enabled || false} />
            <span className="text-fg-subtle">•</span>
            <span className="whitespace-nowrap">
              {t({ id: 'common.idNumber', defaultMessage: 'ID {id}' }, { id: projectId })}
            </span>
          </div>
        )}
      </div>

      {projectData?.description && (
        <div className="shrink-0 px-6 py-4">
          <MarkdownContent className="text-pretty text-fg">
            {projectData.description}
          </MarkdownContent>
        </div>
      )}

      {/* Action buttons */}
      <div className="shrink-0 border-line border-t px-6 py-4">
        <div className="flex flex-col gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-full"
          >
            <Link to="/project/$projectId" params={{ projectId }}>
              <Eye className="h-4 w-4" />
              {t({
                id: 'manageProjectDetail.content.viewProjectPage',
                defaultMessage: 'View project page',
              })}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-full"
          >
            <Link to="/manage/project/$projectId/edit" params={{ projectId }}>
              <Pencil className="h-4 w-4" />
              {t({ id: 'common.editProject', defaultMessage: 'Edit project' })}
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full justify-start gap-2 rounded-full">
            <Link to="/manage/challenge/new" search={{ projectId: Number(projectId) }}>
              <Plus className="h-4 w-4" />
              {t({
                id: 'manageProjectDetail.content.createChallenge',
                defaultMessage: 'Create challenge',
              })}
            </Link>
          </Button>
          <EditSelectedChallengesButton />
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
                  ? t({ id: 'common.unarchiveProject', defaultMessage: 'Unarchive project' })
                  : t({ id: 'common.archiveProject', defaultMessage: 'Archive project' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEnabled}
                className="w-full justify-start gap-2 rounded-full"
              >
                {project?.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {project?.enabled
                  ? t({
                      id: 'manageProjectDetail.content.disableProject',
                      defaultMessage: 'Disable project',
                    })
                  : t({
                      id: 'manageProjectDetail.content.enableProject',
                      defaultMessage: 'Enable project',
                    })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagersModalOpen(true)}
                className="w-full justify-start gap-2 rounded-full"
              >
                <Users className="h-4 w-4" />
                {t({
                  id: 'manageProjectDetail.managers.modalTitle',
                  defaultMessage: 'Managers and teams',
                })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteProjectConfirm(true)}
                className="w-full justify-start gap-2 rounded-full text-danger"
              >
                <Trash2 className="h-4 w-4" />
                {t({ id: 'common.deleteProject', defaultMessage: 'Delete project' })}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 border-line border-t px-6 py-4">
        <div className="space-y-3">
          {!(isLoadingProject || isLoadingChallenges) && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">
                  {t({ id: 'common.challenges', defaultMessage: 'Challenges' })}
                </span>
                <span className="font-semibold tabular-nums">{challengeSummary.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">
                  {t({ id: 'common.shown', defaultMessage: 'Shown' })}
                </span>
                <span className="font-semibold tabular-nums">{filteredChallengesCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">
                  {t({ id: 'common.discoverable', defaultMessage: 'Discoverable' })}
                </span>
                <span className="font-semibold tabular-nums">{challengeSummary.enabled}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-fg">
                  {t({ id: 'common.tasksRemaining', defaultMessage: 'Tasks remaining' })}
                </span>
                <span className="font-bold text-base tabular-nums">
                  {challengeSummary.tasksRemaining}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto shrink-0 border-line border-t bg-muted/50 px-6 py-4">
        <DocsLink
          page="projectsAndProjectManagers"
          icon={<BookOpen className="h-3.5 w-3.5 text-fg-subtle" />}
          className="gap-2 text-fg text-xs no-underline hover:underline"
        >
          {t({
            id: 'manageProjectDetail.content.playbookDocsLink',
            defaultMessage: 'Open project management docs',
          })}
        </DocsLink>
      </div>
    </div>
  )
}
