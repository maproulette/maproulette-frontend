import { useNavigate, useParams } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import {
  buildPropertiesWithPinnedChallenges,
  getPinnedChallengeIds,
} from '@/components/Pages/ManagementPages/ManageProjects/pinnedProjects'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSetPageTitleContext } from '@/contexts/PageTitleContext'
import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'

export interface ManageProjectDetailContextType {
  // Data
  projectId: string
  project: Project | undefined
  projectData: Project | undefined
  isLoadingProject: boolean
  challenges: Challenge[] | undefined
  isLoadingChallenges: boolean
  filteredChallenges: Challenge[]
  challengeSummary: { total: number; enabled: number; tasksRemaining: number }
  pinnedChallengeIds: number[]

  // Filter state
  searchQuery: string
  setSearchQuery: (query: string) => void
  onlyDiscoverable: boolean
  setOnlyDiscoverable: (value: boolean) => void
  onlyArchived: boolean
  setOnlyArchived: (value: boolean) => void
  onlyPinned: boolean
  setOnlyPinned: (value: boolean) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Modal state
  cloneModalChallenge: { id: number; name: string } | null
  setCloneModalChallenge: (challenge: { id: number; name: string } | null) => void
  rebuildModalChallenge: Challenge | null
  setRebuildModalChallenge: (challenge: Challenge | null) => void
  deleteChallengeId: number | null
  setDeleteChallengeId: (id: number | null) => void
  deleteProjectConfirm: boolean
  setDeleteProjectConfirm: (open: boolean) => void

  // Handlers
  handleArchiveProject: () => void
  handleToggleEnabled: () => void
  confirmDeleteProject: () => void
  confirmDeleteChallenge: () => void
  toggleChallengePin: (challengeId: number) => void
  toggleChallengeEnabled: (challenge: Challenge) => void
  togglePaused: (challengeId: number, paused: boolean) => void
  archiveChallenge: (challengeId: number, isArchived: boolean) => void
  rebuildChallenge: (challengeId: number) => void
}

const ManageProjectDetailContext = createContext<ManageProjectDetailContextType | undefined>(
  undefined
)

export const useManageProjectDetailContext = () => {
  const context = useContext(ManageProjectDetailContext)
  if (!context) {
    throw new Error('useManageProjectDetailContext must be used within ManageProjectDetailProvider')
  }
  return context
}

