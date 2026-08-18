import { Link, useSearch } from '@tanstack/react-router'
import { ChevronRight, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api'
import { DEFAULT_WORLD_BOUNDS } from '@/components/Map/mapUtils'
import type {
  DifficultyLevel,
  WorkOnCategory,
} from '@/components/Pages/ExploreChallengesPage/FilterBar/filterTypes'
import {
  difficultyMap,
  workOnCategoryMap,
} from '@/components/Pages/ExploreChallengesPage/FilterBar/filterUtils'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type {
  Challenge,
  ExploreChallengesParams,
  ExtendedFindParamsSortBy,
} from '@/types/Challenge'

const buildKeywords = (categories: string[], workOn: string): string | undefined => {
  const allKeywords: string[] = []
  if (categories.length > 0) {
    allKeywords.push(...categories)
  }
  if (workOn !== 'Anything') {
    const workOnKeywords = workOnCategoryMap[workOn as keyof typeof workOnCategoryMap]
    if (workOnKeywords && Array.isArray(workOnKeywords)) {
      allKeywords.push(...workOnKeywords)
    }
  }
  return allKeywords.length > 0 ? allKeywords.join(',') : undefined
}

// Reason: FindChallenge renders inside the header on every page (not just the
// Explore Challenges page), so it can't assume the leaf route is '/_app/' — it
// reads from the shared '/_app' layout route instead, same as AuthContext does.
// These params are only actually validated/typed on the '/_app/' route, so the
// result is cast rather than inferred.
type ChallengeExploreSearchParams = {
  difficulty?: DifficultyLevel
  workOn?: WorkOnCategory
  categories?: string
  sortBy?: ExtendedFindParamsSortBy
  global?: boolean
}

export const FindChallenge = () => {
  const { t } = useIntl()
  const { searchQuery, onResultSelect } = useGlobalSearchContext()
  const [limit, setLimit] = useState(5)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    difficulty: urlDifficulty,
    workOn: urlWorkOn,
    categories: urlCategories,
    sortBy: urlSortBy,
    global: urlGlobal,
  } = useSearch({ from: '/_app' }) as ChallengeExploreSearchParams

  // Reason: stable reference prevents unnecessary API refetch when unrelated state changes
  const filters = useMemo<ExploreChallengesParams>(() => {
    const selectedCategories = urlCategories ? urlCategories.split(',').filter(Boolean) : []
    const workOn = urlWorkOn || 'Anything'
    const difficulty = urlDifficulty ? difficultyMap[urlDifficulty] : undefined

    const result: NonNullable<ExploreChallengesParams> = {
      global: urlGlobal ?? false,
      bounds: DEFAULT_WORLD_BOUNDS,
      keywords: buildKeywords(selectedCategories, workOn),
      difficulty,
      limit: limit,
    }
    if (urlSortBy) {
      result.sortBy = urlSortBy
    }
    return result
  }, [urlDifficulty, urlWorkOn, urlCategories, urlSortBy, urlGlobal, limit])

  const trimmedSearchQuery = searchQuery.trim()
  const hasSearchQuery = trimmedSearchQuery.length > 0

  const searchQueryResult = api.challenge.searchChallenges({ search: trimmedSearchQuery })
  const exploreQueryResult = api.challenge.exploreChallenges(filters)

  const rawData = hasSearchQuery ? searchQueryResult.data : exploreQueryResult.data
  const isLoading = hasSearchQuery ? searchQueryResult.isLoading : exploreQueryResult.isLoading
  const isFetching = hasSearchQuery ? searchQueryResult.isFetching : exploreQueryResult.isFetching

  const data = !rawData || !Array.isArray(rawData) ? [] : rawData.slice(0, limit)

  useEffect(() => {
    if (!isFetching && isLoadingMore) {
      setIsLoadingMore(false)
    }
  }, [isFetching, isLoadingMore])

  const results = data ?? []
  const hasMore = data && data.length >= limit

  // Reason: Stable callback reference prevents unnecessary observer re-subscription
  const handleLoadMore = useCallback(() => {
    if (!isFetching && data && data.length >= limit) {
      setIsLoadingMore(true)
      setLimit((prev) => prev + 5)
    }
  }, [isFetching, data, limit])

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [handleLoadMore, hasMore, isFetching])

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
            {t('common.results', undefined, 'Results')}
          </h3>
          {!isLoading && data && data.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'appLayout.header.globalSearch.findChallenge.resultCount',
                { count: data.length },
                '{count, plural, one {# challenge} other {# challenges}}'
              )}
            </span>
          )}
        </div>

        <div className="relative">
          {isLoadingMore && isFetching && results.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
              <div className="flex flex-col items-center gap-3">
                <Spinner className="h-8 w-8 text-blue-500" />
                <p className="text-sm text-zinc-600 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findChallenge.loadingMore',
                    undefined,
                    'Loading more challenges...'
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pb-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Spinner className="h-8 w-8 text-blue-500" />
                <p className="text-sm text-zinc-500 dark:text-slate-400">
                  {t('common.loadingChallenges', undefined, 'Loading challenges...')}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
                  <Search className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white">
                    {t('common.noChallengesFound', undefined, 'No challenges found')}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    {t(
                      'appLayout.header.globalSearch.findChallenge.noResultsHint',
                      undefined,
                      'Try adjusting your filters'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {results.map((result: Challenge) => (
                  <Link
                    key={result.id}
                    to="/challenge/$challengeId"
                    params={{ challengeId: String(result.id) }}
                    onClick={onResultSelect}
                    className={cn(
                      'group flex items-start justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4',
                      'transition-all duration-200 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-md',
                      'dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {result.name}
                      </h3>
                      {result.description && (
                        <p className="line-clamp-2 text-sm text-zinc-600 leading-relaxed dark:text-slate-400">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </Link>
                ))}

                {hasMore && <div ref={loadMoreRef} className="h-4" />}

                {!hasMore && !isLoading && results.length > 0 && (
                  <div className="mt-4 flex justify-center rounded-b-xl border-zinc-200 border-t-2 bg-zinc-50 py-6 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-1.5 w-16 rounded-full bg-zinc-400 dark:bg-slate-600" />
                      <div className="space-y-1 text-center">
                        <p className="font-semibold text-base text-zinc-800 dark:text-slate-200">
                          {t('common.thatsAll', undefined, "That's all!")}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-slate-400">
                          {t(
                            'appLayout.header.globalSearch.findChallenge.noMoreToLoad',
                            undefined,
                            'No more challenges to load'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
