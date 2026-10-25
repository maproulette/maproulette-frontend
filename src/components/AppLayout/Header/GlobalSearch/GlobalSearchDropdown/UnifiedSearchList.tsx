import { Link } from '@tanstack/react-router'
import { ChevronRight, FolderOpen, type LucideIcon, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { ChallengeGetResponse } from '@/types/Challenge'
import type { Project } from '@/types/Project'
import { useAllSearchTypes, useFilteredSearchTypes } from '../shared/searchTypes'

interface SearchResultItem {
  id: string
  type: 'project' | 'challenge' | 'searchType'
  title: string
  icon: LucideIcon
  badge?: { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
  href?: string
  params?: Record<string, string>
  onClick?: () => void
}

const badgeVariants = {
  default: 'bg-zinc-100 text-zinc-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export const UnifiedSearchList = () => {
  const { t } = useIntl()
  const { searchQuery, onResultSelect, onSelectSearchType, isOpen } = useGlobalSearchContext()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const trimmedQuery = searchQuery.trim()
  const hasSearchQuery = trimmedQuery.length > 0

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [trimmedQuery])

  const { data: rawProjects, isLoading: isLoadingProjects } = api.project.searchProjects({
    search: debouncedQuery,
  })
  const projects = Array.isArray(rawProjects) ? rawProjects : []

  const { data: rawChallenges, isLoading: isLoadingChallenges } = api.challenge.searchChallenges({
    search: debouncedQuery,
  })
  const challenges = Array.isArray(rawChallenges) ? rawChallenges : []

  const { data: featuredProjectsData = [], isLoading: isLoadingFeaturedProjects } =
    api.project.featuredProjects({ limit: 2 })

  const { data: featuredChallengesData, isLoading: isLoadingFeatured } =
    api.challenge.featuredChallenges({
      limit: 2,
    })

  const featuredChallenges: ChallengeGetResponse[] = Array.isArray(featuredChallengesData)
    ? featuredChallengesData
    : featuredChallengesData
      ? [featuredChallengesData as ChallengeGetResponse]
      : []

  const allSearchTypes = useAllSearchTypes()
  const filteredSearchTypes = useFilteredSearchTypes(trimmedQuery, allSearchTypes)

  // Reason: builds unified search results array from multiple data sources - avoids rebuilding on every render
  const allItems = useMemo<SearchResultItem[]>(() => {
    const resultItems: SearchResultItem[] = []

    if (hasSearchQuery) {
      if (!isLoadingProjects) {
        projects.slice(0, 2).forEach((project: Project) => {
          resultItems.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.displayName || project.name,
            icon: FolderOpen,
            badge: {
              variant: 'default',
              label: t(
                'appLayout.header.globalSearch.unifiedList.goToProject',
                undefined,
                'Go to project'
              ),
            },
            href: '/project/$projectId',
            params: { projectId: String(project.id) },
            onClick: onResultSelect,
          })
        })
      }

      if (!isLoadingChallenges) {
        challenges.slice(0, 2).forEach((challenge: ChallengeGetResponse) => {
          resultItems.push({
            id: `challenge-${challenge.id}`,
            type: 'challenge',
            title: challenge.name,
            icon: Target,
            badge: {
              variant: 'default',
              label: t(
                'appLayout.header.globalSearch.unifiedList.goToChallenge',
                undefined,
                'Go to challenge'
              ),
            },
            href: '/challenge/$challengeId',
            params: { challengeId: String(challenge.id) },
            onClick: onResultSelect,
          })
        })
      }
    } else {
      if (!isLoadingFeaturedProjects) {
        featuredProjectsData.forEach((project: Project) => {
          resultItems.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.displayName || project.name,
            icon: FolderOpen,
            badge: {
              variant: 'default',
              label: t(
                'appLayout.header.globalSearch.unifiedList.goToProject',
                undefined,
                'Go to project'
              ),
            },
            href: '/project/$projectId',
            params: { projectId: String(project.id) },
            onClick: onResultSelect,
          })
        })
      }

      if (!isLoadingFeatured) {
        featuredChallenges.forEach((challenge: ChallengeGetResponse) => {
          resultItems.push({
            id: `challenge-${challenge.id}`,
            type: 'challenge',
            title: challenge.name,
            icon: Target,
            badge: {
              variant: 'default',
              label: t(
                'appLayout.header.globalSearch.unifiedList.goToChallenge',
                undefined,
                'Go to challenge'
              ),
            },
            href: '/challenge/$challengeId',
            params: { challengeId: String(challenge.id) },
            onClick: onResultSelect,
          })
        })
      }
    }

    filteredSearchTypes.forEach((searchType) => {
      resultItems.push({
        id: `searchType-${searchType.id}`,
        type: 'searchType',
        title: searchType.label,
        icon: searchType.icon,
        onClick: () =>
          onSelectSearchType({
            id: searchType.id,
            label: searchType.label,
            description: searchType.description,
            prefix: searchType.prefix,
          }),
      })
    })

    return resultItems
  }, [
    projects,
    challenges,
    featuredProjectsData,
    featuredChallenges,
    filteredSearchTypes,
    isLoadingProjects,
    isLoadingChallenges,
    isLoadingFeaturedProjects,
    isLoadingFeatured,
    hasSearchQuery,
    onResultSelect,
    onSelectSearchType,
    t,
  ])

  useEffect(() => {
    setSelectedIndex(allItems.length > 0 ? 0 : -1)
  }, [allItems.length])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (allItems.length === 0) return

      // Only handle if the search input or dropdown is focused
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement?.tagName === 'INPUT' && activeElement.getAttribute('type') === 'search'
      const isDropdownFocused = activeElement?.closest('[role="listbox"]')

      if (!isInputFocused && !isDropdownFocused) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, allItems.length - 1)
          requestAnimationFrame(() => {
            document.querySelector(`[data-item-index="${next}"]`)?.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            })
          })
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          requestAnimationFrame(() => {
            document.querySelector(`[data-item-index="${next}"]`)?.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            })
          })
          return next
        })
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        const item = allItems[selectedIndex]
        if (item.type === 'searchType') {
          item.onClick?.()
        } else if (item.href) {
          document
            .querySelector<HTMLAnchorElement>(`[data-item-index="${selectedIndex}"] a`)
            ?.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [allItems, selectedIndex, isOpen])

  const isDebouncePending = trimmedQuery !== debouncedQuery
  const isLoading = hasSearchQuery
    ? isDebouncePending || isLoadingProjects || isLoadingChallenges
    : isLoadingFeatured || isLoadingFeaturedProjects

  if (allItems.length === 0 && !isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t('common.noResultsFound', undefined, 'No results found')}
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {isLoading && (
        <li className="flex items-center justify-center py-2">
          <Spinner className="text-emerald-600" />
        </li>
      )}
      {allItems.map((item, index) => {
        const Icon = item.icon
        const isSelected = index === selectedIndex

        if (item.type === 'searchType') {
          return (
            <li key={item.id} data-item-index={index}>
              <button
                type="button"
                onClick={item.onClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    item.onClick?.()
                  }
                }}
                tabIndex={-1}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'group w-full cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-colors',
                  isSelected
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10'
                    : 'border-transparent hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-900/10'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-zinc-100 group-hover:bg-emerald-100 dark:bg-slate-800 dark:group-hover:bg-emerald-900/30'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 transition-colors',
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-600 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400'
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'truncate font-medium text-sm transition-colors',
                      isSelected
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300'
                    )}
                  >
                    {item.title}
                  </span>
                </div>
              </button>
            </li>
          )
        }

        if (!item.href) {
          return null
        }

        return (
          <li key={item.id} data-item-index={index}>
            <Link
              to={item.href}
              params={item.params}
              onClick={item.onClick}
              onMouseEnter={() => setSelectedIndex(index)}
              tabIndex={-1}
              className={cn(
                'group flex items-center justify-between rounded-lg border px-3 py-2',
                'transition-all duration-200',
                isSelected
                  ? 'border-emerald-200 bg-emerald-50 shadow-md dark:border-emerald-900/50 dark:bg-emerald-900/10'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className={cn(
                    'shrink-0 rounded-md p-1.5 transition-colors',
                    isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-zinc-100 dark:bg-slate-800'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        'flex-1 truncate font-medium text-sm transition-colors',
                        isSelected
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-zinc-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400'
                      )}
                    >
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 font-medium text-xs',
                          badgeVariants[item.badge.variant || 'default']
                        )}
                      >
                        {item.badge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-slate-500 dark:group-hover:text-emerald-400" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
