import { Link } from '@tanstack/react-router'
import {
  Archive,
  CheckCircle2,
  Eye,
  FolderKanban,
  PanelLeftOpen,
  Pin,
  Plus,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { type ChallengeMeta, ProjectCard } from '@/components/shared/ProjectCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { ViewModeToggle } from '@/components/shared/ViewModeToggle'
import { Button } from '@/components/ui/Button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'
import { Spinner } from '@/components/ui/Spinner'
import { useSetHeaderActions } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { ManageInfoPanel } from '../shared/ManageInfoPanel'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { useManageProjectsContext } from './ManageProjectsContext'
import { ProjectActions } from './ProjectActions'
import { ProjectsTableView } from './ProjectsTableView'

export const ManageProjectsContent = () => {
  const { t } = useIntl()
  const {
    projectsToShow,
    isLoading,
    isFetching,
    hasNextPage,
    searchQuery,
    setSearchQuery,
    onlyEnabled,
    setOnlyEnabled,
    onlyOwned,
    setOnlyOwned,
    onlyShowArchived,
    setOnlyShowArchived,
    onlyShowPinned,
    setOnlyShowPinned,
    viewMode,
    setViewMode,
    loadMore,
    pinnedProjectIds,
    toggleProjectPin,
    challengesPerProject,
  } = useManageProjectsContext()

  const [showPanel, setShowPanel] = useState(true)

  useSetHeaderActions(
    <Link to="/manage/project/new">
      <Button size="sm" className="gap-1.5 rounded-full">
        <Plus className="h-4 w-4" />
        {t('common.createProject', undefined, 'Create Project')}
      </Button>
    </Link>
  )

  return (
    <div className="h-full">
      <div className={cn('grid h-full grid-cols-1 gap-6', showPanel ? 'lg:grid-cols-4' : '')}>
        {showPanel && (
          <ManageInfoPanel
            title={t('manageProjects.content.aboutTitle')}
            description={t('manageProjects.content.aboutDescription')}
            sections={[
              {
                id: 'manageProjects.content.tipScopeTitle',
                title: t('manageProjects.content.tipScopeTitle'),
                description: t('manageProjects.content.tipScopeBody'),
              },
              {
                id: 'manageProjects.content.tipPublishTitle',
                title: t('manageProjects.content.tipPublishTitle'),
                description: t('manageProjects.content.tipPublishBody'),
              },
              {
                id: 'manageProjects.content.tipOwnershipTitle',
                title: t('manageProjects.content.tipOwnershipTitle'),
                description: t('manageProjects.content.tipOwnershipBody'),
              },
            ]}
            docs={[
              {
                page: 'projectsAndProjectManagers',
                text: t('manageProjects.content.projectManagement'),
              },
            ]}
            onClose={() => setShowPanel(false)}
          />
        )}

        <div
          className={cn('flex h-full min-h-0 min-w-0 flex-col', showPanel ? 'lg:col-span-3' : '')}
        >
          <div className="shrink-0 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {!showPanel && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowPanel(true)}
                  title={t('common.showPanel', undefined, 'Show panel')}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('common.searchProjects', undefined, 'Search projects...')}
              />
              <FilterToggle
                label={t('common.discoverable', undefined, 'Discoverable')}
                icon={Eye}
                checked={onlyEnabled}
                onCheckedChange={setOnlyEnabled}
              />
              <FilterToggle
                label={t('common.owned', undefined, 'Owned')}
                icon={User}
                checked={onlyOwned}
                onCheckedChange={setOnlyOwned}
              />
              <FilterToggle
                label={t('common.pinned', undefined, 'Pinned')}
                icon={Pin}
                checked={onlyShowPinned}
                onCheckedChange={setOnlyShowPinned}
              />
              <FilterToggle
                label={t('common.archived', undefined, 'Archived')}
                icon={Archive}
                checked={onlyShowArchived}
                onCheckedChange={setOnlyShowArchived}
              />
              <ClearManageFiltersButton
                hasActiveFilters={onlyEnabled || onlyOwned || onlyShowPinned || onlyShowArchived}
                onClear={() => {
                  setOnlyEnabled(false)
                  setOnlyOwned(false)
                  setOnlyShowPinned(false)
                  setOnlyShowArchived(false)
                }}
              />
              <div className="ml-auto">
                <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Projects: List or Grid */}
            {isLoading ? null : viewMode === 'list' ? (
              (projectsToShow?.length ?? 0) > 0 ? (
                <ProjectsTableView
                  projects={projectsToShow}
                  challengeCountsByProjectId={challengesPerProject}
                  pinnedProjectIds={pinnedProjectIds}
                  onTogglePin={toggleProjectPin}
                />
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderKanban />
                    </EmptyMedia>
                    <EmptyTitle>
                      {t('common.noProjectsFound', undefined, 'No projects found')}
                    </EmptyTitle>
                    <EmptyDescription>
                      {t(
                        'manageProjects.content.noProjectsDescription',
                        undefined,
                        'Get started by creating your first project.'
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Link to="/manage/project/new">
                      <Button>
                        <Plus />
                        {t('common.createProject', undefined, 'Create Project')}
                      </Button>
                    </Link>
                  </EmptyContent>
                </Empty>
              )
            ) : (
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
              >
                <EntityGrid
                  items={projectsToShow}
                  renderItem={(proj) => {
                    const projectId = proj.id
                    const isPinned = projectId != null && pinnedProjectIds.includes(projectId)
                    const totalTasks = proj.completionMetrics?.total ?? 0
                    const completed = totalTasks - (proj.completionMetrics?.tasksRemaining ?? 0)
                    const challengeStats = challengesPerProject[projectId]
                    const challengeMeta: ChallengeMeta = {
                      totalTasks,
                      completed,
                    }
                    return (
                      <ProjectCard
                        project={proj}
                        challengeMeta={challengeMeta}
                        totalChallenges={challengeStats?.total}
                        completedChallenges={challengeStats?.completed}
                        linkTo="/manage/project/$projectId"
                        linkParams={{ projectId: String(projectId) }}
                        actions={<ProjectActions project={proj} isPinned={isPinned} />}
                      />
                    )
                  }}
                  getItemKey={(proj) => proj.id ?? crypto.randomUUID()}
                  emptyState={{
                    icon: FolderKanban,
                    title: t('common.noProjectsFound', undefined, 'No projects found'),
                    description: t(
                      'manageProjects.content.noProjectsDescriptionShort',
                      undefined,
                      'Get started by creating your first project'
                    ),
                    actionLabel: t('common.createProject', undefined, 'Create Project'),
                    actionTo: '/manage/project/new',
                  }}
                />
              </div>
            )}

            {/* Load More / End of list */}
            {!isLoading &&
              (projectsToShow?.length ?? 0) > 0 &&
              (hasNextPage ? (
                <div className="flex justify-center p-4">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={loadMore}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <>
                        <Spinner />
                        {t('common.loading2', undefined, 'Loading...')}
                      </>
                    ) : (
                      t('common.loadMore', undefined, 'Load More')
                    )}
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-2 border-zinc-200 border-t p-6 text-center dark:border-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-zinc-400 dark:text-slate-500" />
                  <p className="font-medium text-sm text-zinc-600 dark:text-slate-400">
                    {t(
                      'common.youveReachedTheEndOfTheList',
                      undefined,
                      "You've reached the end of the list"
                    )}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <DeleteProjectDialog />
    </div>
  )
}
