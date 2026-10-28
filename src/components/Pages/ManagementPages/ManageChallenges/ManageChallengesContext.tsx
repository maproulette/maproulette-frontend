import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import {
  buildPropertiesWithPinnedChallenges,
  getPinnedChallengeIds,
} from '@/components/Pages/ManagementPages/ManageProjects/pinnedProjects'
import { useAuthContext } from '@/contexts/AuthContext'
import { isSuperUser } from '@/lib/SuperAdminGuard'
import type { ChallengeListing } from '@/types/Challenge'

export interface ManageChallengesContextType {
  // Data
  challenges: ChallengeListing[]
  isLoading: boolean
  pinnedChallengeIds: number[]

  // Pagination
  isFetching: boolean
  hasNextPage: boolean
  loadMore: () => void

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  onlyDiscoverable: boolean
  setOnlyDiscoverable: (value: boolean) => void
  onlyArchived: boolean
  setOnlyArchived: (value: boolean) => void
  onlyOwned: boolean
  setOnlyOwned: (value: boolean) => void
  onlyPinned: boolean
  setOnlyPinned: (value: boolean) => void

  // Delete dialog
  deleteChallengeId: number | null
  setDeleteChallengeId: (id: number | null) => void
  confirmDeleteChallenge: () => void

  // Actions
  toggleChallengePin: (challengeId: number) => void
  toggleChallengeEnabled: (challenge: ChallengeListing) => void
  togglePaused: (challenge: ChallengeListing) => void
  archiveChallenge: (challenge: ChallengeListing) => void
  rebuildChallengeId: number | null
  setRebuildChallengeId: (id: number | null) => void
}

const PAGE_SIZE = 20

const ManageChallengesContext = createContext<ManageChallengesContextType | undefined>(undefined)

export const ManageChallengesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyDiscoverable, setOnlyDiscoverable] = useState(false)
  const [onlyArchived, setOnlyArchived] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [deleteChallengeId, setDeleteChallengeId] = useState<number | null>(null)
  const [rebuildChallengeId, setRebuildChallengeId] = useState<number | null>(null)

  // API queries
  const superUser = isSuperUser(user)
  const { data: managedProjects, isLoading: isLoadingProjects } = api.project.getManagedProjects({
    limit: -1,
    enabled: !!user && !superUser,
  })
  const managedProjectIds = useMemo(
    () => managedProjects?.map((p) => p.id).filter((id): id is number => id != null) ?? [],
    [managedProjects]
  )
  const pinnedChallengeIds = useMemo(() => getPinnedChallengeIds(user), [user])
  const canList =
    !!user &&
    (superUser || managedProjectIds.length > 0) &&
    (!onlyPinned || pinnedChallengeIds.length > 0)
  const {
    data,
    isLoading: isLoadingChallenges,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = api.challenge.listingInfinite(
    superUser ? [] : managedProjectIds,
    {
      searchString: searchQuery,
      onlyEnabled: onlyDiscoverable,
      onlyArchived,
      onlyOwned,
      challengeIds: onlyPinned ? pinnedChallengeIds.join(',') : '',
    },
    {
      limit: PAGE_SIZE,
      enabled: canList,
    }
  )
  const challenges = useMemo(() => (canList ? (data?.pages.flat() ?? []) : []), [canList, data])
  const isLoading = (!superUser && isLoadingProjects) || isLoadingChallenges

  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  // Mutations
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const deleteChallengeMutation = api.challenge.useDeleteChallenge()
  const archiveChallengeMutation = api.challenge.useArchiveChallenge()
  const pauseChallengeMutation = api.challenge.usePauseChallenge()
  const updateChallengeMutation = api.challenge.useUpdateChallenge()

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
    (challenge: ChallengeListing) => {
      if (challenge.id == null) return
      updateChallengeMutation.mutate({
        challengeId: challenge.id,
        updates: { enabled: !(challenge.enabled ?? false) },
      })
    },
    [updateChallengeMutation]
  )

  const archiveChallenge = useCallback(
    (challenge: ChallengeListing) => {
      if (challenge.id == null) return
      archiveChallengeMutation.mutate({
        challengeId: challenge.id,
        isArchived: !(challenge.isArchived ?? false),
      })
    },
    [archiveChallengeMutation]
  )

  const togglePaused = useCallback(
    (challenge: ChallengeListing) => {
      if (challenge.id == null) return
      pauseChallengeMutation.mutate({
        challengeId: challenge.id,
        paused: !(challenge.paused ?? false),
      })
    },
    [pauseChallengeMutation]
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<ManageChallengesContextType>(
    () => ({
      challenges,
      isLoading,
      isFetching,
      hasNextPage,
      loadMore,
      pinnedChallengeIds,
      searchQuery,
      setSearchQuery,
      onlyDiscoverable,
      setOnlyDiscoverable,
      onlyArchived,
      setOnlyArchived,
      onlyOwned,
      setOnlyOwned,
      onlyPinned,
      setOnlyPinned,
      deleteChallengeId,
      setDeleteChallengeId,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallengeId,
      setRebuildChallengeId,
    }),
    [
      challenges,
      isLoading,
      isFetching,
      hasNextPage,
      loadMore,
      pinnedChallengeIds,
      searchQuery,
      onlyDiscoverable,
      onlyArchived,
      onlyOwned,
      onlyPinned,
      deleteChallengeId,
      confirmDeleteChallenge,
      toggleChallengePin,
      toggleChallengeEnabled,
      togglePaused,
      archiveChallenge,
      rebuildChallengeId,
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
