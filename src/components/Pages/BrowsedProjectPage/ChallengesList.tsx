import { Link } from '@tanstack/react-router'
import { Copy, Eye, ListChecks, MoreHorizontal, Pin, Play } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { api } from '@/api'
import { ChallengesTableView } from '@/components/Pages/BrowsedProjectPage/ChallengesTableView'
import { useBrowsedProjectContext } from '@/components/Pages/BrowsedProjectPage/contexts/BrowsedProjectContext'
import {
  buildPropertiesWithPinnedChallenges,
  getPinnedChallengeIds,
} from '@/components/Pages/ManagementPages/ManageProjects/pinnedProjects'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { SearchBar } from '@/components/shared/SearchBar'
import { ViewModeToggle } from '@/components/shared/ViewModeToggle'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/Challenge'

export const ChallengesList = () => {
  const { t } = useIntl()
  const { project } = useBrowsedProjectContext()
  const { data: challenges = [] } = api.project.getProjectChallenges(project.id)

  const { user } = useAuthContext()
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const pinnedChallengeIds = useMemo(() => getPinnedChallengeIds(user), [user])

  const [searchQuery, setSearchQuery] = useState('')
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

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

  const filteredChallenges = useMemo(() => {
    let result = challenges

    if (!showCompleted) {
      result = result.filter((c) => (c.completionMetrics?.tasksRemaining ?? 0) > 0)
    }

    if (onlyPinned) {
      result = result.filter((c) => c.id != null && pinnedChallengeIds.includes(c.id))
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((c) => c.name.toLowerCase().includes(query))
    }

    const pinned = new Set(pinnedChallengeIds)
    return [...result].sort((a, b) => {
      const aPinned = a.id != null && pinned.has(a.id) ? 1 : 0
      const bPinned = b.id != null && pinned.has(b.id) ? 1 : 0
      return bPinned - aPinned
    })
  }, [challenges, showCompleted, onlyPinned, searchQuery, pinnedChallengeIds])

  const buildChallengeActions = (challenge: Challenge) => {
    const isPinned = challenge.id != null && pinnedChallengeIds.includes(challenge.id)
    const canStart = (challenge.completionMetrics?.tasksRemaining ?? 0) > 0
    return (
      <div className="flex items-center gap-1">
        {user && challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              toggleChallengePin(challenge.id)
            }}
            title={
              isPinned
                ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
                : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
            }
            aria-label={
              isPinned
                ? t({ id: 'common.unpinChallenge', defaultMessage: 'Unpin challenge' })
                : t({ id: 'common.pinChallenge', defaultMessage: 'Pin challenge' })
            }
          >
            <Pin
              className={cn(
                'h-4 w-4',
                isPinned
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-slate-400'
              )}
            />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">
                {t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canStart && (
              <DropdownMenuItem asChild>
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {t({ id: 'common.startChallenge', defaultMessage: 'Start challenge' })}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                to="/challenge/$challengeId"
                params={{ challengeId: String(challenge.id) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {t({ id: 'common.viewChallenge', defaultMessage: 'View challenge' })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/challenge/${challenge.id}`
                void navigator.clipboard.writeText(url)
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t({ id: 'common.copyUrl', defaultMessage: 'Copy URL' })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const hasActiveFilters = onlyPinned || !showCompleted || searchQuery.length > 0

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="shrink-0 pb-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t({ id: 'common.searchChallenges', defaultMessage: 'Search challenges…' })}
            className="w-full sm:max-w-xs"
          />
          {user && (
            <FilterToggle
              label={t({ id: 'common.pinned', defaultMessage: 'Pinned' })}
              icon={Pin}
              checked={onlyPinned}
              onCheckedChange={setOnlyPinned}
            />
          )}
          <FilterToggle
            label={t({
              id: 'browsedProjectPage.challengesList.showCompletedFilter',
              defaultMessage: 'Show completed',
            })}
            icon={ListChecks}
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <ClearManageFiltersButton
            hasActiveFilters={hasActiveFilters}
            onClear={() => {
              setOnlyPinned(false)
              setShowCompleted(true)
              setSearchQuery('')
            }}
          />
          <div className="ml-auto">
            <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' && filteredChallenges.length > 0 ? (
          <ChallengesTableView
            challenges={filteredChallenges}
            renderActions={buildChallengeActions}
          />
        ) : (
          <div
            className={cn(
              'grid gap-4',
              viewMode === 'grid' && filteredChallenges.length > 0
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            )}
          >
            <EntityGrid
              items={filteredChallenges}
              renderItem={(challenge) => (
                <ChallengeCard
                  challenge={challenge}
                  parentName={project.displayName || project.name}
                  linkTo="/challenge/$challengeId"
                  linkParams={{ challengeId: String(challenge.id) }}
                  actions={buildChallengeActions(challenge)}
                />
              )}
              getItemKey={(challenge) => challenge.id ?? crypto.randomUUID()}
              emptyState={{
                icon: ListChecks,
                title: t({ id: 'common.noChallengesFound', defaultMessage: 'No challenges found' }),
                description: hasActiveFilters
                  ? t({
                      id: 'browsedProjectPage.challengesList.emptyDescriptionFiltered',
                      defaultMessage: 'Try clearing the filters to see more results.',
                    })
                  : t({
                      id: 'browsedProjectPage.challengesList.emptyDescription',
                      defaultMessage: 'This project has no challenges yet.',
                    }),
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
