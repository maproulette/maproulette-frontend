import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Project } from '@/types/Project'
import { buildPropertiesWithPinnedProjects, getPinnedProjectIds } from './pinnedProjects'
import { useProjectChallengeCounts } from './useProjectChallengeCounts'

type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 20

const useManageProjectsState = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loadedPages, setLoadedPages] = useState(1)
  const [onlyEnabled, setOnlyEnabled] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyShowArchived, setOnlyShowArchived] = useState(false)
  const [onlyShowPinned, setOnlyShowPinned] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<{
    projectId: number
    projectName: string
  } | null>(null)

  // Reset loaded pages when server-side filters change
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
  })

  const hasNextPage = (projects?.length ?? 0) >= PAGE_SIZE * loadedPages

  const { user } = useAuthContext()
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const updateProjectMutation = api.project.useUpdateProject()
  const deleteProjectMutation = api.project.useDeleteProject()
  const pinnedProjectIds = useMemo(() => getPinnedProjectIds(user), [user])

  const projectsSortedByPinned = useMemo(() => {
    if (!projects?.length) return projects ?? []
    const set = new Set(pinnedProjectIds)
    return [...projects].sort((a, b) => {
      const aPinned = a.id != null && set.has(a.id) ? 1 : 0
      const bPinned = b.id != null && set.has(b.id) ? 1 : 0
      return bPinned - aPinned
    })
  }, [projects, pinnedProjectIds])

  const projectsToShow = useMemo(() => {
    const list = projectsSortedByPinned ?? []
    const byArchived = list.filter((p) => (p.isArchived ?? false) === onlyShowArchived)
    if (onlyShowPinned) {
      return byArchived.filter((p) => p.id != null && pinnedProjectIds.includes(p.id))
    }
    return byArchived
  }, [projectsSortedByPinned, onlyShowArchived, onlyShowPinned, pinnedProjectIds])

  const challengeCountsByProjectId = useProjectChallengeCounts(projects)

  const handleExportCsv = (projectId: number) => {
    const name =
      projects?.find((p) => p.id === projectId)?.displayName ??
      projects?.find((p) => p.id === projectId)?.name
    const safeName = name ? name.replace(/[^a-zA-Z0-9-_]/g, '-') : ''
    void api.project.exportProjectTasksCsv(
      projectId,
      safeName ? `project-${safeName}-tasks.csv` : undefined
    )
  }

  const handleArchiveProject = (projectId: number, isArchived: boolean) => {
    updateProjectMutation.mutate({
      projectId,
      updates: { isArchived: !isArchived } as Partial<Project>,
    })
  }

  const updateProject = (projectId: number, updates: Partial<Project>) => {
    updateProjectMutation.mutate({ projectId, updates })
  }

  const handleDeleteProject = (projectId: number, projectName: string) => {
    setDeleteProjectConfirm({ projectId, projectName })
  }

  const confirmDeleteProject = () => {
    if (!deleteProjectConfirm) return
    deleteProjectMutation.mutate(
      { projectId: deleteProjectConfirm.projectId },
      { onSettled: () => setDeleteProjectConfirm(null) }
    )
  }

  const toggleProjectPin = (projectId: number) => {
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
  }

  const loadMore = () => {
    setLoadedPages((p) => p + 1)
  }

  return {
    projects: projects ?? [],
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
  }
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
