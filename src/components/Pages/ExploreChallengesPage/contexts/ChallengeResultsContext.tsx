import type { ReactNode } from 'react'
import { createContext, useContext, useMemo } from 'react'
import { api } from '@/api'
import type { Challenge } from '@/types/Challenge'
import { useExploreChallengesSearchContext } from './ExploreChallengesSearchContext'

interface ChallengeResultsContextType {
  challenges: Challenge[]
  isLoading: boolean
  isLoadingState: boolean
  showEmptyState: boolean
  showErrorState: boolean | Error | null
  error: Error | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

const ChallengeResultsContext = createContext<ChallengeResultsContextType | undefined>(undefined)

interface ChallengeResultsProviderProps {
  children: ReactNode
}

export const ChallengeResultsContextProvider = ({ children }: ChallengeResultsProviderProps) => {
  const { extendedFindParams, isLocationLoading, hasEmptyPlaceIntersection } =
    useExploreChallengesSearchContext()
  // The map has been moved clear of the selected place: nothing can match, so
  // there is nothing to ask the server for.
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.challenge.exploreChallengesInfinite(extendedFindParams, {
      enabled: !hasEmptyPlaceIntersection,
    })

  // Stable reference for flattened pages — used as dependency for derived state below.
  // A skipped query still carries the previous page data as placeholder, which
  // would show challenges from before the map left the place.
  const challenges = useMemo(
    () => (hasEmptyPlaceIntersection ? [] : (data?.pages.flat() ?? [])),
    [data, hasEmptyPlaceIntersection]
  )

  // Only show full loading overlay on initial load (no data yet), not on background refetches
  const isLoadingState = (isLoading && challenges.length === 0) || isLocationLoading
  const showEmptyState = !isLoadingState && challenges.length === 0 && !error
  const showErrorState = !isLoadingState && error

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<ChallengeResultsContextType>(
    () => ({
      challenges,
      isLoading,
      isLoadingState,
      showEmptyState,
      showErrorState,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    }),
    [
      challenges,
      isLoading,
      isLoadingState,
      showEmptyState,
      showErrorState,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    ]
  )

  return (
    <ChallengeResultsContext.Provider value={value}>{children}</ChallengeResultsContext.Provider>
  )
}

export const useChallengeResultsContext = () => {
  const context = useContext(ChallengeResultsContext)
  if (context === undefined) {
    throw new Error('useChallengeResults must be used within a ChallengeResultsProvider')
  }
  return context
}
