import { Link } from '@tanstack/react-router'
import { ChevronRight, FolderOpen, Hash, ListTodo, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

const cardClassName = cn(
  'group stretched-link-container flex items-start justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4',
  'transition-all duration-200 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-md',
  'dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
)

export const FindById = () => {
  const { t } = useIntl()
  const { searchQuery, onResultSelect } = useGlobalSearchContext()
  const [debouncedId, setDebouncedId] = useState(0)
  const trimmed = searchQuery.trim()
  const numericId = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : 0

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedId(numericId)
    }, 300)
    return () => clearTimeout(timer)
  }, [numericId])

  // Single unified ID lookup
  const { data, isLoading, isFetching } = api.search.searchById({ id: debouncedId })
  const isDebouncePending = numericId !== debouncedId

  if (!numericId && trimmed.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
          <Hash className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-medium text-sm text-zinc-900 dark:text-white">
            {t(
              'appLayout.header.globalSearch.findById.enterNumericId',
              undefined,
              'Enter a numeric ID'
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findById.typeIdHint',
              undefined,
              'Type a project, challenge, or task ID number'
            )}
          </p>
        </div>
      </div>
    )
  }

  if (!numericId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
          <Hash className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-medium text-sm text-zinc-900 dark:text-white">
            {t('common.findByMaprouletteId', undefined, 'Find by MapRoulette ID')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findById.hint',
              undefined,
              'Enter a numeric ID to find a project, challenge, or task'
            )}
          </p>
        </div>
      </div>
    )
  }

  const results: Array<{
    type: 'project' | 'challenge' | 'task'
    label: string
    name: string
    href: string
    params: Record<string, string>
    icon: typeof FolderOpen
  }> = []

  if (data?.project) {
    results.push({
      type: 'project',
      label: t('common.project', undefined, 'Project'),
      name:
        data.project.displayName ||
        data.project.name ||
        t('common.projectWithId', { id: debouncedId }, 'Project #{id}'),
      href: '/project/$projectId',
      params: { projectId: String(debouncedId) },
      icon: FolderOpen,
    })
  }

  if (data?.challenge) {
    results.push({
      type: 'challenge',
      label: t('common.challenge', undefined, 'Challenge'),
      name:
        data.challenge.name || t('common.challengeWithId', { id: debouncedId }, 'Challenge #{id}'),
      href: '/challenge/$challengeId',
      params: { challengeId: String(debouncedId) },
      icon: Target,
    })
  }

  if (data?.task) {
    results.push({
      type: 'task',
      label: t('common.task', undefined, 'Task'),
      name: data.task.name || t('common.taskWithId', { id: debouncedId }, 'Task #{id}'),
      href: '/tasks/$taskId',
      params: {
        taskId: String(debouncedId),
      },
      icon: ListTodo,
    })
  }

  return (
    <div className="space-y-4">
      {/* Loading indicator sticky at top while fetching */}
      {(isFetching || isDebouncePending) && !isLoading && results.length > 0 && (
        <div className="-mx-3 -mt-3 sticky top-0 z-10 flex items-center justify-center gap-2 bg-white/90 py-2 backdrop-blur-sm dark:bg-slate-950/90">
          <Spinner className="text-blue-500" />
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t('common.updatingResults', undefined, 'Updating results...')}
          </p>
        </div>
      )}

      {isLoading || isDebouncePending ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Spinner size="lg" className="text-blue-500" />
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findById.lookingUpId',
              { id: numericId },
              'Looking up ID {id}...'
            )}
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
            <Hash className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-medium text-sm text-zinc-900 dark:text-white">
              {t(
                'appLayout.header.globalSearch.findById.noResults',
                { id: debouncedId },
                'No results for ID {id}'
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'appLayout.header.globalSearch.findById.noResultsHint',
                undefined,
                'No project, challenge, or task found with this ID'
              )}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
              {t(
                'appLayout.header.globalSearch.findById.resultsForId',
                { id: debouncedId },
                'Results for ID {id}'
              )}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'appLayout.header.globalSearch.findById.matchCount',
                { count: results.length },
                '{count, plural, one {# match} other {# matches}}'
              )}
            </span>
          </div>
          <div className="space-y-3">
            {results.map((result) => {
              const Icon = result.icon
              return (
                <div key={result.type} className={cardClassName}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="shrink-0 rounded-md bg-zinc-100 p-2 dark:bg-slate-800">
                      <Icon className="h-4 w-4 text-zinc-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-500 dark:text-slate-400">{result.label}</p>
                      <h3 className="truncate font-semibold text-base text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        <Link
                          to={result.href}
                          params={result.params}
                          onClick={onResultSelect}
                          className="stretched-link"
                        >
                          {result.name}
                        </Link>
                      </h3>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
