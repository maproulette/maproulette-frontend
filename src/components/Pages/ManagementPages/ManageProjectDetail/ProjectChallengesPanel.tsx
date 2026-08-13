import { Archive, Eye, ListChecks, Pin } from 'lucide-react'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { SearchBar } from '@/components/shared/SearchBar'
import { ViewModeToggle } from '@/components/shared/ViewModeToggle'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { ChallengeCardActions } from './ChallengeCardActions'
import { ChallengesTableView } from './ChallengesTableView'
import { useManageProjectDetailContext } from './ManageProjectDetailContext'

/** Right-hand panel of the project detail page: search/filter toolbar and the challenge list/grid. */
export const ProjectChallengesPanel = () => {
  const { t } = useIntl()
  const {
    projectId,
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
    filteredChallenges,
    pinnedChallengeIds,
    toggleChallengePin: onTogglePin,
    toggleChallengeEnabled: onToggleEnabled,
    togglePaused: onTogglePaused,
    setCloneModalChallenge: onClone,
    archiveChallenge: onArchive,
    rebuildChallenge: onRebuild,
    setDeleteChallengeId: onDelete,
  } = useManageProjectDetailContext()

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col pl-2">
      <div className="shrink-0 pb-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('common.searchChallenges', undefined, 'Search challenges…')}
            className="w-full sm:max-w-xs"
          />
          <FilterToggle
            label={t('common.discoverable', undefined, 'Discoverable')}
            icon={Eye}
            checked={onlyDiscoverable}
            onCheckedChange={setOnlyDiscoverable}
          />
          <FilterToggle
            label={t('common.archived', undefined, 'Archived')}
            icon={Archive}
            checked={onlyArchived}
            onCheckedChange={setOnlyArchived}
          />
          <FilterToggle
            label={t('common.pinned', undefined, 'Pinned')}
            icon={Pin}
            checked={onlyPinned}
            onCheckedChange={setOnlyPinned}
          />
          <ClearManageFiltersButton
            hasActiveFilters={onlyDiscoverable || onlyArchived || onlyPinned}
            onClear={() => {
              setOnlyDiscoverable(false)
              setOnlyArchived(false)
              setOnlyPinned(false)
            }}
          />
          <div className="ml-auto">
            <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          filteredChallenges.length > 0 ? (
            <ChallengesTableView
              challenges={filteredChallenges}
              pinnedChallengeIds={pinnedChallengeIds}
              onTogglePin={onTogglePin}
              onToggleEnabled={onToggleEnabled}
              onTogglePaused={onTogglePaused}
              onClone={onClone}
              onArchive={onArchive}
              onRebuild={onRebuild}
              onDelete={onDelete}
            />
          ) : (
            <EntityGrid
              items={[]}
              renderItem={() => null}
              getItemKey={() => ''}
              emptyState={{
                icon: ListChecks,
                title: t('common.noChallengesFound', undefined, 'No challenges found'),
                description: t(
                  'manageProjectDetail.content.emptyDescription',
                  undefined,
                  'Get started by creating your first challenge'
                ),
                actionLabel: t(
                  'manageProjectDetail.content.createChallenge',
                  undefined,
                  'Create Challenge'
                ),
                actionTo: '/manage/challenge/new',
                actionSearch: { projectId: Number(projectId) },
              }}
            />
          )
        ) : (
          <div
            className={cn(
              'grid gap-4',
              filteredChallenges && filteredChallenges.length > 0
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            )}
          >
            <EntityGrid
              items={filteredChallenges || []}
              renderItem={(challenge) => {
                const isPinned = challenge.id != null && pinnedChallengeIds.includes(challenge.id)
                return (
                  <ChallengeCard
                    challenge={challenge}
                    linkTo="/manage/challenge/$challengeId"
                    linkParams={{ challengeId: String(challenge.id) }}
                    actions={
                      <ChallengeCardActions
                        challenge={challenge}
                        isPinned={isPinned}
                        onTogglePin={onTogglePin}
                        onToggleEnabled={onToggleEnabled}
                        onTogglePaused={onTogglePaused}
                        onClone={onClone}
                        onArchive={onArchive}
                        onRebuild={onRebuild}
                        onDelete={onDelete}
                      />
                    }
                  />
                )
              }}
              getItemKey={(challenge) => challenge.id ?? crypto.randomUUID()}
              emptyState={{
                icon: ListChecks,
                title: t('common.noChallengesFound', undefined, 'No challenges found'),
                description: t(
                  'manageProjectDetail.content.emptyDescription',
                  undefined,
                  'Get started by creating your first challenge'
                ),
                actionLabel: t(
                  'manageProjectDetail.content.createChallenge',
                  undefined,
                  'Create Challenge'
                ),
                actionTo: '/manage/challenge/new',
                actionSearch: { projectId: Number(projectId) },
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
