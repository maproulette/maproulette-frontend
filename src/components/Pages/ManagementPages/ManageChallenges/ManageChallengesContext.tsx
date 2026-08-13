import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import {
  buildPropertiesWithPinnedChallenges,
  getPinnedChallengeIds,
} from '@/components/Pages/ManagementPages/ManageProjects/pinnedProjects'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Challenge } from '@/types/Challenge'

export interface ManageChallengesContextType {
  // Data
  challenges: Challenge[]
  filteredChallenges: Challenge[]
  isLoading: boolean
  pinnedChallengeIds: number[]

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  onlyDiscoverable: boolean
  setOnlyDiscoverable: (value: boolean) => void
  onlyArchived: boolean
  setOnlyArchived: (value: boolean) => void
  onlyPinned: boolean
  setOnlyPinned: (value: boolean) => void

  // Delete dialog
  deleteChallengeId: number | null
  setDeleteChallengeId: (id: number | null) => void
  confirmDeleteChallenge: () => void

  // Actions
  toggleChallengePin: (challengeId: number) => void
  toggleChallengeEnabled: (challenge: Challenge) => void
  togglePaused: (challenge: Challenge) => void
  archiveChallenge: (challenge: Challenge) => void
  rebuildChallenge: (challengeId: number) => void
}

const ManageChallengesContext = createContext<ManageChallengesContextType | undefined>(undefined)

export const ManageChallengesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyDiscoverable, setOnlyDiscoverable] = useState(false)
  const [onlyArchived, setOnlyArchived] = useState(false)
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [deleteChallengeId, setDeleteChallengeId] = useState<number | null>(null)

  // API queries
  const { data: managedProjects, isLoading: isLoadingProjects } = api.project.getManagedProjects()
  const managedProjectIds = useMemo(
    () => managedProjects?.map((p) => p.id).filter((id): id is number => id != null) ?? [],
    [managedProjects]
  )
  const { data: challenges, isLoading: isLoadingChallenges } = api.challenge.listing(
    managedProjectIds,
    100,
    0,
    false
  )
  const isLoading = isLoadingProjects || isLoadingChallenges

  // Mutations
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const deleteChallengeMutation = api.challenge.useDeleteChallenge()
  const archiveChallengeMutation = api.challenge.useArchiveChallenge()
  const pauseChallengeMutation = api.challenge.usePauseChallenge()
  const rebuildChallengeMutation = api.challenge.useRebuildChallenge()
  const updateChallengeMutation = api.challenge.useUpdateChallenge()

  const pinnedChallengeIds = useMemo(() => getPinnedChallengeIds(user), [user])

  // All useCallback hooks below are stored in the context value — stable references
  // prevent all context consumers from re-rendering on every provider render.
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

  const confirmDeleteChallenge = useCallback(() => {
    if (deleteChallengeId == null) return
    deleteChallengeMutation.mutate(deleteChallengeId, {
      onSettled: () => setDeleteChallengeId(null),
    })
  }, [deleteChallengeId, deleteChallengeMutation])

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
    (challenge: Challenge) => {
      if (challenge.id == null) return
      archiveChallengeMutation.mutate({
        challengeId: challenge.id,
        isArchived: !(challenge.isArchived ?? false),
      })
    },
    [archiveChallengeMutation]
  )

  const togglePaused = useCallback(
    (challenge: Challenge) => {
      if (challenge.id == null) return
      pauseChallengeMutation.mutate({
        challengeId: challenge.id,
        paused: !(challenge.paused ?? false),
      })
    },
    [pauseChallengeMutation]
  )

  const rebuildChallenge = useCallback(
    (challengeId: number) => {
      rebuildChallengeMutation.mutate({ challengeId })
    },
    [rebuildChallengeMutation]
  )

  const filteredChallenges = useMemo(() => {
    const list = challenges ?? []
    return list
      .filter((challenge) => challenge.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((challenge) => (onlyDiscoverable ? !!challenge.enabled : true))
      .filter((challenge) => (onlyArchived ? !!challenge.isArchived : true))
      .filter((challenge) =>
        onlyPinned
          ? challenge.id != null
            ? pinnedChallengeIds.includes(challenge.id)
            : false
          : true
      )
  }, [challenges, searchQuery, onlyDiscoverable, onlyArchived, onlyPinned, pinnedChallengeIds])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<ManageChallengesContextType>(
    () => ({
      challenges: challenges ?? [],
      filteredChallenges,
      isLoading,
      pinnedChallengeIds,
      searchQuery,
      setSearchQuery,
      onlyDiscoverable,
      setOnlyDiscoverable,
      onlyArchived,
      setOnlyArchived,
      onlyPinned,
      setOnlyPinned,
      deleteChallengeId,
      setDeleteChallengeId,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallenge,
    }),
    [
      challenges,
      filteredChallenges,
      isLoading,
      pinnedChallengeIds,
      searchQuery,
      onlyDiscoverable,
      onlyArchived,
      onlyPinned,
      deleteChallengeId,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallenge,
    ]
  )

  return (
    <ManageChallengesContext.Provider value={value}>{children}</ManageChallengesContext.Provider>
  )
}

export const useManageChallengesContext = () => {
  const context = useContext(ManageChallengesContext)
  if (context === undefined) {
    throw new Error('useManageChallengesContext must be used within a ManageChallengesProvider')
  }
  return context
}
