import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Project } from '@/types/Project'
import { buildPropertiesWithPinnedProjects, getPinnedProjectIds } from './pinnedProjects'
import { useProjectChallengeCounts } from './useProjectChallengeCounts'

type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 20

interface ManageProjectsContextType {
  // Query state
  projects: Project[]
  projectsToShow: Project[]
  isLoading: boolean
  isFetching: boolean
  hasNextPage: boolean

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  onlyEnabled: boolean
  setOnlyEnabled: (value: boolean) => void
  onlyOwned: boolean
  setOnlyOwned: (value: boolean) => void
  onlyShowArchived: boolean
  setOnlyShowArchived: (value: boolean) => void
  onlyShowPinned: boolean
  setOnlyShowPinned: (value: boolean) => void

  // View state
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showPanel: boolean
  setShowPanel: (show: boolean) => void

  // Pagination
  loadMore: () => void

  // Pinned projects
  pinnedProjectIds: number[]
  toggleProjectPin: (projectId: number) => void

  // Challenge counts
  challengeCountsByProjectId: Record<number, { total: number; completed: number }>

  // Mutations
  updateProject: (projectId: number, updates: Partial<Project>) => void
  handleExportCsv: (projectId: number) => void
  handleArchiveProject: (projectId: number, isArchived: boolean) => void

  // Delete confirmation
  deleteProjectConfirm: { projectId: number; projectName: string } | null
  handleDeleteProject: (projectId: number, projectName: string) => void
  confirmDeleteProject: () => void
  setDeleteProjectConfirm: (value: { projectId: number; projectName: string } | null) => void
}

const ManageProjectsContext = createContext<ManageProjectsContextType | undefined>(undefined)

export const ManageProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [onlyEnabled, setOnlyEnabled] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyShowArchived, setOnlyShowArchived] = useState(false)
  const [onlyShowPinned, setOnlyShowPinned] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<{
    projectId: number
    projectName: string
  } | null>(null)

  const debouncedSearchQuery = useDebouncedValue(searchQuery)

  const { user } = useAuthContext()
  const pinnedProjectIds = useMemo(() => getPinnedProjectIds(user), [user])
  const canList = !onlyShowPinned || pinnedProjectIds.length > 0

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
    api.project.managedProjectsInfinite(
      {
        searchString: debouncedSearchQuery,
        onlyEnabled,
        onlyOwned,
        isArchived: onlyShowArchived,
        projectIds: onlyShowPinned ? pinnedProjectIds.join(',') : '',
      },
      { limit: PAGE_SIZE, enabled: canList }
    )
  const projects = useMemo(() => (canList ? (data?.pages.flat() ?? []) : []), [canList, data])

  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const updateProjectMutation = api.project.useUpdateProject()
  const deleteProjectMutation = api.project.useDeleteProject()

  const projectsToShow = useMemo(() => {
    const set = new Set(pinnedProjectIds)
    return [...projects].sort((a, b) => {
      const aPinned = a.id != null && set.has(a.id) ? 1 : 0
      const bPinned = b.id != null && set.has(b.id) ? 1 : 0
      return bPinned - aPinned
    })
  }, [projects, pinnedProjectIds])

  const challengeCountsByProjectId = useProjectChallengeCounts(projects)

  // All useCallback hooks below are stored in the context value — stable references
  // prevent all context consumers from re-rendering on every provider render.
  const handleExportCsv = useCallback(
    (projectId: number) => {
      const name =
        projects.find((p) => p.id === projectId)?.displayName ??
        projects.find((p) => p.id === projectId)?.name
      const safeName = name ? name.replace(/[^a-zA-Z0-9-_]/g, '-') : ''
      void api.project.exportProjectTasksCsv(
        projectId,
        safeName ? `project-${safeName}-tasks.csv` : undefined
      )
    },
    [projects]
  )

  const handleArchiveProject = useCallback(
    (projectId: number, isArchived: boolean) => {
      updateProjectMutation.mutate({
        projectId,
        updates: { isArchived: !isArchived } as Partial<Project>,
      })
    },
    [updateProjectMutation]
  )

  const updateProject = useCallback(
    (projectId: number, updates: Partial<Project>) => {
      updateProjectMutation.mutate({ projectId, updates })
    },
    [updateProjectMutation]
  )

  const handleDeleteProject = useCallback((projectId: number, projectName: string) => {
    setDeleteProjectConfirm({ projectId, projectName })
  }, [])

  const confirmDeleteProject = useCallback(() => {
    if (!deleteProjectConfirm) return
    deleteProjectMutation.mutate(
      { projectId: deleteProjectConfirm.projectId },
      { onSettled: () => setDeleteProjectConfirm(null) }
    )
  }, [deleteProjectConfirm, deleteProjectMutation])

  const toggleProjectPin = useCallback(
    (projectId: number) => {
      if (!user?.id) return
      const next = pinnedProjectIds.includes(projectId)
        ? pinnedProjectIds.filter((id) => id !== projectId)
        : [...pinnedProjectIds, projectId]
      const properties = buildPropertiesWithPinnedProjects(user, next)
      updateSettingsMutation.mutate({
        userId: user.id,
        settings: user.settings ?? {},
        properties,
      })
    },
    [user, pinnedProjectIds, updateSettingsMutation]
  )

  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<ManageProjectsContextType>(
    () => ({
      projects,
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
    }),
    [
      projects,
      projectsToShow,
      isLoading,
      isFetching,
      hasNextPage,
      searchQuery,
      onlyEnabled,
      onlyOwned,
      onlyShowArchived,
      onlyShowPinned,
      viewMode,
      showPanel,
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
    ]
  )

  return <ManageProjectsContext.Provider value={value}>{children}</ManageProjectsContext.Provider>
}

export const useManageProjectsContext = () => {
  const context = useContext(ManageProjectsContext)
  if (context === undefined) {
    throw new Error('useManageProjectsContext must be used within a ManageProjectsProvider')
  }
  return context
}