export const ManageProjectDetailProvider = ({ children }: { children: ReactNode }) => {
  const { projectId } = useParams({ from: '/_app/manage/project/$projectId/' })
  const navigate = useNavigate()
  const { user } = useAuthContext()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false)
  const [cloneModalChallenge, setCloneModalChallenge] = useState<{
    id: number
    name: string
  } | null>(null)
  const [rebuildModalChallenge, setRebuildModalChallenge] = useState<Challenge | null>(null)
  const [deleteChallengeId, setDeleteChallengeId] = useState<number | null>(null)
  const [onlyDiscoverable, setOnlyDiscoverable] = useState(false)
  const [onlyArchived, setOnlyArchived] = useState(false)
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // API queries
  const { data: projectData, isLoading: isLoadingProject } = api.project.getProject(
    Number(projectId)
  )
  useSetPageTitleContext(projectData?.displayName || projectData?.name || null)

  const { data: challenges, isLoading: isLoadingChallenges } = api.project.getProjectChallenges(
    Number(projectId)
  )

  // API mutations
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const updateProjectMutation = api.project.useUpdateProject()
  const deleteProjectMutation = api.project.useDeleteProject()
  const deleteChallengeMutation = api.challenge.useDeleteChallenge()
  const archiveChallengeMutation = api.challenge.useArchiveChallenge()
  const pauseChallengeMutation = api.challenge.usePauseChallenge()
  const updateChallengeMutation = api.challenge.useUpdateChallenge()

  // Derived values
  const pinnedChallengeIds = useMemo(() => getPinnedChallengeIds(user), [user])

  const filteredChallenges = useMemo(() => {
    const list = challenges
      ?.filter((challenge) => challenge.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((challenge) => (onlyDiscoverable ? !!challenge.enabled : true))
      .filter((challenge) => (onlyArchived ? !!challenge.isArchived : true))
      .filter((challenge) =>
        onlyPinned
          ? challenge.id != null
            ? pinnedChallengeIds.includes(challenge.id)
            : false
          : true
      )
    if (!list?.length) return list ?? []
    const set = new Set(pinnedChallengeIds)
    return [...list].sort((a, b) => {
      const aPinned = a.id != null && set.has(a.id) ? 1 : 0
      const bPinned = b.id != null && set.has(b.id) ? 1 : 0
      return bPinned - aPinned
    })
  }, [challenges, searchQuery, pinnedChallengeIds, onlyDiscoverable, onlyArchived, onlyPinned])

  const challengeSummary = useMemo(() => {
    const list = challenges ?? []
    return {
      total: list.length,
      enabled: list.filter((c) => c.enabled).length,
      tasksRemaining: list.reduce((sum, c) => sum + (c.completionMetrics?.tasksRemaining ?? 0), 0),
    }
  }, [challenges])

  const project = projectData as Project | undefined

  // All useCallback hooks below are stored in the context value — stable references
  // prevent all context consumers from re-rendering on every provider render.
  const handleArchiveProject = useCallback(() => {
    if (projectData?.id == null) return
    updateProjectMutation.mutate({
      projectId: projectData.id,
      updates: { isArchived: !(project?.isArchived ?? false) },
    })
  }, [projectData?.id, project?.isArchived, updateProjectMutation])

  const handleToggleEnabled = useCallback(() => {
    if (projectData?.id == null) return
    updateProjectMutation.mutate({
      projectId: projectData.id,
      updates: { enabled: !(project?.enabled ?? false) },
    })
  }, [projectData?.id, project?.enabled, updateProjectMutation])

  const confirmDeleteProject = useCallback(() => {
    if (projectData?.id == null) return
    deleteProjectMutation.mutate(
      { projectId: projectData.id },
      {
        onSettled: () => setDeleteProjectConfirm(false),
        onSuccess: () => navigate({ to: '/manage/projects' }),
      }
    )
  }, [projectData?.id, deleteProjectMutation, navigate])

  const confirmDeleteChallenge = useCallback(() => {
    if (deleteChallengeId == null) return
    deleteChallengeMutation.mutate(deleteChallengeId, {
      onSettled: () => setDeleteChallengeId(null),
    })
  }, [deleteChallengeId, deleteChallengeMutation])

  const toggleChallengePin = useCallback(
    (challengeId: number) => {
      if (!user?.id) return
      const next = pinnedChallengeIds.includes(challengeId)
        ? pinnedChallengeIds.filter((id) => id !== challengeId)
        : [...pinnedChallengeIds, challengeId]
      const properties = buildPropertiesWithPinnedChallenges(user, next)
      updateSettingsMutation.mutate({
        userId: user.id,
        settings: user.settings ?? {},
        properties,
      })
    },
    [user, pinnedChallengeIds, updateSettingsMutation]
  )

  const toggleChallengeEnabled = useCallback(
    (challenge: Challenge) => {
      if (challenge.id == null) return
      updateChallengeMutation.mutate({
        challengeId: challenge.id,
        updates: { enabled: !(challenge.enabled ?? false) },
      })
    },
    [updateChallengeMutation]
  )

  const archiveChallenge = useCallback(
    (challengeId: number, isArchived: boolean) => {
      archiveChallengeMutation.mutate({ challengeId, isArchived: !isArchived })
    },
    [archiveChallengeMutation]
  )

  const togglePaused = useCallback(
    (challengeId: number, paused: boolean) => {
      pauseChallengeMutation.mutate({ challengeId, paused: !paused })
    },
    [pauseChallengeMutation]
  )

  const rebuildChallenge = useCallback(
    (challengeId: number) => {
      const challenge = challenges?.find((c) => c.id === challengeId)
      if (challenge) setRebuildModalChallenge(challenge)
    },
    [challenges]
  )

  // Reason: context value must be stable to prevent unnecessary consumer re-renders
  const value = useMemo<ManageProjectDetailContextType>(
    () => ({
      projectId,
      project,
      projectData,
      isLoadingProject,
      challenges,
      isLoadingChallenges,
      filteredChallenges,
      challengeSummary,
      pinnedChallengeIds,
      searchQuery,
      setSearchQuery,
      onlyDiscoverable,
      setOnlyDiscoverable,
      onlyArchived,
      setOnlyArchived,
      onlyPinned,
      setOnlyPinned,
      viewMode,
      setViewMode,
      cloneModalChallenge,
      setCloneModalChallenge,
      rebuildModalChallenge,
      setRebuildModalChallenge,
      deleteChallengeId,
      setDeleteChallengeId,
      deleteProjectConfirm,
      setDeleteProjectConfirm,
      handleArchiveProject,
      handleToggleEnabled,
      confirmDeleteProject,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallenge,
    }),
    [
      projectId,
      project,
      projectData,
      isLoadingProject,
      challenges,
      isLoadingChallenges,
      filteredChallenges,
      challengeSummary,
      pinnedChallengeIds,
      searchQuery,
      onlyDiscoverable,
      onlyArchived,
      onlyPinned,
      viewMode,
      cloneModalChallenge,
      rebuildModalChallenge,
      deleteChallengeId,
      deleteProjectConfirm,
      handleArchiveProject,
      handleToggleEnabled,
      confirmDeleteProject,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallenge,
    ]
  )

  return (
    <ManageProjectDetailContext.Provider value={value}>
      {children}
    </ManageProjectDetailContext.Provider>
  )
}
