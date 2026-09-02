import { Link } from '@tanstack/react-router'
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  FolderKanban,
  Loader2,
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
import { useSetHeaderActionsContext } from '@/contexts/HeaderActionsContext'
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

  useSetHeaderActionsContext(
    <Link to="/manage/project/new">
      <Button size="sm" className="gap-1.5 rounded-full">
        <Plus className="h-4 w-4" />
        {t('common.createProject', undefined, 'Create Project')}
      </Button>
    </Link>
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
                ? t('common.unpinProject', undefined, 'Unpin project')
                : t('common.pinProject', undefined, 'Pin project')
            }
            aria-label={
              isPinned
                ? t('common.unpinProject', undefined, 'Unpin project')
                : t('common.pinProject', undefined, 'Pin project')
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
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
            }
            aria-label={
              proj.enabled
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
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
              <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
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
                {t('common.viewProject', undefined, 'View project')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/manage/project/$projectId/edit"
                params={{ projectId: String(projectId) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t('common.editProject', undefined, 'Edit project')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/manage/challenge/new"
                search={{ projectId: Number(projectId) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('common.addChallenge', undefined, 'Add challenge')}
              </Link>
            </DropdownMenuItem>
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleExportCsv(projectId)}
                className="flex cursor-pointer items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                {t('common.exportCsv', undefined, 'Export CSV')}
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
              {t('common.copyUrl', undefined, 'Copy URL')}
            </DropdownMenuItem>
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleArchiveProject(projectId, proj.isArchived ?? false)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {proj.isArchived
                  ? t('common.unarchiveProject', undefined, 'Unarchive project')
                  : t('common.archiveProject', undefined, 'Archive project')}
              </DropdownMenuItem>
            )}
            {projectId != null && (
              <DropdownMenuItem
                onClick={() => handleDeleteProject(projectId, proj.displayName || proj.name)}
                className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.deleteProject', undefined, 'Delete project')}
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
                    {t('manageProjects.content.aboutTitle', undefined, 'About Projects')}
                  </h2>
                  <p className="text-pretty text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
                    {t(
                      'manageProjects.content.aboutDescription',
                      undefined,
                      'Good project structure improves mapper clarity, QA consistency, and long-term maintenance.'
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setShowPanel(false)}
                  title={t('common.hidePanel', undefined, 'Hide panel')}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
                <div className="space-y-4 text-sm text-zinc-600 leading-relaxed dark:text-zinc-300">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t('manageProjects.content.tipScopeTitle', undefined, 'Define scope early')}
                    </p>
                    <p>
                      {t(
                        'manageProjects.content.tipScopeBody',
                        undefined,
                        'Use a stable naming pattern (region, theme, version) and keep each project focused on one clear objective.'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t(
                        'manageProjects.content.tipPublishTitle',
                        undefined,
                        'Publish intentionally'
                      )}
                    </p>
                    <p>
                      {t(
                        'manageProjects.content.tipPublishBody',
                        undefined,
                        'Keep projects non-discoverable while iterating. Turn discoverable on only after instructions and QA checks are validated.'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {t('manageProjects.content.tipOwnershipTitle', undefined, 'Share ownership')}
                    </p>
                    <p>
                      {t(
                        'manageProjects.content.tipOwnershipBody',
                        undefined,
                        'Add co-managers before launch so triage, support, and archival responsibilities are covered.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-zinc-200/50 border-t bg-zinc-50/50 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                <p className="mb-1 font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  {t('manageProjects.content.helpfulDocs', undefined, 'Helpful Docs')}
                </p>
                <div className="space-y-2">
                  <DocsLink
                    icon={<BookOpen className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t('manageProjects.content.learnHub', undefined, 'Learn Hub')}
                  </DocsLink>
                  <DocsLink
                    page="creatingAChallenge"
                    icon={<Users className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t('manageProjects.content.challengeCreation', undefined, 'Challenge Creation')}
                  </DocsLink>
                  <DocsLink
                    page="projectsAndProjectManagers"
                    icon={<FolderKanban className="h-3.5 w-3.5 text-zinc-500" />}
                    className={DOCS_LINK_CLASS}
                  >
                    {t('manageProjects.content.projectManagement', undefined, 'Project Management')}
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
                    const count =
                      projectId != null ? (challengeCountsByProjectId[projectId] ?? 0) : 0
                    const challengeMeta: ChallengeMeta = {
                      totalChallenges: count,
                      pinned: 0,
                      completed: 0,
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
                        <Loader2 className="h-4 w-4 animate-spin" />
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

      <AlertDialog
        open={!!deleteProjectConfirm}
        onOpenChange={(open) => !open && setDeleteProjectConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.deleteProject2', undefined, 'Delete project?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'manageProjects.content.deleteProjectDescription',
                { projectName: deleteProjectConfirm?.projectName ?? '' },
                'This will delete the project "{projectName}" and all its challenges and tasks. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
