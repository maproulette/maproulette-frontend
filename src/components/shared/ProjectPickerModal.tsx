import { Archive, Eye, Pin, User } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import { ProjectsTableView } from '@/components/Pages/ManagementPages/ManageProjects/ProjectsTableView'
import { getPinnedProjectIds } from '@/components/Pages/ManagementPages/ManageProjects/pinnedProjects'
import { useProjectChallengeCounts } from '@/components/Pages/ManagementPages/ManageProjects/useProjectChallengeCounts'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { ProjectCard } from '@/components/shared/ProjectCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { ViewModeToggle } from '@/components/shared/ViewModeToggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import type { Project } from '@/types/Project'

const PAGE_SIZE = 20

interface ProjectPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProjectId?: number
  onSelectProject: (project: Project) => void
  title?: string
  description?: string
  excludeProjectIds?: number[]
  closeOnSelect?: boolean
  disabled?: boolean
  children?: ReactNode
}

export const ProjectPickerModal = ({
  open,
  onOpenChange,
  selectedProjectId,
  onSelectProject,
  title,
  description,
  excludeProjectIds,
  closeOnSelect = true,
  disabled = false,
  children,
}: ProjectPickerModalProps) => {
  const { t } = useIntl()
  const resolvedTitle = title ?? t('common.selectAProject', undefined, 'Select a project')
  const resolvedDescription =
    description ??
    t(
      'shared.projectPickerModal.description',
      undefined,
      'Choose the project this challenge belongs to.'
    )
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyEnabled, setOnlyEnabled] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyShowArchived, setOnlyShowArchived] = useState(false)
  const [onlyShowPinned, setOnlyShowPinned] = useState(false)
  const [loadedPages, setLoadedPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Reset pagination when server-side filters change so a narrower result set
  // doesn't keep an oversized limit from a prior search.
  useEffect(() => {
    setLoadedPages(1)
  }, [searchQuery, onlyEnabled, onlyOwned])

  const {
    data: projects,
    isLoading,
    isFetching,
  } = api.project.getManagedProjects({
    limit: PAGE_SIZE * loadedPages,
    page: 0,
    searchString: searchQuery,
    onlyEnabled,
    onlyOwned,
    enabled: open,
  })

  const hasNextPage = (projects?.length ?? 0) >= PAGE_SIZE * loadedPages
  const challengeCountsByProjectId = useProjectChallengeCounts(projects, { enabled: open })

  const { user } = useAuthContext()
  const pinnedProjectIds = useMemo(() => getPinnedProjectIds(user), [user])
  const excluded = useMemo(() => new Set(excludeProjectIds ?? []), [excludeProjectIds])

  const projectsToShow = useMemo(() => {
    const list = projects ?? []
    const set = new Set(pinnedProjectIds)
    const sorted = [...list].sort((a, b) => {
      const aPinned = a.id != null && set.has(a.id) ? 1 : 0
      const bPinned = b.id != null && set.has(b.id) ? 1 : 0
      return bPinned - aPinned
    })
    const filtered = sorted.filter(
      (p) => (p.isArchived ?? false) === onlyShowArchived && !(p.id != null && excluded.has(p.id))
    )
    if (onlyShowPinned) {
      return filtered.filter((p) => p.id != null && set.has(p.id))
    }
    return filtered
  }, [projects, pinnedProjectIds, onlyShowArchived, onlyShowPinned, excluded])

  const handleSelect = (project: Project) => {
    onSelectProject(project)
    if (closeOnSelect) onOpenChange(false)
  }

  const hasActiveFilters = onlyEnabled || onlyOwned || onlyShowPinned || onlyShowArchived

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
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
            hasActiveFilters={hasActiveFilters}
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

        <fieldset
          disabled={disabled}
          className="m-0 min-h-0 min-w-0 flex-1 overflow-y-auto border-0 p-0 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Spinner size="lg" className="text-zinc-400" />
            </div>
          ) : projectsToShow.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-slate-700 dark:text-zinc-400">
              {t('shared.projectPickerModal.noProjectsFound', undefined, 'No projects found.')}
            </div>
          ) : viewMode === 'list' ? (
            <ProjectsTableView
              projects={projectsToShow}
              challengeCountsByProjectId={challengeCountsByProjectId}
              pinnedProjectIds={pinnedProjectIds}
              onSelectProject={handleSelect}
              selectedProjectId={selectedProjectId}
            />
          ) : (
            <div
              className="grid gap-4 p-1"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
            >
              {projectsToShow.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  challengeMeta={{
                    totalChallenges:
                      project.id != null ? (challengeCountsByProjectId[project.id]?.total ?? 0) : 0,
                    pinned: 0,
                    completed:
                      project.id != null
                        ? (challengeCountsByProjectId[project.id]?.completed ?? 0)
                        : 0,
                  }}
                  onSelect={() => handleSelect(project)}
                  selected={project.id != null && project.id === selectedProjectId}
                />
              ))}
            </div>
          )}

          {!isLoading && projectsToShow.length > 0 && (
            <LoadMoreFooter
              hasNextPage={hasNextPage}
              isFetching={isFetching}
              onLoadMore={() => setLoadedPages((p) => p + 1)}
              showEndOfList={false}
              size="sm"
              className="p-3"
            />
          )}
        </fieldset>
        {children}
      </DialogContent>
    </Dialog>
  )
}
