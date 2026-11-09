import { Link } from '@tanstack/react-router'
import { Archive, Eye, FolderKanban, PanelLeftOpen, Pin, Plus, User } from 'lucide-react'
import { useState } from 'react'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
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
    challengeCountsByProjectId,
  } = useManageProjectsContext()

  const [showPanel, setShowPanel] = useState(true)

  useSetHeaderActions(
    <Button asChild size="sm" className="gap-1.5 rounded-full">
      <Link to="/manage/project/new">
        <Plus className="h-4 w-4" />
        {t({ id: 'common.createProject', defaultMessage: 'Create Project' })}
      </Link>
    </Button>
  )

  return (
    <div className="h-full">
      <div className={cn('grid h-full grid-cols-1 gap-6', showPanel ? 'lg:grid-cols-4' : '')}>
        {showPanel && (
          <ManageInfoPanel
            title={t({ id: 'manageProjects.content.aboutTitle', defaultMessage: 'About Projects' })}
            description={t({
              id: 'manageProjects.content.aboutDescription',
              defaultMessage:
                'Good project structure improves mapper clarity, QA consistency, and long-term maintenance.',
            })}
            sections={[
              {
                id: 'manageProjects.content.tipScopeTitle',
                title: t({
                  id: 'manageProjects.content.tipScopeTitle',
                  defaultMessage: 'Define scope early',
                }),
                description: t({
                  id: 'manageProjects.content.tipScopeBody',
                  defaultMessage:
                    'Use a stable naming pattern (region, theme, version) and keep each project focused on one clear objective.',
                }),
              },
              {
                id: 'manageProjects.content.tipPublishTitle',
                title: t({
                  id: 'manageProjects.content.tipPublishTitle',
                  defaultMessage: 'Publish intentionally',
                }),
                description: t({
                  id: 'manageProjects.content.tipPublishBody',
                  defaultMessage:
                    'Keep projects non-discoverable while iterating. Turn discoverable on only after instructions and QA checks are validated.',
                }),
              },
              {
                id: 'manageProjects.content.tipOwnershipTitle',
                title: t({
                  id: 'manageProjects.content.tipOwnershipTitle',
                  defaultMessage: 'Share ownership',
                }),
                description: t({
                  id: 'manageProjects.content.tipOwnershipBody',
                  defaultMessage:
                    'Add co-managers before launch so triage, support, and archival responsibilities are covered.',
                }),
              },
            ]}
            docs={[
              {
                page: 'projectsAndProjectManagers',
                text: t({
                  id: 'manageProjects.content.projectManagement',
                  defaultMessage: 'Project Management',
                }),
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
                  title={t({ id: 'common.showPanel', defaultMessage: 'Show panel' })}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t({
                  id: 'common.searchProjects',
                  defaultMessage: 'Search projects...',
                })}
              />
              <FilterToggle
                label={t({ id: 'common.discoverable', defaultMessage: 'Discoverable' })}
                icon={Eye}
                checked={onlyEnabled}
                onCheckedChange={setOnlyEnabled}
              />
              <FilterToggle
                label={t({ id: 'common.owned', defaultMessage: 'Owned' })}
                icon={User}
                checked={onlyOwned}
                onCheckedChange={setOnlyOwned}
              />
              <FilterToggle
                label={t({ id: 'common.pinned', defaultMessage: 'Pinned' })}
                icon={Pin}
                checked={onlyShowPinned}
                onCheckedChange={setOnlyShowPinned}
              />
              <FilterToggle
                label={t({ id: 'common.archived', defaultMessage: 'Archived' })}
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
                  challengeCountsByProjectId={challengeCountsByProjectId}
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
                      {t({ id: 'common.noProjectsFound', defaultMessage: 'No projects found' })}
                    </EmptyTitle>
                    <EmptyDescription>
                      {t({
                        id: 'manageProjects.content.noProjectsDescription',
                        defaultMessage: 'Get started by creating your first project.',
                      })}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild>
                      <Link to="/manage/project/new">
                        <Plus />
                        {t({ id: 'common.createProject', defaultMessage: 'Create Project' })}
                      </Link>
                    </Button>
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
                    const challengeStats = challengeCountsByProjectId[projectId]
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
                    title: t({ id: 'common.noProjectsFound', defaultMessage: 'No projects found' }),
                    description: t({
                      id: 'manageProjects.content.noProjectsDescriptionShort',
                      defaultMessage: 'Get started by creating your first project',
                    }),
                    actionLabel: t({
                      id: 'common.createProject',
                      defaultMessage: 'Create Project',
                    }),
                    actionTo: '/manage/project/new',
                  }}
                />
              </div>
            )}

            {!isLoading && (projectsToShow?.length ?? 0) > 0 && (
              <LoadMoreFooter
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onLoadMore={loadMore}
              />
            )}
          </div>
        </div>
      </div>
      <DeleteProjectDialog />
    </div>
  )
}
