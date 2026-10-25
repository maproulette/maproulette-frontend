import { Link } from '@tanstack/react-router'
import { ChevronRight, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/Project'

export const FindProject = () => {
  const { t } = useIntl()
  const { searchQuery, onResultSelect } = useGlobalSearchContext()
  const [limit, setLimit] = useState(5)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const trimmedSearchQuery = searchQuery.trim()
  const hasSearchQuery = trimmedSearchQuery.length > 0

  const searchQueryResult = api.project.searchProjects({ search: trimmedSearchQuery })
  const featuredQueryResult = api.project.featuredProjects({ limit: 50 })

  const rawData = hasSearchQuery ? searchQueryResult.data : featuredQueryResult.data
  const isLoading = hasSearchQuery ? searchQueryResult.isLoading : featuredQueryResult.isLoading
  const isFetching = hasSearchQuery ? searchQueryResult.isFetching : featuredQueryResult.isFetching

  // Reason: Avoids re-slicing raw data array on every render when data and limit haven't changed
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return []
    return rawData.slice(0, limit)
  }, [rawData, limit])

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
                'appLayout.header.globalSearch.findProject.resultCount',
                { count: data.length },
                '{count, plural, one {# project} other {# projects}}'
              )}
            </span>
          )}
        </div>

        <div className="relative">
          {isLoadingMore && isFetching && results.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" className="text-blue-500" />
                <p className="text-sm text-zinc-600 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findProject.loadingMore',
                    undefined,
                    'Loading more projects...'
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pb-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Spinner size="lg" className="text-blue-500" />
                <p className="text-sm text-zinc-500 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findProject.loading',
                    undefined,
                    'Loading projects...'
                  )}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
                  <Search className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white">
                    {t('common.noProjectsFound', undefined, 'No projects found')}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    {t(
                      'appLayout.header.globalSearch.findProject.noResultsHint',
                      undefined,
                      'Try a different search term'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {results.map((result: Project) => (
                  <Link
                    key={result.id}
                    to="/project/$projectId"
                    params={{ projectId: String(result.id) }}
                    onClick={onResultSelect}
                    className={cn(
                      'group flex items-start justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4',
                      'transition-all duration-200 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-md',
                      'dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {result.displayName || result.name}
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
                            'appLayout.header.globalSearch.findProject.noMoreToLoad',
                            undefined,
                            'No more projects to load'
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
