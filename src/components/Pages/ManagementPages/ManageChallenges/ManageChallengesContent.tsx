import { Link } from '@tanstack/react-router'
import {
  Archive,
  Copy,
  Eye,
  EyeOff,
  Hammer,
  ListChecks,
  MoreHorizontal,
  PanelLeftOpen,
  Pause,
  Pencil,
  Pin,
  Play,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { ChallengeCard } from '@/components/shared/ChallengeCard'
import { ClearManageFiltersButton } from '@/components/shared/ClearManageFiltersButton'
import { EntityGrid } from '@/components/shared/EntityGrid'
import { FilterToggle } from '@/components/shared/FilterToggle'
import { SearchBar } from '@/components/shared/SearchBar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useSetHeaderActions } from '@/contexts/ChromeContext'
import { useIntl } from '@/i18n'
import { isStartableChallengeStatus } from '@/lib/challengeStatus'
import { cn } from '@/lib/utils'
import type { ChallengeListing } from '@/types/Challenge'
import { ManageInfoPanel } from '../shared/ManageInfoPanel'
import { useManageChallengesContext } from './ManageChallengesContext'

export const ManageChallengesContent = () => {
  const { t } = useIntl()
  const {
    filteredChallenges,
    projectNamesById,
    isLoading,
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
    rebuildChallenge,
  } = useManageChallengesContext()

  const [showPanel, setShowPanel] = useState(true)

  useSetHeaderActions(
    <Link to="/manage/challenge/new">
      <Button size="sm" className="gap-1.5 rounded-full">
        <Plus className="h-4 w-4" />
        {t('common.createChallenge', undefined, 'Create Challenge')}
      </Button>
    </Link>
  )

  const buildChallengeActions = (challenge: ChallengeListing, isPinned: boolean) => {
    const canStart = isStartableChallengeStatus(challenge.status)
    return (
      <div className="flex items-center gap-1">
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              togglePaused(challenge)
            }}
            title={
              challenge.paused
                ? t('common.resumeChallenge', undefined, 'Resume challenge')
                : t('common.pauseChallenge', undefined, 'Pause challenge')
            }
            aria-label={
              challenge.paused
                ? t('common.resumeChallenge', undefined, 'Resume challenge')
                : t('common.pauseChallenge', undefined, 'Pause challenge')
            }
          >
            <Pause
              className={cn(
                'h-4 w-4',
                challenge.paused
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              archiveChallenge(challenge)
            }}
            title={
              challenge.isArchived
                ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                : t('common.archiveChallenge', undefined, 'Archive challenge')
            }
            aria-label={
              challenge.isArchived
                ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                : t('common.archiveChallenge', undefined, 'Archive challenge')
            }
          >
            <Archive
              className={cn(
                'h-4 w-4',
                challenge.isArchived
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
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
                ? t('common.unpinChallenge', undefined, 'Unpin challenge')
                : t('common.pinChallenge', undefined, 'Pin challenge')
            }
            aria-label={
              isPinned
                ? t('common.unpinChallenge', undefined, 'Unpin challenge')
                : t('common.pinChallenge', undefined, 'Pin challenge')
            }
          >
            <Pin
              className={cn(
                'h-4 w-4',
                isPinned
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400'
              )}
            />
          </Button>
        )}
        {challenge.id != null && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault()
              toggleChallengeEnabled(challenge)
            }}
            title={
              challenge.enabled
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
            }
            aria-label={
              challenge.enabled
                ? t('common.makeNotDiscoverable', undefined, 'Make not discoverable')
                : t('common.makeDiscoverable', undefined, 'Make discoverable')
            }
          >
            {challenge.enabled ? (
              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400" />
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('common.openMenu', undefined, 'Open menu')}</span>
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
                  {t('common.startChallenge', undefined, 'Start challenge')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                to="/manage/challenge/$challengeId/edit"
                params={{ challengeId: String(challenge.id) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t('common.editChallenge', undefined, 'Edit challenge')}
              </Link>
            </DropdownMenuItem>
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => archiveChallenge(challenge)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {challenge.isArchived
                  ? t('common.unarchiveChallenge', undefined, 'Unarchive challenge')
                  : t('common.archiveChallenge', undefined, 'Archive challenge')}
              </DropdownMenuItem>
            )}
            {challenge.id != null && (
              <DropdownMenuItem
                onClick={() => rebuildChallenge(challenge.id)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Hammer className="h-4 w-4" />
                {t('common.rebuildTasks', undefined, 'Rebuild tasks')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/challenge/${challenge.id}`
                void navigator.clipboard.writeText(url)
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {t('common.copyUrl', undefined, 'Copy URL')}
            </DropdownMenuItem>
            {challenge.id != null && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteChallengeId(challenge.id)}
                  className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.deleteChallenge', undefined, 'Delete challenge')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className={cn('grid h-full grid-cols-1 gap-6', showPanel ? 'lg:grid-cols-3' : '')}>
        {showPanel && (
          <ManageInfoPanel
            title={t('manageChallenges.content.aboutChallengesTitle')}
            description={t('manageChallenges.content.aboutChallengesBody')}
            sections={[
              {
                id: 'manageChallenges.content.tipWriteClearInstructionsTitle',
                title: t('manageChallenges.content.tipWriteClearInstructionsTitle'),
                description: t('manageChallenges.content.tipWriteClearInstructionsBody'),
              },
              {
                id: 'manageChallenges.content.tipSetDifficultyTitle',
                title: t('manageChallenges.content.tipSetDifficultyTitle'),
                description: t('manageChallenges.content.tipSetDifficultyBody'),
              },
              {
                id: 'manageChallenges.content.tipMonitorProgressTitle',
                title: t('manageChallenges.content.tipMonitorProgressTitle'),
                description: t('manageChallenges.content.tipMonitorProgressBody'),
              },
            ]}
            docs={[
              {
                page: 'creatingAChallenge',
                text: t('manageChallenges.content.challengeCreationGuideLink'),
              },
              {
                page: 'taskPriorityRules',
                text: t('manageChallenges.content.taskPriorityRulesLink'),
              },
              {
                page: 'bulkEditingChallenges',
                text: t('manageChallenges.content.bulkEditingLink'),
              },
            ]}
            onClose={() => setShowPanel(false)}
          />
        )}

        <div
          className={cn('flex h-full min-h-0 min-w-0 flex-col', showPanel ? 'lg:col-span-2' : '')}
        >
          <div className="shrink-0 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {!showPanel && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowPanel(true)}
                  title={t('common.showPanel', undefined, 'Show panel')}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('common.searchChallenges2', undefined, 'Search challenges...')}
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
                label={t('common.owned', undefined, 'Owned')}
                icon={User}
                checked={onlyOwned}
                onCheckedChange={setOnlyOwned}
              />
              <FilterToggle
                label={t('common.pinned', undefined, 'Pinned')}
                icon={Pin}
                checked={onlyPinned}
                onCheckedChange={setOnlyPinned}
              />
              <ClearManageFiltersButton
                hasActiveFilters={onlyDiscoverable || onlyArchived || onlyOwned || onlyPinned}
                onClear={() => {
                  setOnlyDiscoverable(false)
                  setOnlyArchived(false)
                  setOnlyOwned(false)
                  setOnlyPinned(false)
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
            >
              {!isLoading && (
                <EntityGrid
                  items={filteredChallenges || []}
                  renderItem={(challenge) => {
                    const isPinned =
                      challenge.id != null && pinnedChallengeIds.includes(challenge.id)
                    return (
                      <ChallengeCard
                        challenge={challenge}
                        parentName={projectNamesById.get(challenge.parent)}
                        linkTo="/manage/challenge/$challengeId"
                        linkParams={{ challengeId: challenge.id.toString() }}
                        actions={buildChallengeActions(challenge, isPinned)}
                      />
                    )
                  }}
                  getItemKey={(challenge) => challenge.id ?? crypto.randomUUID()}
                  emptyState={{
                    icon: ListChecks,
                    title: t('common.noChallengesFound', undefined, 'No challenges found'),
                    description: t(
                      'manageChallenges.content.emptyDescription',
                      undefined,
                      "You haven't created any challenges yet"
                    ),
                    actionLabel: t('common.createChallenge', undefined, 'Create Challenge'),
                    actionTo: '/manage/challenge/new',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <AlertDialog
        open={deleteChallengeId != null}
        onOpenChange={(open) => !open && setDeleteChallengeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.deleteChallenge2', undefined, 'Delete challenge?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'common.deleteChallengeWarning',
                undefined,
                'This will delete this challenge and all its tasks. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChallenge}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
