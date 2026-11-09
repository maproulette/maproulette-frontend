import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import { useManageActionErrors } from '@/components/Pages/ManagementPages/shared/useManageActionErrors'
import { useAuthContext } from '@/contexts/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Project } from '@/types/Project'
import { buildPropertiesWithPinnedProjects, getPinnedProjectIds } from './pinnedProjects'
import { useProjectChallengeCounts } from './useProjectChallengeCounts'

type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 20

const useManageProjectsState = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [onlyEnabled, setOnlyEnabled] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyShowArchived, setOnlyShowArchived] = useState(false)
  const [onlyShowPinned, setOnlyShowPinned] = useState(false)
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
  const actionErrors = useManageActionErrors()

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
      updateProjectMutation.mutate(
        {
          projectId,
          updates: { isArchived: !isArchived } as Partial<Project>,
        },
        { onError: actionErrors.projectSave }
      )
    },
    [updateProjectMutation, actionErrors]
  )

  const updateProject = useCallback(
    (projectId: number, updates: Partial<Project>) => {
      updateProjectMutation.mutate({ projectId, updates }, { onError: actionErrors.projectSave })
    },
    [updateProjectMutation, actionErrors]
  )

  const handleDeleteProject = useCallback((projectId: number, projectName: string) => {
    setDeleteProjectConfirm({ projectId, projectName })
  }, [])

  const confirmDeleteProject = useCallback(() => {
    if (!deleteProjectConfirm) return
    deleteProjectMutation.mutate(
      { projectId: deleteProjectConfirm.projectId },
      { onSettled: () => setDeleteProjectConfirm(null), onError: actionErrors.projectDelete }
    )
  }, [deleteProjectConfirm, deleteProjectMutation, actionErrors])

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
  return useMemo(
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
}

type ManageProjectsContextType = ReturnType<typeof useManageProjectsState>
const ManageProjectsContext = createContext<ManageProjectsContextType | undefined>(undefined)

export const ManageProjectsProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ManageProjectsContext.Provider value={useManageProjectsState()}>
      {children}
    </ManageProjectsContext.Provider>
  )
}

export const useManageProjectsContext = () => {
  const context = useContext(ManageProjectsContext)
  if (context === undefined) {
    throw new Error('useManageProjectsContext must be used within a ManageProjectsProvider')
  }
  return context
}
