import { Link } from '@tanstack/react-router'
import { ChevronRight, FolderOpen, ListTodo, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api'
import { DEFAULT_WORLD_BOUNDS } from '@/components/Map/mapUtils'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { getStatusLabel } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'

const cardClassName = cn(
  'group flex items-start justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4',
  'transition-all duration-200 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-md',
  'dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
)

export const FindFeatureByName = () => {
  const { t } = useIntl()
  const { searchQuery, onResultSelect } = useGlobalSearchContext()
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const trimmed = searchQuery.trim()
  const hasSearchQuery = trimmed.length > 0

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed)
    }, 300)
    return () => clearTimeout(timer)
  }, [trimmed])

  // Default queries (shown when no search text)
  const defaultChallenges = api.challenge.exploreChallenges({
    bounds: DEFAULT_WORLD_BOUNDS,
    limit: 5,
  })
  const defaultProjects = api.project.featuredProjects({ limit: 5 })

  // Unified search query (single request for all types)
  const searchResult = api.search.unifiedSearch({ q: debouncedQuery })

  // Pick data source based on whether user is searching
  const projects = hasSearchQuery
    ? (searchResult.data?.projects ?? [])
    : (defaultProjects.data ?? [])
  const challenges = hasSearchQuery
    ? (searchResult.data?.challenges ?? [])
    : (defaultChallenges.data ?? [])
  const tasks = hasSearchQuery ? (searchResult.data?.tasks ?? []) : []

  const isLoading = hasSearchQuery
    ? searchResult.isLoading
    : defaultChallenges.isLoading || defaultProjects.isLoading

  const isFetching = hasSearchQuery
    ? searchResult.isFetching
    : defaultChallenges.isFetching || defaultProjects.isFetching

  const isDebouncePending = trimmed !== debouncedQuery
  const totalResults = challenges.length + projects.length + tasks.length

  return (
    <div className="relative space-y-6">
      {/* Loading indicator sticky at top while fetching */}
      {(isFetching || isDebouncePending) && !isLoading && totalResults > 0 && (
        <div className="-mx-3 -mt-3 sticky top-0 z-10 flex items-center justify-center gap-2 bg-white/90 py-2 backdrop-blur-sm dark:bg-slate-950/90">
          <Spinner className="h-4 w-4 text-blue-500" />
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t('common.updatingResults', undefined, 'Updating results...')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Spinner className="h-8 w-8 text-blue-500" />
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t('common.loading2', undefined, 'Loading...')}
          </p>
        </div>
      ) : totalResults === 0 && hasSearchQuery ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="space-y-1 text-center">
            <p className="font-medium text-sm text-zinc-900 dark:text-white">
              {t('common.noResultsFound', undefined, 'No results found')}
            </p>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'appLayout.header.globalSearch.findFeatureByName.nothingMatches',
                { query: debouncedQuery },
                'Nothing matches "{query}"'
              )}
            </p>
          </div>
        </div>
      ) : (
        <>
          {projects.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
                  {hasSearchQuery
                    ? t('common.projects', undefined, 'Projects')
                    : t(
                        'appLayout.header.globalSearch.findFeatureByName.featuredProjects',
                        undefined,
                        'Featured Projects'
                      )}
                </h3>
                <span className="text-xs text-zinc-500 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findFeatureByName.resultCount',
                    { count: projects.length },
                    '{count, plural, one {# result} other {# results}}'
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {projects.map((project) => (
                  <Link
                    key={`p-${project.id}`}
                    to="/manage/project/$projectId"
                    params={{ projectId: String(project.id) }}
                    onClick={onResultSelect}
                    className={cardClassName}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <FolderOpen className="h-5 w-5 shrink-0 text-zinc-400 dark:text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {project.displayName || project.name}
                        </h3>
                        {project.description && (
                          <p className="line-clamp-1 text-xs text-zinc-500 dark:text-slate-400">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {challenges.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
                  {hasSearchQuery
                    ? t('common.challenges', undefined, 'Challenges')
                    : t(
                        'appLayout.header.globalSearch.findFeatureByName.exploreChallenges',
                        undefined,
                        'Explore Challenges'
                      )}
                </h3>
                <span className="text-xs text-zinc-500 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findFeatureByName.resultCount',
                    { count: challenges.length },
                    '{count, plural, one {# result} other {# results}}'
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {challenges.map((challenge) => (
                  <Link
                    key={`c-${challenge.id}`}
                    to="/manage/challenge/$challengeId"
                    params={{ challengeId: String(challenge.id) }}
                    onClick={onResultSelect}
                    className={cardClassName}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Trophy className="h-5 w-5 shrink-0 text-zinc-400 dark:text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {challenge.name}
                        </h3>
                        {challenge.description && (
                          <p className="line-clamp-1 text-xs text-zinc-500 dark:text-slate-400">
                            {challenge.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
                  {t('common.tasks', undefined, 'Tasks')}
                </h3>
                <span className="text-xs text-zinc-500 dark:text-slate-400">
                  {t(
                    'appLayout.header.globalSearch.findFeatureByName.resultCount',
                    { count: tasks.length },
                    '{count, plural, one {# result} other {# results}}'
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const statusLabel =
                    getStatusLabel(t, task.status ?? -1) ||
                    t('common.unknown', undefined, 'Unknown')
                  return (
                    <Link
                      key={`t-${task.id}`}
                      to={`/challenge/${task.parent}/task/${task.id}` as string}
                      onClick={onResultSelect}
                      className={cardClassName}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ListTodo className="h-5 w-5 shrink-0 text-zinc-400 dark:text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {task.name}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-slate-400">
                            {task.challengeName} &middot; {statusLabel}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
