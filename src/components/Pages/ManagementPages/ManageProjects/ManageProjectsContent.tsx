import { Link } from '@tanstack/react-router'
import {
  Archive,
  BookOpen,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  FolderKanban,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  Plus,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { DocsLink } from '@/components/shared/DocsLink'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { type ChallengeMeta, ProjectCard } from '@/components/shared/ProjectCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { ViewModeToggle } from '@/components/shared/ViewModeToggle'
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
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
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
import type { Project } from '@/types/Project'
import { useManageProjectsContext } from './ManageProjectsContext'
import { ProjectsTableView } from './ProjectsTableView'

// Shared styling for the docs links in the "Helpful Docs" panel.
const DOCS_LINK_CLASS =
  'gap-2 text-xs text-zinc-700 no-underline hover:underline dark:text-zinc-200'

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
    showPanel,
    setShowPanel,
    loadMore,
    pinnedProjectIds,
    toggleProjectPin,
    challengeCountsByProjectId,
    updateProject,
    handleExportCsv,
    handleArchiveProject,
    deleteProjectConfirm,
    handleDeleteProject,
    confirmDeleteProject,
    setDeleteProjectConfirm,
  } = useManageProjectsContext()

  useSetHeaderActions(
    <Button asChild size="sm" className="gap-1.5 rounded-full">
      <Link to="/manage/project/new">
        <Plus className="h-4 w-4" />
        {t({ id: 'common.createProject', defaultMessage: 'Create Project' })}
      </Link>
    </Button>
  )

  const buildProjectActions = (proj: Project, isPinned: boolean) => {
    const projectId = proj.id
    return (
      <div className="flex items-center gap-1">
        {projectId != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              toggleProjectPin(projectId)
            }}
            title={
              isPinned
                ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
                : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
            }
            aria-label={
              isPinned
                ? t({ id: 'common.unpinProject', defaultMessage: 'Unpin project' })
                : t({ id: 'common.pinProject', defaultMessage: 'Pin project' })
            }
          >
            <Pin
              className={cn(
                'h-4 w-4',
                isPinned
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {projectId != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              updateProject(projectId, { enabled: !(proj.enabled ?? false) })
            }}
            title={
              proj.enabled
                ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
                : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
            }
            aria-label={
              proj.enabled
                ? t({ id: 'common.makeNotDiscoverable', defaultMessage: 'Make not discoverable' })
                : t({ id: 'common.makeDiscoverable', defaultMessage: 'Make discoverable' })
            }
          >
            {proj.enabled ? (
              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400" />
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to="/manage/project/$projectId"
                params={{ projectId: String(projectId) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {t({ id: 'common.viewProject', defaultMessage: 'View project' })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/manage/project/$projectId/edit"
                params={{ projectId: String(projectId) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t({ id: 'common.editProject', defaultMessage: 'Edit project' })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/manage/challenge/new"
                search={{ projectId: Number(projectId) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t({ id: 'common.addChallenge', defaultMessage: 'Add challenge' })}
              </Link>
            </DropdownMenuItem>
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleExportCsv(projectId)}
                className="flex cursor-pointer items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                {t({ id: 'common.exportCsv', defaultMessage: 'Export CSV' })}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/manage/project/${projectId}`
                void navigator.clipboard.writeText(url)
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t({ id: 'common.copyUrl', defaultMessage: 'Copy URL' })}
            </DropdownMenuItem>
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleArchiveProject(projectId, proj.isArchived ?? false)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {proj.isArchived
                  ? t({ id: 'common.unarchiveProject', defaultMessage: 'Unarchive project' })
                  : t({ id: 'common.archiveProject', defaultMessage: 'Archive project' })}
              </DropdownMenuItem>
            )}
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleDeleteProject(projectId, proj.displayName || proj.name)}
                className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t({ id: 'common.deleteProject', defaultMessage: 'Delete project' })}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className={cn('grid h-full grid-cols-1 gap-6', showPanel ? 'lg:grid-cols-4' : '')}>
        {showPanel && (
          <aside className="h-full min-h-0 overflow-hidden">
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
              <div className="flex items-start justify-between px-6 pt-6 pb-2">
                <div className="space-y-2.5">
                  <h2 className="font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
                    {t({ id: 'manageProjects.content.aboutTitle', defaultMessage: 'About Projects' })}
                  </h2>
                  <p className="text-pretty text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
                    {t({ id: 'manageProjects.content.aboutDescription', defaultMessage: 'Good project structure improves mapper clarity, QA consistency, and long-term maintenance.' }
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setShowPanel(false)}
                  title={t({ id: 'common.hidePanel', defaultMessage: 'Hide panel' })}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
                <div className="space-y-4 text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t({ id: 'manageProjects.content.tipScopeTitle', defaultMessage: 'Define scope early' })}
                    </p>
                    <p>
                      {t({ id: 'manageProjects.content.tipScopeBody', defaultMessage: 'Use a stable naming pattern (region, theme, version) and keep each project focused on one clear objective.' }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t({ id: 'manageProjects.content.tipPublishTitle', defaultMessage: 'Publish intentionally' }
                      )}
                    </p>
                    <p>
                      {t({ id: 'manageProjects.content.tipPublishBody', defaultMessage: 'Keep projects non-discoverable while iterating. Turn discoverable on only after instructions and QA checks are validated.' }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t({ id: 'manageProjects.content.tipOwnershipTitle', defaultMessage: 'Share ownership' })}
                    </p>
                    <p>
                      {t({ id: 'manageProjects.content.tipOwnershipBody', defaultMessage: 'Add co-managers before launch so triage, support, and archival responsibilities are covered.' }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-zinc-200/50 border-t bg-zinc-50/50 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  {t({ id: 'manageProjects.content.helpfulDocs', defaultMessage: 'Helpful Docs' })}
                </p>
                <div className="space-y-2">
                  <DocsLink
                    icon={<BookOpen className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t({ id: 'manageProjects.content.learnHub', defaultMessage: 'Learn Hub' })}
                  </DocsLink>
                  <DocsLink
                    page="creatingAChallenge"
                    icon={<Users className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t({ id: 'manageProjects.content.challengeCreation', defaultMessage: 'Challenge Creation' })}
                  </DocsLink>
                  <DocsLink
                    page="projectsAndProjectManagers"
                    icon={<FolderKanban className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t({ id: 'manageProjects.content.projectManagement', defaultMessage: 'Project Management' })}
                  </DocsLink>
                </div>
              </div>
            </div>
          </aside>
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
                placeholder={t({ id: 'common.searchProjects', defaultMessage: 'Search projects...' })}
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
                  onExportCsv={handleExportCsv}
                  onArchiveProject={handleArchiveProject}
                  onDeleteProject={handleDeleteProject}
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
                      {t({ id: 'manageProjects.content.noProjectsDescription', defaultMessage: 'Get started by creating your first project.' }
                      )}
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
                    const counts =
                      projectId != null ? challengeCountsByProjectId[projectId] : undefined
                    const challengeMeta: ChallengeMeta = {
                      totalChallenges: counts?.total ?? 0,
                      pinned: 0,
                      completed: counts?.completed ?? 0,
                    }
                    return (
                      <ProjectCard
                        project={proj}
                        challengeMeta={challengeMeta}
                        linkTo="/manage/project/$projectId"
                        linkParams={{ projectId: String(projectId) }}
                        actions={buildProjectActions(proj, isPinned)}
                      />
                    )
                  }}
                  getItemKey={(proj) => proj.id ?? crypto.randomUUID()}
                  emptyState={{
                    icon: FolderKanban,
                    title: t({ id: 'common.noProjectsFound', defaultMessage: 'No projects found' }),
                    description: t({ id: 'manageProjects.content.noProjectsDescriptionShort', defaultMessage: 'Get started by creating your first project' }
                    ),
                    actionLabel: t({ id: 'common.createProject', defaultMessage: 'Create Project' }),
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

      <AlertDialog
        open={!!deleteProjectConfirm}
        onOpenChange={(open) => !open && setDeleteProjectConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ id: 'common.deleteProject2', defaultMessage: 'Delete project?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({ id: 'manageProjects.content.deleteProjectDescription', defaultMessage: 'This will delete the project "{projectName}" and all its challenges and tasks. This action cannot be undone.' }, { projectName: deleteProjectConfirm?.projectName ?? '' }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t({ id: 'common.cancel', defaultMessage: 'Cancel' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t({ id: 'common.delete', defaultMessage: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
